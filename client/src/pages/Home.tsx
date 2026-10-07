import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ShoppingCart, Loader2, Settings, LogIn, LogOut, Search, LayoutGrid, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Product } from '../../../drizzle/schema';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatIqdAmount } from '@shared/iqd';
import { toast } from 'sonner';
import { CART_ADDED_MESSAGE } from '@shared/const';
import { filterPosters, filterPostersByCategory } from '@shared/search';
import { Skeleton } from '@/components/ui/skeleton';
import {
  readStorefrontSnapshot,
  STOREFRONT_QUERY_STALE_TIME_MS,
} from '@/lib/storefrontCache';

type ProductWithCategory = Omit<Product, 'thumbnailUrl'> & {
  thumbnailUrl?: string | null;
  categoryName: string | null;
  categoryIconUrl: string | null;
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { cart, addToCart, getTotalItems } = useCart();
  const { user, logout } = useAuth();
  const cartItemCount = getTotalItems();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [cachedSnapshot] = useState(() =>
    typeof window === 'undefined' ? null : readStorefrontSnapshot(window.localStorage),
  );

  const { data: productsData, isPending: productsPending } = trpc.products.list.useQuery(undefined, {
    placeholderData: cachedSnapshot?.products,
    staleTime: STOREFRONT_QUERY_STALE_TIME_MS,
  });
  const { data: categories = [], isPending: categoriesPending } = trpc.categories.list.useQuery(undefined, {
    placeholderData: cachedSnapshot?.categories,
    staleTime: STOREFRONT_QUERY_STALE_TIME_MS,
  });
  const { data: settings } = trpc.settings.get.useQuery(undefined, {
    placeholderData: cachedSnapshot?.settings
      ? { ...cachedSnapshot.settings, storeDescription: cachedSnapshot.settings.storeDescription || '' }
      : undefined,
    staleTime: STOREFRONT_QUERY_STALE_TIME_MS,
  });
  const { t } = useLanguage();
  const products: ProductWithCategory[] = productsData ?? [];

  const filteredProducts = useMemo(
    () => filterPosters(filterPostersByCategory(products, selectedCategoryId), searchQuery),
    [products, searchQuery, selectedCategoryId],
  );
  const postersPerPage = 10;
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / postersPerPage));
  const safePage = Math.min(currentPage, pageCount);
  const visibleProducts = filteredProducts.slice((safePage - 1) * postersPerPage, safePage * postersPerPage);

  const changePage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), pageCount);
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setCurrentPage(nextPage);
  };

  const handleAddToCart = (product: ProductWithCategory) => {
    addToCart({
      productId: product.id,
      productName: product.name,
      productBrand: product.brand,
      price: product.price,
      imageUrl: product.imageUrl,
      thumbnailUrl: product.thumbnailUrl || product.imageUrl,
      quantity: 1,
    });
    toast.success(CART_ADDED_MESSAGE);
  };

  if (productsPending && !productsData) return <StorefrontSkeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-x-clip">
      {/* Atmospheric light rays */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500 rounded-full blur-3xl opacity-5"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-yellow-400 rounded-full blur-3xl opacity-3"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-5">
          <div className="flex justify-between items-center gap-2 md:gap-4">
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-widest bg-gradient-to-r from-gray-500 via-white to-yellow-400 bg-clip-text text-transparent min-w-0 flex-1 truncate">
              {settings?.storeName || "BRAND STORE"}
            </h1>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            {user ? (
              <>
                <button
                  onClick={() => setLocation('/admin')}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-all duration-300"
                  title="Admin Panel"
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-xs md:text-sm font-semibold hidden sm:inline">Admin</span>
                </button>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-all duration-300"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-xs md:text-sm font-semibold hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <a
                href={getLoginUrl()}
                className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-all duration-300"
                title="Login"
              >
                <LogIn className="w-5 h-5" />
                <span className="text-xs md:text-sm font-semibold hidden sm:inline">Login</span>
              </a>
            )}

            <button
            onClick={() => setLocation('/cart')}
            className="relative flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-all duration-300 group"
          >
            <ShoppingCart className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300 flex-shrink-0" />
            <span className="text-yellow-400 font-semibold group-hover:text-yellow-300 text-sm md:text-base">
              {cartItemCount}
            </span>
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-500 text-black text-xs font-bold rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
            </button>
            </div>
          </div>
          <label className="relative block mt-3 md:mt-4" aria-label={t('home.search')}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-yellow-400" />
            <Input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder={t('home.search')}
              className="h-10 w-full border-yellow-500/30 bg-gray-950/80 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus-visible:border-yellow-400 focus-visible:ring-yellow-400/30"
            />
          </label>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-16">
        {categoriesPending && categories.length === 0 ? (
          <CategorySkeleton />
        ) : categories.length > 0 && (
          <nav
            aria-label="Poster categories"
            className="mb-12 overflow-x-auto pb-4 scroll-smooth [scrollbar-color:#ca8a04_transparent] [scrollbar-width:thin]"
          >
            <div className="flex w-max min-w-full snap-x snap-mandatory items-start gap-5 px-1 md:justify-center md:gap-8">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryId(null);
                  setCurrentPage(1);
                }}
                aria-pressed={selectedCategoryId === null}
                className="group flex w-24 snap-start flex-col items-center gap-3 text-center md:w-28"
              >
                <span
                  className={`flex h-24 w-24 items-center justify-center rounded-full border-2 bg-gradient-to-br from-gray-900 via-black to-yellow-950/60 shadow-[0_14px_35px_rgba(0,0,0,0.5)] transition-all duration-200 md:h-28 md:w-28 ${
                    selectedCategoryId === null
                      ? 'border-yellow-300 ring-4 ring-yellow-400/20 shadow-[0_0_32px_rgba(234,179,8,0.22)]'
                      : 'border-yellow-500/25 group-hover:border-yellow-400/70 group-hover:-translate-y-1'
                  }`}
                >
                  <LayoutGrid className={`h-10 w-10 md:h-12 md:w-12 ${selectedCategoryId === null ? 'text-yellow-300' : 'text-yellow-500/80'}`} aria-hidden="true" />
                </span>
                <span className={`w-full text-xs font-black uppercase tracking-wide md:text-sm ${selectedCategoryId === null ? 'text-yellow-300' : 'text-gray-300 group-hover:text-yellow-300'}`}>
                  {t('home.allCategories')}
                </span>
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(category.id);
                    setCurrentPage(1);
                  }}
                  aria-pressed={selectedCategoryId === category.id}
                  className="group flex w-24 snap-start flex-col items-center gap-3 text-center md:w-28"
                >
                  <span
                    className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 bg-gradient-to-br from-gray-900 via-black to-yellow-950/60 shadow-[0_14px_35px_rgba(0,0,0,0.5)] transition-all duration-200 md:h-28 md:w-28 ${
                      selectedCategoryId === category.id
                        ? 'border-yellow-300 ring-4 ring-yellow-400/20 shadow-[0_0_32px_rgba(234,179,8,0.22)]'
                        : 'border-yellow-500/25 group-hover:border-yellow-400/70 group-hover:-translate-y-1'
                    }`}
                  >
                    {category.iconUrl ? (
                      <img src={category.iconUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    ) : (
                      <span className={`text-3xl font-black uppercase md:text-4xl ${selectedCategoryId === category.id ? 'text-yellow-300' : 'text-yellow-500/80'}`}>
                        {category.name.charAt(0)}
                      </span>
                    )}
                  </span>
                  <span className={`w-full break-words text-xs font-black uppercase leading-tight tracking-wide md:text-sm ${selectedCategoryId === category.id ? 'text-yellow-300' : 'text-gray-300 group-hover:text-yellow-300'}`}>
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          </nav>
        )}

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No products available at the moment.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">{t('home.noResults')}</p>
          </div>
        ) : (
          <div id="product-grid" className="mx-auto grid max-w-7xl grid-cols-2 gap-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}

        {filteredProducts.length > postersPerPage && (
          <nav className="mt-10 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/60 p-2 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-sm" aria-label="Poster pages">
            <button
              type="button"
              aria-label="Previous page"
              disabled={safePage === 1}
              onClick={() => changePage(safePage - 1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-gray-400 transition-colors hover:border-yellow-500/40 hover:bg-yellow-500/10 hover:text-yellow-300 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  aria-label={`Go to page ${page}`}
                  aria-current={safePage === page ? 'page' : undefined}
                  onClick={() => changePage(page)}
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition-all ${safePage === page
                    ? 'border-yellow-300 bg-yellow-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.25)]'
                    : 'border-white/10 bg-white/[0.04] text-gray-300 hover:border-yellow-500/40 hover:bg-yellow-500/10 hover:text-yellow-300'}`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Next page"
              disabled={safePage === pageCount}
              onClick={() => changePage(safePage + 1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-gray-400 transition-colors hover:border-yellow-500/40 hover:bg-yellow-500/10 hover:text-yellow-300 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>
        )}
      </main>

      <footer className="relative z-10 border-t border-yellow-500/15 bg-black/80 px-4 py-10 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <p className="text-sm font-semibold tracking-wide text-gray-400">Crown Design</p>
          <nav className="flex items-center gap-3" aria-label="Social links">
            <a href="https://instagram.com/crownn.design" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 text-white transition-all hover:scale-105 hover:border-yellow-400 hover:text-yellow-300">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
            </a>
            <a href="https://tiktok.com/@crown__design" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 text-white transition-all hover:scale-105 hover:border-yellow-400 hover:text-yellow-300">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 4v10.5a4.5 4.5 0 1 1-3.5-4.38" /><path d="M15 4c.65 2.2 2.1 3.6 4.5 4" /></svg>
            </a>
            <a href="https://snapchat.com/add/crown_designn" target="_blank" rel="noopener noreferrer" aria-label="Snapchat" className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 text-white transition-all hover:scale-105 hover:border-yellow-400 hover:text-yellow-300">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4.25c-2.55 0-4.15 1.78-4.15 4.2v2.1c0 .6-.28 1.02-.87 1.24l-1.18.44c-.38.14-.36.68.03.8l1.22.38c.28.09.48.3.55.6.17.72.69 1.1 1.38 1.18.28.03.5.18.68.4.47.6 1.18.87 2.34.87s1.87-.27 2.34-.87c.18-.22.4-.37.68-.4.69-.08 1.21-.46 1.38-1.18.07-.3.27-.51.55-.6l1.22-.38c.39-.12.41-.66.03-.8l-1.18-.44c-.59-.22-.87-.64-.87-1.24v-2.1c0-2.42-1.6-4.2-4.15-4.2Z" /><path d="M8.2 19.1c1.35.48 2.25.48 3.8-.1 1.55.58 2.45.58 3.8.1" /></svg>
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="mb-12 flex gap-5 overflow-hidden pb-4" aria-label="Loading categories">
      {[0, 1, 2, 3].map(item => (
        <div key={item} className="flex w-24 flex-shrink-0 flex-col items-center gap-3 md:w-28">
          <Skeleton className="h-24 w-24 rounded-full bg-yellow-500/10 md:h-28 md:w-28" />
          <Skeleton className="h-3 w-16 bg-gray-800" />
        </div>
      ))}
    </div>
  );
}

function StorefrontSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <header className="border-b border-gray-800 bg-black/95 px-4 py-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-8 w-48 bg-gray-800 md:h-10 md:w-72" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 bg-gray-800" />
              <Skeleton className="h-10 w-20 bg-yellow-500/10" />
            </div>
          </div>
          <Skeleton className="mt-4 h-10 w-full bg-gray-800/80" />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-12">
        <CategorySkeleton />
        <div className="mb-12 flex items-center justify-center gap-5">
          <Skeleton className="h-24 w-24 rounded-full bg-yellow-500/10" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-44 bg-gray-800 md:w-72" />
            <Skeleton className="h-4 w-36 bg-gray-800/80 md:w-56" />
          </div>
        </div>
        <div className="space-y-6">
          {[0, 1, 2].map(item => (
            <div key={item} className="overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
              <Skeleton className="h-48 w-full rounded-none bg-gray-800/80" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-3 w-24 bg-yellow-500/15" />
                <Skeleton className="h-5 w-3/5 bg-gray-800" />
                <Skeleton className="h-3 w-4/5 bg-gray-800/80" />
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-8 w-28 bg-yellow-500/15" />
                  <Skeleton className="h-10 w-24 bg-yellow-500/25" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function ProductCard({ product, onAddToCart }: { product: ProductWithCategory; onAddToCart: (p: ProductWithCategory) => void }) {
  const { t } = useLanguage();
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openDetails = () => setIsDetailOpen(true);
  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDetails();
    }
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={`View details for ${product.name}`}
        onClick={openDetails}
        onKeyDown={handleCardKeyDown}
        className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.045] shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-md transition-all duration-300 hover:scale-[1.015] hover:border-yellow-400/50 hover:shadow-[0_20px_55px_rgba(234,179,8,0.12)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400"
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
          {product.imageUrl ? (
            <img
              src={product.thumbnailUrl || product.imageUrl}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
              <span className="text-gray-600 text-sm">No Image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col p-3 md:p-4">
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1">
            {product.brand}
          </p>
          <div className="mb-2 flex min-h-7 items-start">
            {product.categoryName && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-[11px] font-bold text-yellow-300">
                {product.categoryIconUrl && <img src={product.categoryIconUrl} alt="" loading="lazy" decoding="async" className="h-4 w-4 object-contain" />}
                {product.categoryName}
              </span>
            )}
          </div>
          <h3 className="mb-2 truncate text-sm font-black uppercase tracking-wide text-white group-hover:text-yellow-300 transition-colors">
            {product.name}
          </h3>
          <p className="text-gray-400 text-xs mb-3 line-clamp-2">
            {product.description}
          </p>

          <div className="mt-auto flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xl font-black text-yellow-400 md:text-3xl">
              د.ع {formatIqdAmount(product.price)}
            </span>
            <Button
              onClick={(event) => {
                event.stopPropagation();
                onAddToCart(product);
              }}
              className="w-full rounded-lg bg-yellow-500 px-4 py-2 text-xs font-bold uppercase tracking-wide text-black transition-all duration-300 hover:scale-105 hover:bg-yellow-400 active:scale-95 sm:w-auto md:px-6 md:text-sm"
            >
              {t('home.add')}
            </Button>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/0 to-yellow-500/0 group-hover:from-yellow-500/5 group-hover:via-yellow-500/10 group-hover:to-yellow-500/5 transition-all duration-500 pointer-events-none"></div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-gray-950 border-yellow-500/40 text-white p-4 md:p-6">
          <DialogTitle className="text-yellow-400 text-xl md:text-2xl font-black uppercase tracking-wide pr-8">
            {product.name}
          </DialogTitle>
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)] items-start">
            <div className="min-h-[280px] md:min-h-[520px] rounded-lg bg-black/70 border border-gray-800 flex items-center justify-center p-3">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  decoding="async"
                  className="max-h-[70vh] w-full object-contain"
                />
              ) : (
                <span className="text-gray-500">No Image</span>
              )}
            </div>
            <div className="space-y-5 md:pt-2">
              <div>
                <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">
                  {product.brand}
                </p>
                {product.categoryName && (
                  <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-bold text-yellow-300">
                    {product.categoryIconUrl && <img src={product.categoryIconUrl} alt="" loading="lazy" decoding="async" className="h-4 w-4 object-contain" />}
                    {product.categoryName}
                  </span>
                )}
                <p className="text-gray-200 text-base leading-7 whitespace-pre-wrap break-words">
                  {product.description || 'No description available.'}
                </p>
              </div>
              <p className="text-3xl font-black text-yellow-400">
                د.ع {formatIqdAmount(product.price)}
              </p>
              <Button
                onClick={() => {
                  onAddToCart(product);
                  setIsDetailOpen(false);
                }}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wide py-3 rounded-lg"
              >
                {t('checkout.placeOrder')}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const message = `سڵاو، دەمەوێت ئەم پۆستەرە داوا بکەم: ${product.name}`;
                  window.open(`https://wa.me/9647700468484?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
                }}
                className="w-full border border-[#25D366]/50 bg-[#25D366]/15 py-3 font-bold text-[#7CFFAE] transition-colors hover:bg-[#25D366]/25"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                داواکردنی خێرا لە واتسئاپ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
