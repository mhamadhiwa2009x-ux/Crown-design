import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatIqdAmount, parseIqdAmount } from '@shared/iqd';

export default function Confirmation() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const { t } = useLanguage();

  const { data: orderData } = trpc.orders.get.useQuery(
    { id: parseInt(id || '0') },
    { enabled: !!id }
  );

  useEffect(() => {
    if (orderData) {
      setOrder(orderData);
      setIsLoading(false);
    }
  }, [orderData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-xl mb-8">Order not found</p>
          <Button
            onClick={() => setLocation('/')}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase px-8 py-3 rounded-lg"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden flex items-center justify-center">
      {/* Atmospheric light rays */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500 rounded-full blur-3xl opacity-5"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-yellow-400 rounded-full blur-3xl opacity-3"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-24 h-24 text-yellow-400 animate-pulse" />
          </div>
          <h1 className="text-5xl font-black uppercase tracking-widest bg-gradient-to-r from-gray-500 via-white to-yellow-400 bg-clip-text text-transparent mb-4">
            {t('confirmation.thankyou')}
          </h1>
          <p className="text-gray-400 text-lg">
            Your order has been received successfully.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl p-8 space-y-8 mb-8">
          {/* Order Number */}
          <div className="text-center">
            <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Order Number</p>
            <p className="text-3xl font-black text-yellow-400">#{order.id}</p>
          </div>

          {/* Customer Info */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-bold uppercase tracking-widest text-yellow-400 mb-4">
              Delivery Details
            </h3>
            <div className="space-y-3 text-gray-300">
              <div>
                <p className="text-gray-500 text-sm uppercase tracking-widest mb-1">Name</p>
                <p className="text-lg font-semibold">{order.customerName}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm uppercase tracking-widest mb-1">Phone</p>
                <p className="text-lg font-semibold">{order.phone}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm uppercase tracking-widest mb-1">Address</p>
                <p className="text-lg font-semibold whitespace-pre-wrap">{order.address}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-bold uppercase tracking-widest text-yellow-400 mb-4">
              Order Items
            </h3>
            <div className="space-y-3">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center pb-3 border-b border-gray-800 last:border-b-0">
                  <div>
                    <p className="text-yellow-400 text-sm font-bold uppercase tracking-widest">
                      {item.productBrand}
                    </p>
                    <p className="text-white font-semibold">{item.productName}</p>
                    <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-yellow-400 font-bold text-lg">
                    د.ع {formatIqdAmount(parseIqdAmount(item.price) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-lg">Total Amount:</span>
              <span className="text-4xl font-black text-yellow-400">
                د.ع {formatIqdAmount(order.totalPrice)}
              </span>
            </div>
          </div>

          {/* Order Date */}
          <div className="text-center text-gray-500 text-sm pt-4">
            <p>
              Order placed on{' '}
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-b from-yellow-500/10 to-transparent border border-yellow-500/30 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold uppercase tracking-widest text-yellow-400 mb-3">
            What's Next?
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            Our team will contact you shortly at the provided phone number to confirm your delivery details and provide an estimated delivery time. Keep your order number handy for reference.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => setLocation('/')}
            className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wide py-4 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
}
