import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { authorizedAdminProcedure, publicProcedure, router } from "./_core/trpc";
import { getAllProducts, getAllCategories, createCategory, updateCategory, deleteCategory, createOrder, getOrderById, getStoreSettings, updateStoreSettings, updateDeliveryPrice, createProduct, updateProduct, deleteProduct } from "./db";
import { z } from "zod";
import { getDb } from "./db";
import { products } from "../drizzle/schema";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  products: router({
    list: publicProcedure.query(async () => {
      return await getAllProducts();
    }),

    seed: authorizedAdminProcedure.mutation(async () => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        // Check if products already exist
        const existingProducts = await getAllProducts();
        if (existingProducts.length > 0) {
          return { success: true, message: "Products already seeded" };
        }

        // Seed sample products
        const sampleProducts = [
          {
            name: "Premium Wireless Headphones",
            brand: "AudioLux",
            description: "High-fidelity sound with active noise cancellation and 40-hour battery life.",
            price: "299.99",
            imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
          },
          {
            name: "Luxury Leather Watch",
            brand: "ChronoElegance",
            description: "Swiss-made automatic movement with sapphire crystal and leather strap.",
            price: "1299.00",
            imageUrl: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500&h=500&fit=crop",
          },
          {
            name: "Minimalist Sunglasses",
            brand: "VisionPure",
            description: "UV-protected polarized lenses with titanium frames and sleek design.",
            price: "189.99",
            imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop",
          },
          {
            name: "Premium Coffee Maker",
            brand: "BrewMaster",
            description: "Precision temperature control with programmable brewing and thermal carafe.",
            price: "249.99",
            imageUrl: "https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=500&h=500&fit=crop",
          },
          {
            name: "Designer Backpack",
            brand: "UrbanCarry",
            description: "Water-resistant fabric with laptop compartment and ergonomic design.",
            price: "179.99",
            imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop",
          },
          {
            name: "Wireless Charging Pad",
            brand: "TechFlow",
            description: "Fast 15W charging with temperature control and universal device compatibility.",
            price: "49.99",
            imageUrl: "https://images.unsplash.com/photo-1591290619762-8e9fb3ce1a71?w=500&h=500&fit=crop",
          },
        ];

        await db.insert(products).values(sampleProducts);
        return { success: true, message: "Products seeded successfully" };
      } catch (error) {
        console.error("Failed to seed products:", error);
        throw error;
      }
    }),
  }),

  categories: router({
    list: publicProcedure.query(async () => {
      return await getAllCategories();
    }),
  }),

  orders: router({
    create: publicProcedure
      .input(z.object({
        customerName: z.string().min(1),
        phone: z.string().min(1),
        address: z.string().min(1),
        totalPrice: z.string(),
        items: z.array(z.object({
          productId: z.number(),
          productName: z.string(),
          productBrand: z.string(),
          quantity: z.number(),
          price: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        try {
          const orderId = await createOrder(
            {
              customerName: input.customerName,
              phone: input.phone,
              address: input.address,
              totalPrice: input.totalPrice,
            },
            input.items.map(item => ({
              productId: item.productId,
              productName: item.productName,
              productBrand: item.productBrand,
              quantity: item.quantity,
              price: item.price,
            })) as any
          );
          return { success: true, orderId };
        } catch (error) {
          console.error("Failed to create order:", error);
          throw error;
        }
      }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getOrderById(input.id);
      }),
  }),

  settings: router({
    get: publicProcedure.query(async () => {
      return await getStoreSettings();
    }),

    update: authorizedAdminProcedure
      .input(z.object({
        storeName: z.string().min(1),
        storeDescription: z.string().optional(),
        deliveryPrice: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateStoreSettings(input.storeName, input.storeDescription);
        if (input.deliveryPrice !== undefined) {
          await updateDeliveryPrice(input.deliveryPrice.toString());
        }
        return { success: true };
      }),

    updateDeliveryPrice: authorizedAdminProcedure
      .input(z.object({
        deliveryPrice: z.string(),
      }))
      .mutation(async ({ input }) => {
        await updateDeliveryPrice(input.deliveryPrice);
        return { success: true };
      }),
  }),

  admin: router({
    categories: router({
      create: authorizedAdminProcedure
        .input(z.object({
          name: z.string().trim().min(1).max(120),
          iconUrl: z.string().trim().nullable().optional(),
        }))
        .mutation(async ({ input }) => {
          const id = await createCategory({
            name: input.name,
            iconUrl: input.iconUrl || null,
          });
          return { success: true, id };
        }),

      update: authorizedAdminProcedure
        .input(z.object({
          id: z.number().int().positive(),
          name: z.string().trim().min(1).max(120).optional(),
          iconUrl: z.string().trim().nullable().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          await updateCategory(id, updates);
          return { success: true };
        }),

      delete: authorizedAdminProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ input }) => {
          await deleteCategory(input.id);
          return { success: true };
        }),
    }),

    products: router({
      create: authorizedAdminProcedure
        .input(z.object({
          name: z.string().min(1),
          brand: z.string().min(1),
          description: z.string().nullable().optional(),
          price: z.string(),
          imageUrl: z.string().nullable().optional(),
          thumbnailUrl: z.string().nullable().optional(),
          categoryId: z.number().int().positive().nullable().optional(),
        }))
        .mutation(async ({ input }) => {
          const id = await createProduct({
            name: input.name,
            brand: input.brand,
            description: input.description,
            price: input.price,
            imageUrl: input.imageUrl,
            thumbnailUrl: input.thumbnailUrl,
            categoryId: input.categoryId,
          });
          return { success: true, id };
        }),

      update: authorizedAdminProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          brand: z.string().min(1).optional(),
          description: z.string().nullable().optional(),
          price: z.string().optional(),
          imageUrl: z.string().nullable().optional(),
          thumbnailUrl: z.string().nullable().optional(),
          categoryId: z.number().int().positive().nullable().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          await updateProduct(id, updates);
          return { success: true };
        }),

      delete: authorizedAdminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await deleteProduct(input.id);
          return { success: true };
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
