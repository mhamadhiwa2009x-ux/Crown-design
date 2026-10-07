# 🌍 Language Management Guide

Your Crown Design store now has a complete multi-language system! This guide shows you exactly where all the text is stored and how to add new languages.

## 📁 File Location

All text/translations are stored in ONE file:
```
client/src/lib/languages.ts
```

## 🎯 How to Add a New Language

### Step 1: Add Language Definition

Open `client/src/lib/languages.ts` and find the `languages` object at the top:

```typescript
export const languages = {
  en: {
    name: 'English',
    flag: '🇬🇧',
  },
  // ADD YOUR LANGUAGE HERE
  es: {
    name: 'Español',
    flag: '🇪🇸',
  },
};
```

**Examples of language codes and flags:**
- `es` - Spanish 🇪🇸
- `fr` - French 🇫🇷
- `de` - German 🇩🇪
- `it` - Italian 🇮🇹
- `ar` - Arabic 🇸🇦
- `zh` - Chinese 🇨🇳
- `ja` - Japanese 🇯🇵
- `pt` - Portuguese 🇵🇹
- `ru` - Russian 🇷🇺

### Step 2: Add All Translations

In the same file, find the `translations` object and add your new language with ALL the text:

```typescript
export const translations = {
  en: { ... }, // English (already exists)
  
  // ADD YOUR NEW LANGUAGE HERE
  es: {
    // Header
    header: {
      adminPanel: 'Panel de Administración',
      cart: 'Carrito',
    },

    // Home Page
    home: {
      curatedCollection: 'COLECCIÓN CURADA',
      experiencePremium: 'Experimenta productos premium con elegancia dramática',
      add: 'AÑADIR',
    },

    // Cart Page
    cart: {
      title: 'CARRITO DE COMPRAS',
      empty: 'Tu carrito está vacío',
      continueShopping: 'Continuar Comprando',
      quantity: 'Cantidad',
      price: 'Precio',
      total: 'TOTAL',
      subtotal: 'Subtotal',
      proceedCheckout: 'Proceder al Pago',
      remove: 'Eliminar',
    },

    // Checkout Page
    checkout: {
      title: 'PAGO DE ENTREGA',
      customerInfo: 'Información del Cliente',
      fullName: 'Nombre Completo',
      phone: 'Número de Teléfono',
      address: 'Dirección de Entrega',
      orderSummary: 'Resumen del Pedido',
      placeOrder: 'Realizar Pedido',
      backToCart: 'Volver al Carrito',
      required: 'Este campo es requerido',
      invalidPhone: 'Por favor ingresa un número de teléfono válido',
      invalidAddress: 'Por favor ingresa una dirección válida',
    },

    // Confirmation Page
    confirmation: {
      title: 'PEDIDO CONFIRMADO',
      orderNumber: 'Número de Pedido',
      thankyou: '¡Gracias por tu pedido!',
      customerDetails: 'Detalles del Cliente',
      name: 'Nombre',
      phone: 'Teléfono',
      address: 'Dirección de Entrega',
      orderDetails: 'Detalles del Pedido',
      item: 'Artículo',
      quantity: 'Cantidad',
      price: 'Precio',
      subtotal: 'Subtotal',
      total: 'Total',
      backHome: 'Volver al Inicio',
    },

    // Admin Panel
    admin: {
      title: 'PANEL DE ADMINISTRACIÓN',
      storeSettings: 'Configuración de la Tienda',
      customizeStore: 'Personaliza el nombre y descripción de tu tienda',
      storeName: 'Nombre de la Tienda',
      storeDescription: 'Descripción de la Tienda',
      saveSettings: 'Guardar Configuración',
      products: 'Productos',
      manageProducts: 'Gestiona tu catálogo de productos',
      addProduct: 'Añadir Producto',
      editProduct: 'Editar Producto',
      addNewProduct: 'Añadir Nuevo Producto',
      productName: 'Nombre del Producto',
      brandName: 'Nombre de la Marca',
      price: 'Precio',
      imageUrl: 'URL de la Imagen',
      description: 'Descripción',
      addProductButton: 'Añadir Producto',
      updateProduct: 'Actualizar Producto',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      noProducts: '¡Sin productos aún. Añade tu primer producto!',
      required: 'Este campo es requerido',
      fillRequired: 'Por favor completa todos los campos requeridos',
      productAdded: '¡Producto añadido exitosamente!',
      productUpdated: '¡Producto actualizado exitosamente!',
      productDeleted: '¡Producto eliminado exitosamente!',
      settingsUpdated: '¡Configuración de la tienda actualizada!',
      failedAdd: 'Error al añadir producto',
      failedUpdate: 'Error al actualizar producto',
      failedDelete: 'Error al eliminar producto',
      failedSettings: 'Error al actualizar configuración',
    },

    // Common
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      language: 'Idioma',
    },
  },
};
```

## 📋 Complete Text Reference

Here's the complete structure of all text in your store:

### Header Texts
- `header.adminPanel` - "Admin Panel" button
- `header.cart` - "Cart" button

### Home Page Texts
- `home.curatedCollection` - Main heading
- `home.experiencePremium` - Subtitle
- `home.add` - "Add to Cart" button

### Cart Page Texts
- `cart.title` - Page title
- `cart.empty` - Empty cart message
- `cart.continueShopping` - Button text
- `cart.quantity` - Column header
- `cart.price` - Column header
- `cart.total` - Total label
- `cart.subtotal` - Subtotal label
- `cart.proceedCheckout` - Checkout button
- `cart.remove` - Remove button

### Checkout Page Texts
- `checkout.title` - Page title
- `checkout.customerInfo` - Form section title
- `checkout.fullName` - Input label
- `checkout.phone` - Input label
- `checkout.address` - Input label
- `checkout.orderSummary` - Summary section title
- `checkout.placeOrder` - Submit button
- `checkout.backToCart` - Back button
- `checkout.required` - Validation message
- `checkout.invalidPhone` - Phone validation message
- `checkout.invalidAddress` - Address validation message

### Confirmation Page Texts
- `confirmation.title` - Page title
- `confirmation.orderNumber` - Label
- `confirmation.thankyou` - Thank you message
- `confirmation.customerDetails` - Section title
- `confirmation.name` - Label
- `confirmation.phone` - Label
- `confirmation.address` - Label
- `confirmation.orderDetails` - Section title
- `confirmation.item` - Column header
- `confirmation.quantity` - Column header
- `confirmation.price` - Column header
- `confirmation.subtotal` - Label
- `confirmation.total` - Label
- `confirmation.backHome` - Button text

### Admin Panel Texts
- `admin.title` - Page title
- `admin.storeSettings` - Settings section title
- `admin.customizeStore` - Settings description
- `admin.storeName` - Input label
- `admin.storeDescription` - Input label
- `admin.saveSettings` - Save button
- `admin.products` - Products section title
- `admin.manageProducts` - Products description
- `admin.addProduct` - Add button
- `admin.editProduct` - Edit modal title
- `admin.addNewProduct` - Add modal title
- `admin.productName` - Input label
- `admin.brandName` - Input label
- `admin.price` - Input label
- `admin.imageUrl` - Input label
- `admin.description` - Input label
- `admin.addProductButton` - Submit button
- `admin.updateProduct` - Update button
- `admin.cancel` - Cancel button
- `admin.delete` - Delete button
- `admin.edit` - Edit button
- `admin.noProducts` - Empty state message
- `admin.required` - Validation message
- `admin.fillRequired` - Validation message
- `admin.productAdded` - Success message
- `admin.productUpdated` - Success message
- `admin.productDeleted` - Success message
- `admin.settingsUpdated` - Success message
- `admin.failedAdd` - Error message
- `admin.failedUpdate` - Error message
- `admin.failedDelete` - Error message
- `admin.failedSettings` - Error message

### Common Texts
- `common.loading` - Loading indicator
- `common.error` - Error label
- `common.success` - Success label
- `common.language` - Language label

## 🚀 Quick Example: Adding Spanish

1. Open `client/src/lib/languages.ts`
2. Add to `languages` object:
```typescript
es: {
  name: 'Español',
  flag: '🇪🇸',
},
```

3. Add to `translations` object with all Spanish text (see example above)
4. Save the file
5. **The language switcher will automatically show Spanish!** ✨

## 🔄 How Language Switching Works

1. User clicks the language button (🇬🇧 EN) in the top-right header
2. A dropdown menu appears with all available languages
3. User selects their preferred language
4. The entire store UI updates instantly
5. The language preference is saved in browser (localStorage) so it persists across visits

## ✅ What Gets Translated

- ✅ All buttons and labels
- ✅ Page titles and headings
- ✅ Form fields and placeholders
- ✅ Error and success messages
- ✅ Navigation text
- ✅ Admin panel interface

## ❌ What Does NOT Get Translated

- ❌ Product names (you manage these in the admin panel)
- ❌ Product descriptions (you manage these in the admin panel)
- ❌ Brand names (you manage these in the admin panel)
- ❌ Customer order information (entered by users)

## 💡 Pro Tips

1. **Copy-paste from English**: Start by copying the entire English section and then replace the text values
2. **Keep the structure**: Make sure the keys (left side) stay exactly the same, only change the values (right side)
3. **Test each language**: After adding a new language, click the language switcher to verify all text appears correctly
4. **Use proper flag emojis**: Find the right flag emoji for your language (search "flag emoji [country]")

## 🆘 Troubleshooting

**Language not appearing in switcher?**
- Make sure you added it to BOTH the `languages` AND `translations` objects
- Check that the language code matches (e.g., `es` in both places)

**Text showing as path instead of translation?**
- You likely forgot to add a translation key
- Check the LANGUAGE_GUIDE.md for the complete list of keys needed

**Changes not showing up?**
- The dev server should auto-reload
- If not, refresh your browser (Ctrl+R or Cmd+R)

---

**That's it!** You now have complete control over all languages in your store. Add as many languages as you need! 🌍
