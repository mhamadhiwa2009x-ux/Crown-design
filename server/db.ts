import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, categories, orders, orderItems, storeSettings, InsertOrder, InsertOrderItem, InsertProduct, InsertCategory } from "../drizzle/schema";
import { ENV } from './_core/env';
import { notifyOwner } from './_core/notification';
import { formatIqdAmount } from '../shared/iqd';
import { getCachedPublicData, invalidatePublicData } from './publicDataCache';

const PUBLIC_PRODUCTS_CACHE = 'public-products';
const PUBLIC_CATEGORIES_CACHE = 'public-categories';
const PUBLIC_SETTINGS_CACHE = 'public-settings';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllProducts() {
  try {
    return await getCachedPublicData(PUBLIC_PRODUCTS_CACHE, async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return db
        .select({
          id: products.id,
          name: products.name,
          brand: products.brand,
          description: products.description,
          price: products.price,
          imageUrl: products.imageUrl,
          thumbnailUrl: products.thumbnailUrl,
          categoryId: products.categoryId,
          categoryName: categories.name,
          categoryIconUrl: categories.iconUrl,
          createdAt: products.createdAt,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id));
    });
  } catch (error) {
    console.error("[Database] Failed to get products:", error);
    return [];
  }
}

export async function getAllCategories() {
  try {
    return await getCachedPublicData(PUBLIC_CATEGORIES_CACHE, async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(categories).orderBy(asc(categories.name));
    });
  } catch (error) {
    console.error("[Database] Failed to get categories:", error);
    return [];
  }
}

export async function createCategory(category: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(categories).values(category);
  invalidatePublicData(PUBLIC_CATEGORIES_CACHE, PUBLIC_PRODUCTS_CACHE);
  return (result as any)[0]?.insertId || (result as any).insertId;
}

export async function updateCategory(id: number, category: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(categories).set(category).where(eq(categories.id, id));
  invalidatePublicData(PUBLIC_CATEGORIES_CACHE, PUBLIC_PRODUCTS_CACHE);
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.transaction(async (tx) => {
    await tx.update(products).set({ categoryId: null }).where(eq(products.categoryId, id));
    await tx.delete(categories).where(eq(categories.id, id));
  });
  invalidatePublicData(PUBLIC_CATEGORIES_CACHE, PUBLIC_PRODUCTS_CACHE);
}

export async function createOrder(orderData: InsertOrder, items: InsertOrderItem[]) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(orders).values(orderData as any);
    // Extract the insert ID from the result
    const orderId = (result as any)[0]?.insertId || (result as any).insertId || 1;

    if (items.length > 0) {
      const itemsWithOrderId = items.map(item => ({
        ...item,
        orderId: orderId,
      }));
      await db.insert(orderItems).values(itemsWithOrderId as any);
    }

    // Send notification to admin
    try {
      const itemsText = items.map(item => `- ${item.productName} (${item.productBrand}): ${item.quantity}x د.ع${formatIqdAmount(item.price)}`).join('\n');
      await notifyOwner({
        title: `New Order #${orderId}`,
        content: `Customer: ${orderData.customerName}\nPhone: ${orderData.phone}\nAddress: ${orderData.address}\n\nItems:\n${itemsText}\n\nTotal: د.ع${formatIqdAmount(orderData.totalPrice)}`,
      });
    } catch (notificationError) {
      console.error("[Database] Failed to send order notification:", notificationError);
      // Don't throw - order was created successfully
    }

    return orderId;
  } catch (error) {
    console.error("[Database] Failed to create order:", error);
    throw error;
  }
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get order: database not available");
    return null;
  }

  try {
    const orderResult = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (orderResult.length === 0) return null;

    const itemsResult = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

    return {
      ...orderResult[0],
      items: itemsResult,
    };
  } catch (error) {
    console.error("[Database] Failed to get order:", error);
    return null;
  }
}

export async function getStoreSettings() {
  try {
    return await getCachedPublicData(PUBLIC_SETTINGS_CACHE, async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(storeSettings).limit(1);
      return result.length > 0 ? result[0] : { storeName: "BRAND STORE", storeDescription: "", deliveryPrice: "0" };
    });
  } catch (error) {
    console.error("[Database] Failed to get store settings:", error);
    return { storeName: "BRAND STORE", storeDescription: "", deliveryPrice: "0" };
  }
}

export async function updateStoreSettings(storeName: string, storeDescription?: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const existing = await db.select().from(storeSettings).limit(1);
    if (existing.length === 0) {
      await db.insert(storeSettings).values({ storeName, storeDescription });
    } else {
      await db.update(storeSettings).set({ storeName, storeDescription }).where(eq(storeSettings.id, existing[0].id));
    }
    invalidatePublicData(PUBLIC_SETTINGS_CACHE);
  } catch (error) {
    console.error("[Database] Failed to update store settings:", error);
    throw error;
  }
}

export async function createProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(products).values(product as any);
    invalidatePublicData(PUBLIC_PRODUCTS_CACHE);
    return (result as any)[0]?.insertId || (result as any).insertId;
  } catch (error) {
    console.error("[Database] Failed to create product:", error);
    throw error;
  }
}

export async function updateProduct(id: number, product: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    await db.update(products).set(product).where(eq(products.id, id));
    invalidatePublicData(PUBLIC_PRODUCTS_CACHE);
  } catch (error) {
    console.error("[Database] Failed to update product:", error);
    throw error;
  }
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    await db.delete(products).where(eq(products.id, id));
    invalidatePublicData(PUBLIC_PRODUCTS_CACHE);
  } catch (error) {
    console.error("[Database] Failed to delete product:", error);
    throw error;
  }
}

export async function updateDeliveryPrice(deliveryPrice: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const existing = await db.select().from(storeSettings).limit(1);
    if (existing.length === 0) {
      await db.insert(storeSettings).values({ deliveryPrice: deliveryPrice as any });
    } else {
      await db.update(storeSettings).set({ deliveryPrice: deliveryPrice as any }).where(eq(storeSettings.id, existing[0].id));
    }
    invalidatePublicData(PUBLIC_SETTINGS_CACHE);
  } catch (error) {
    console.error("[Database] Failed to update delivery price:", error);
    throw error;
  }
}
