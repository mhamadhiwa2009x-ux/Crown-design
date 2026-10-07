import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Trash2, Plus, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { AUTHORIZED_ADMIN_EMAILS } from "@shared/const";
import { formatIqdAmount, normalizeIqdInput } from "@shared/iqd";

const AUTHORIZED_ADMINS: readonly string[] = AUTHORIZED_ADMIN_EMAILS;

interface Product {
  id: number;
  name: string;
  brand: string;
  description: string | null;
  price: string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  categoryIconUrl?: string | null;
}

interface Category {
  id: number;
  name: string;
  iconUrl: string | null;
}

export default function Admin() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [deliveryPrice, setDeliveryPrice] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    description: "",
    price: "",
    imageUrl: "",
    thumbnailUrl: "",
    categoryId: null as number | null,
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "", iconUrl: "" });
  const [isUploadingCategoryIcon, setIsUploadingCategoryIcon] = useState(false);

  // Check if user is authorized
  useEffect(() => {
    if (!loading) {
      console.log("[Admin] Current user:", user?.email);
      console.log("[Admin] Authorized admins:", AUTHORIZED_ADMINS);
      console.log("[Admin] Is authorized:", user && AUTHORIZED_ADMINS.includes(user.email || ""));
      if (!user || !AUTHORIZED_ADMINS.includes(user.email || "")) {
        setLocation("/");
      }
    }
  }, [user, loading, setLocation]);

  // Show loading while checking authorization
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="text-center">
          <p className="text-yellow-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not authorized
  if (!user || !AUTHORIZED_ADMINS.includes(user.email || "")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="text-center">
          <h1 className="text-4xl font-black uppercase tracking-widest bg-gradient-to-r from-gray-500 via-white to-yellow-400 bg-clip-text text-transparent mb-4">
            Access Denied
          </h1>
          <p className="text-gray-400 text-lg mb-2">You do not have permission to access the admin panel.</p>
          <p className="text-gray-500 text-sm mb-8">Logged in as: {user?.email || "Not logged in"}</p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => logout().then(() => setLocation("/"))}
              className="bg-red-600 hover:bg-red-500 text-white font-bold uppercase px-8 py-3 rounded-lg"
            >
              Logout & Try Again
            </Button>
            <Button
              onClick={() => setLocation("/")}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase px-8 py-3 rounded-lg"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fetch store settings
  const { data: settings } = trpc.settings.get.useQuery();

  // Fetch products
  const { data: productsList } = trpc.products.list.useQuery();

  // Fetch categories
  const { data: categoriesList } = trpc.categories.list.useQuery();

  // Mutations
  const updateSettingsMutation = trpc.settings.update.useMutation();
  const createProductMutation = trpc.admin.products.create.useMutation();
  const updateProductMutation = trpc.admin.products.update.useMutation();
  const deleteProductMutation = trpc.admin.products.delete.useMutation();
  const createCategoryMutation = trpc.admin.categories.create.useMutation();
  const updateCategoryMutation = trpc.admin.categories.update.useMutation();
  const deleteCategoryMutation = trpc.admin.categories.delete.useMutation();

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName || "");
      setStoreDescription(settings.storeDescription || "");
      setDeliveryPrice(formatIqdAmount((settings as any)?.deliveryPrice));
    }
  }, [settings]);

  useEffect(() => {
    if (productsList) {
      setProducts(productsList);
    }
  }, [productsList]);

  useEffect(() => {
    if (categoriesList) {
      setCategories(categoriesList);
    }
  }, [categoriesList]);

  const uploadAdminImage = async (file: File) => {
    const formDataToSend = new FormData();
    formDataToSend.append('file', file);
    const response = await fetch('/api/upload', { method: 'POST', body: formDataToSend });
    if (!response.ok) throw new Error('Upload failed');
    return (await response.json()) as { url: string; thumbnailUrl?: string };
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const data = await uploadAdminImage(file);
      setFormData((current) => ({
        ...current,
        imageUrl: data.url,
        thumbnailUrl: data.thumbnailUrl || data.url,
      }));
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error('Upload error:', error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCategoryIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCategoryIcon(true);
    try {
      const data = await uploadAdminImage(file);
      setCategoryForm((current) => ({ ...current, iconUrl: data.thumbnailUrl || data.url }));
      toast.success('Category icon uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload category icon');
      console.error('Category icon upload error:', error);
    } finally {
      setIsUploadingCategoryIcon(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettingsMutation.mutateAsync({
        storeName,
        storeDescription,
        deliveryPrice: normalizeIqdInput(deliveryPrice),
      });
      toast.success("Settings updated successfully!");
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", iconUrl: "" });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const handleSaveCategory = async () => {
    const name = categoryForm.name.trim();
    if (!name) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          name,
          iconUrl: categoryForm.iconUrl.trim() || null,
        });
        toast.success('Category updated successfully!');
      } else {
        await createCategoryMutation.mutateAsync({
          name,
          iconUrl: categoryForm.iconUrl.trim() || null,
        });
        toast.success('Category created successfully!');
      }
      await Promise.all([utils.categories.list.invalidate(), utils.products.list.invalidate()]);
      resetCategoryForm();
    } catch (error) {
      toast.error('Failed to save category. Make sure the name is unique.');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, iconUrl: category.iconUrl || "" });
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`Delete ${category.name}? Posters will remain available without a category.`)) return;

    try {
      await deleteCategoryMutation.mutateAsync({ id: category.id });
      await Promise.all([utils.categories.list.invalidate(), utils.products.list.invalidate()]);
      if (editingCategory?.id === category.id) resetCategoryForm();
      toast.success('Category deleted. Associated posters were preserved.');
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleAddProduct = async () => {
    if (!formData.name || !formData.brand || !formData.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createProductMutation.mutateAsync({
        name: formData.name,
        brand: formData.brand,
        description: formData.description || null,
        price: normalizeIqdInput(formData.price),
        imageUrl: formData.imageUrl || null,
        thumbnailUrl: formData.thumbnailUrl || null,
        categoryId: formData.categoryId,
      });
      await utils.products.list.invalidate();
      toast.success("Product added successfully!");
      setFormData({ name: "", brand: "", description: "", price: "", imageUrl: "", thumbnailUrl: "", categoryId: null });
      setShowAddForm(false);
    } catch (error) {
      toast.error("Failed to add product");
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !formData.name || !formData.brand || !formData.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await updateProductMutation.mutateAsync({
        id: editingProduct.id,
        name: formData.name,
        brand: formData.brand,
        description: formData.description || null,
        price: normalizeIqdInput(formData.price),
        imageUrl: formData.imageUrl || null,
        thumbnailUrl: formData.thumbnailUrl || null,
        categoryId: formData.categoryId,
      });
      await utils.products.list.invalidate();
      toast.success("Product updated successfully!");
      setEditingProduct(null);
      setFormData({ name: "", brand: "", description: "", price: "", imageUrl: "", thumbnailUrl: "", categoryId: null });
    } catch (error) {
      toast.error("Failed to update product");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      await deleteProductMutation.mutateAsync({ id });
      await utils.products.list.invalidate();
      toast.success("Product deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand,
      description: product.description || "",
      price: formatIqdAmount(product.price),
      imageUrl: product.imageUrl || "",
      thumbnailUrl: product.thumbnailUrl || product.imageUrl || "",
      categoryId: product.categoryId || null,
    });
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setFormData({ name: "", brand: "", description: "", price: "", imageUrl: "", thumbnailUrl: "", categoryId: null });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Atmospheric light rays */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500 rounded-full blur-3xl opacity-5"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-yellow-400 rounded-full blur-3xl opacity-3"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-4xl font-black uppercase tracking-widest bg-gradient-to-r from-gray-500 via-white to-yellow-400 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <button
            onClick={() => setLocation("/")}
            className="text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            Back to Store
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-16">
        {/* Store Settings */}
        <Card className="mb-8 bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-yellow-400">Store Settings</CardTitle>
            <CardDescription>Customize your store name and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-yellow-400 mb-3">
                Store Name
              </label>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter store name"
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-yellow-400 mb-3">
                Store Description
              </label>
              <Textarea
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter store description"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-yellow-400 mb-3">
                Delivery Price
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={deliveryPrice}
                onChange={(e) => setDeliveryPrice(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="e.g. 22.000"
              />
            </div>
            <Button
              onClick={handleSaveSettings}
              disabled={updateSettingsMutation.isPending}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase"
            >
              {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>

        {/* Category Management */}
        <Card className="mb-8 bg-gray-900/50 border-gray-800">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-yellow-400">Category Management</CardTitle>
              <CardDescription>Create, edit, or delete poster categories and optional icons.</CardDescription>
            </div>
            <Button
              onClick={() => {
                if (showCategoryForm && !editingCategory) {
                  resetCategoryForm();
                } else {
                  setEditingCategory(null);
                  setCategoryForm({ name: "", iconUrl: "" });
                  setShowCategoryForm(true);
                }
              }}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {showCategoryForm && (
              <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 md:p-6 space-y-4">
                <h3 className="text-lg font-bold text-yellow-400">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-yellow-400 mb-2">
                    Category Name
                  </label>
                  <Input
                    value={categoryForm.name}
                    onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="e.g. BMW or Coffee Shop"
                    maxLength={120}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-yellow-400 mb-2">
                    Optional Icon / Logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCategoryIconUpload}
                    disabled={isUploadingCategoryIcon}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded text-sm"
                  />
                  {categoryForm.iconUrl && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-14 w-14 rounded-lg border border-gray-600 bg-black/60 p-1.5">
                        <img src={categoryForm.iconUrl} alt="Category icon preview" className="h-full w-full object-contain" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setCategoryForm({ ...categoryForm, iconUrl: "" })}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove icon
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">Or paste an icon/logo URL:</p>
                  <Input
                    value={categoryForm.iconUrl}
                    onChange={(event) => setCategoryForm({ ...categoryForm, iconUrl: event.target.value })}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                    placeholder="Icon or logo URL"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    onClick={handleSaveCategory}
                    disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending || isUploadingCategoryIcon}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase"
                  >
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </Button>
                  <Button onClick={resetCategoryForm} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold uppercase">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {categories.length === 0 ? (
              <p className="text-gray-400">No categories yet. Create one to organize your posters.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                    <div className="h-12 w-12 flex-shrink-0 rounded-lg border border-yellow-500/20 bg-black/60 p-1.5 flex items-center justify-center">
                      {category.iconUrl ? (
                        <img src={category.iconUrl} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-lg font-black text-yellow-400">{category.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="min-w-0 flex-1 truncate font-bold text-white">{category.name}</span>
                    <Button onClick={() => handleEditCategory(category)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" aria-label={`Edit ${category.name}`}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteCategory(category)}
                      disabled={deleteCategoryMutation.isPending}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products Management */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-yellow-400">Manage Products</CardTitle>
              <CardDescription>Add, edit, or delete products</CardDescription>
            </div>
            <Button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingProduct(null);
                setFormData({ name: "", brand: "", description: "", price: "", imageUrl: "", thumbnailUrl: "", categoryId: null });
              }}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add/Edit Form */}
            {(showAddForm || editingProduct) && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-bold text-yellow-400">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h3>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-yellow-400 mb-2">
                    Product Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-yellow-400 mb-2">
                    Brand Name
                  </label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Brand name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-yellow-400 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.categoryId?.toString() || ""}
                    onChange={(event) => setFormData({
                      ...formData,
                      categoryId: event.target.value ? Number(event.target.value) : null,
                    })}
                    className="h-10 w-full rounded-md border border-gray-600 bg-gray-700 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                  >
                    <option value="">Unassigned</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-yellow-400 mb-2">
                    Price
                  </label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="e.g. 22.000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-yellow-400 mb-2">
                    Product Image
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded text-sm"
                    />
                  </div>
                  {formData.imageUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={formData.imageUrl} alt="Preview" className="w-16 h-16 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: "", thumbnailUrl: "" })}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Or paste image URL below:</p>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value, thumbnailUrl: "" })}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                    placeholder="Image URL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-yellow-400 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Product description"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                    disabled={createProductMutation.isPending || updateProductMutation.isPending}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase flex-1"
                  >
                    {editingProduct ? "Update Product" : "Add Product"}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold uppercase flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Products List */}
            <div className="space-y-4">
              {products.length === 0 ? (
                <p className="text-gray-400">No products yet. Add your first product!</p>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{product.name}</h4>
                      <p className="text-sm text-gray-400">{product.brand}</p>
                      {product.categoryName && (
                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-xs font-bold text-yellow-300">
                          {product.categoryIconUrl && <img src={product.categoryIconUrl} alt="" className="h-4 w-4 object-contain" />}
                          {product.categoryName}
                        </span>
                      )}
                      <p className="text-yellow-400 font-bold">د.ع {formatIqdAmount(product.price)}</p>
                      {product.description && (
                        <p className="text-sm text-gray-400 mt-2">{product.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => handleEditProduct(product)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={deleteProductMutation.isPending}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
