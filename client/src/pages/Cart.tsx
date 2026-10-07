import { useLocation } from 'wouter';
import { useCart } from '@/hooks/useCart';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatIqdAmount, parseIqdAmount } from '@shared/iqd';

export default function Cart() {
  const [, setLocation] = useLocation();
  const { cart, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const { t } = useLanguage();
  const { data: settings } = trpc.settings.get.useQuery();

  const subtotal = getTotalPrice();
  const deliveryPrice = parseIqdAmount(settings?.deliveryPrice ?? '0');
  const total = subtotal + deliveryPrice;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Atmospheric light rays */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500 rounded-full blur-3xl opacity-5"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-yellow-400 rounded-full blur-3xl opacity-3"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors mb-2 md:mb-4 text-sm md:text-base"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">{t('cart.continueShopping')}</span>
          </button>
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-widest bg-gradient-to-r from-gray-500 via-white to-yellow-400 bg-clip-text text-transparent">
            {t('cart.title')}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-16">
        {cart.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg md:text-xl mb-8">{t('cart.empty')}</p>
            <Button
              onClick={() => setLocation('/')}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase px-8 py-3 rounded-lg"
            >
              {t('cart.continueShopping')}
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Cart Items */}
            <div className="space-y-4">
              {cart.map((item) => (
                <CartItemRow
                  key={item.productId}
                  item={item}
                  onRemove={removeFromCart}
                  onUpdateQuantity={updateQuantity}
                />
              ))}
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl p-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400 text-lg">{t('cart.subtotal')}:</span>
                <span className="text-xl font-black text-yellow-400">
                  د.ع {formatIqdAmount(subtotal)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-400 text-lg">{t('cart.deliveryPrice')}:</span>
                <span className="text-xl font-black text-yellow-400">
                  د.ع {formatIqdAmount(deliveryPrice)}
                </span>
              </div>
              <div className="border-t border-gray-700 pt-6">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-white text-xl font-bold">{t('cart.total')}:</span>
                  <span className="text-4xl font-black text-yellow-400">
                    د.ع {formatIqdAmount(total)}
                  </span>
                </div>
                <Button
                  onClick={() => setLocation('/checkout')}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wide py-4 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  {t('cart.proceedCheckout')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function CartItemRow({
  item,
  onRemove,
  onUpdateQuantity,
}: {
  item: any;
  onRemove: (id: number) => void;
  onUpdateQuantity: (id: number, qty: number) => void;
}) {
  const itemTotal = parseIqdAmount(item.price) * item.quantity;

  return (
    <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-lg p-4 md:p-6 hover:border-yellow-500/30 transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-center">
        {/* Product Info */}
        <div className="md:col-span-1 flex items-center gap-3 min-w-0">
          <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-md overflow-hidden border border-gray-700 bg-black flex items-center justify-center">
            {item.thumbnailUrl || item.imageUrl ? (
              <img
                src={item.thumbnailUrl || item.imageUrl || undefined}
                alt={item.productName}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-[10px] text-gray-600 text-center px-1">No image</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-yellow-400 text-xs md:text-sm font-bold uppercase tracking-widest mb-1 truncate">
              {item.productBrand}
            </p>
            <div className="flex items-start gap-2 mb-2">
              <h3 className="text-base md:text-lg font-black uppercase text-white line-clamp-2 break-words">
                {item.productName}
              </h3>
              {item.quantity > 1 && (
                <span className="flex-shrink-0 rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-bold text-yellow-400">
                  ×{item.quantity}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-xs md:text-sm">
              د.ع {formatIqdAmount(item.price)}
            </p>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-3 bg-gray-800 rounded-lg p-2 w-fit">
          <button
            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
            className="w-8 h-8 flex items-center justify-center text-yellow-400 hover:text-yellow-300 font-bold text-sm"
          >
            −
          </button>
          <span className="w-6 text-center text-white font-bold text-sm">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
            className="w-8 h-8 flex items-center justify-center text-yellow-400 hover:text-yellow-300 font-bold text-sm"
          >
            +
          </button>
        </div>

        {/* Total */}
        <div className="text-right">
          <p className="text-gray-400 text-xs md:text-sm mb-1">{useLanguage().t('cart.subtotal')}</p>
          <p className="text-lg md:text-2xl font-black text-yellow-400">
            د.ع {formatIqdAmount(itemTotal)}
          </p>
        </div>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(item.productId)}
          className="p-2 md:p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-fit"
          title="Remove item"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
