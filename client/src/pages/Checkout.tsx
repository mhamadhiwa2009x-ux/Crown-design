import { useState } from 'react';
import { useLocation } from 'wouter';
import { useCart } from '@/hooks/useCart';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatIqdAmount, parseIqdAmount } from '@shared/iqd';

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { cart, getTotalPrice, clearCart } = useCart();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
  });

  const { data: settings } = trpc.settings.get.useQuery();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-xl mb-8">{t('cart.empty')}</p>
          <Button
            onClick={() => setLocation('/')}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase px-8 py-3 rounded-lg"
          >
            {t('cart.continueShopping')}
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const deliveryPrice = parseIqdAmount(settings?.deliveryPrice ?? '0');
  const total = subtotal + deliveryPrice;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.customerName.trim()) {
      setError(t('checkout.required'));
      return;
    }
    if (!formData.phone.trim()) {
      setError(t('checkout.required'));
      return;
    }
    if (!formData.address.trim()) {
      setError(t('checkout.required'));
      return;
    }
    if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      setError(t('checkout.invalidPhone'));
      return;
    }
    if (formData.address.length < 5) {
      setError(t('checkout.invalidAddress'));
      return;
    }

    setIsSubmitting(true);

    try {
      const itemLines = cart.map((item, index) => {
        const itemTotal = parseIqdAmount(item.price) * item.quantity;
        return `${index + 1}. ${item.productName} — Quantity: ${item.quantity} — Price: د.ع ${formatIqdAmount(itemTotal)}`;
      });
      const message = [
        'سڵاو، دەمەوێت ئەم پۆستەرەکانە داوا بکەم:',
        '',
        ...itemLines,
        '',
        `Total Amount: د.ع ${formatIqdAmount(total)}`,
        '',
        `Name: ${formData.customerName.trim()}`,
        `Phone: ${formData.phone.trim()}`,
        `Address: ${formData.address.trim()}`,
      ].join('\n');
      window.open(`https://wa.me/9647700468484?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      clearCart();
      setLocation('/');
    } catch (err) {
      console.error('WhatsApp order launch failed:', err);
      setError('Unable to open WhatsApp. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500 rounded-full blur-3xl opacity-5"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-yellow-400 rounded-full blur-3xl opacity-3"></div>
      </div>

      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <button
            onClick={() => setLocation('/cart')}
            className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors mb-2 md:mb-4 text-sm md:text-base"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">{t('checkout.backToCart')}</span>
          </button>
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-widest bg-gradient-to-r from-gray-500 via-white to-yellow-400 bg-clip-text text-transparent">
            {t('checkout.title')}
          </h1>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-16">
        {error && (
          <div className="mb-8 bg-red-500/10 border border-red-500/50 rounded-lg p-3 md:p-4 flex items-start gap-3 text-sm md:text-base">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-yellow-400 mb-3">
                  {t('checkout.fullName')}
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors text-sm md:text-base"
                  placeholder={t('checkout.fullName')}
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-yellow-400 mb-3">
                  {t('checkout.phone')}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors text-sm md:text-base"
                  placeholder={t('checkout.phone')}
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-yellow-400 mb-3">
                  {t('checkout.address')}
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors resize-none text-sm md:text-base"
                  placeholder={t('checkout.address')}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-black font-bold uppercase tracking-wide py-3 md:py-4 rounded-lg text-base md:text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('checkout.placeOrder')
                )}
              </Button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl p-6 sticky top-24">
              <h3 className="text-base md:text-lg font-black uppercase tracking-widest text-yellow-400 mb-6">
                {t('checkout.orderSummary')}
              </h3>

              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.productId} className="flex justify-between text-xs md:text-sm">
                    <div>
                      <p className="text-white font-semibold">{item.productName}</p>
                      <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-yellow-400 font-bold">د.ع {formatIqdAmount(parseIqdAmount(item.price) * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-700 pt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">{t('cart.subtotal')}:</span>
                  <span className="text-xl font-black text-yellow-400">د.ع {formatIqdAmount(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">{t('cart.deliveryPrice')}:</span>
                  <span className="text-xl font-black text-yellow-400">د.ع {formatIqdAmount(deliveryPrice)}</span>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <span className="text-white font-bold">{t('cart.total')}:</span>
                  <span className="text-3xl font-black text-yellow-400">د.ع {formatIqdAmount(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
