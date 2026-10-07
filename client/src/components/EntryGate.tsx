import { useEffect, useState, type ReactNode } from 'react';
import { Check, Crown, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { hasVerifiedEntry, markEntryVerified } from '@shared/entry-gate';
import { trpc } from '@/lib/trpc';
import { STOREFRONT_QUERY_STALE_TIME_MS, writeStorefrontSnapshot } from '@/lib/storefrontCache';

interface EntryGateProps {
  children: ReactNode;
}

export default function EntryGate({ children }: EntryGateProps) {
  const { language } = useLanguage();
  const [isVerified, setIsVerified] = useState(() =>
    typeof window !== 'undefined' && hasVerifiedEntry(window.sessionStorage),
  );
  const [isChecked, setIsChecked] = useState(false);
  const { data: products } = trpc.products.list.useQuery(undefined, {
    staleTime: STOREFRONT_QUERY_STALE_TIME_MS,
  });
  const { data: categories } = trpc.categories.list.useQuery(undefined, {
    staleTime: STOREFRONT_QUERY_STALE_TIME_MS,
  });
  const { data: settings } = trpc.settings.get.useQuery(undefined, {
    staleTime: STOREFRONT_QUERY_STALE_TIME_MS,
  });

  useEffect(() => {
    if (!products || !categories || !settings || typeof window === 'undefined') return;
    writeStorefrontSnapshot(window.localStorage, {
      products,
      categories,
      settings: {
        storeName: settings.storeName,
        storeDescription: settings.storeDescription || '',
        deliveryPrice: settings.deliveryPrice,
      },
    });
  }, [products, categories, settings]);

  if (isVerified) {
    return <>{children}</>;
  }

  const copy = language === 'ku'
    ? {
        eyebrow: 'بەخێربێیت بۆ',
        title: 'CROWN DESIGN',
        subtitle: 'تکایە پێش چوونە ژوورەوە پشتڕاستی بکەرەوە',
        check: 'من ڕۆبۆت نیم',
        button: 'چوونە ژوورەوە',
        note: 'ئەم پشتڕاستکردنەوەیە تەنها بۆ ئەم سێشنەیە.',
      }
    : {
        eyebrow: 'WELCOME TO',
        title: 'CROWN DESIGN',
        subtitle: 'Please confirm before entering the storefront',
        check: "I'm not a robot",
        button: 'ENTER STOREFRONT',
        note: 'This confirmation lasts for your current browser session.',
      };

  const handleEnter = () => {
    if (!isChecked) return;
    markEntryVerified(window.sessionStorage);
    setIsVerified(true);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(234,179,8,0.16),transparent_34%),radial-gradient(circle_at_84%_82%,rgba(30,41,59,0.78),transparent_42%),linear-gradient(135deg,#020203_0%,#0b0e16_55%,#050505_100%)]" />
      <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-yellow-500/10 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-slate-500/10 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-500/70 to-transparent" />

      <section className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-lg">
          <div className="mb-8 flex items-center justify-center gap-3 text-yellow-400/80">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-yellow-500/60 sm:w-24" />
            <Sparkles className="h-4 w-4" />
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-yellow-500/60 sm:w-24" />
          </div>

          <div className="rounded-2xl border border-yellow-500/25 bg-black/65 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.58)] backdrop-blur-xl sm:p-10">
            <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full border border-yellow-500/40 bg-gradient-to-br from-yellow-500/20 to-black shadow-[0_0_40px_rgba(234,179,8,0.16)]">
              <Crown className="h-12 w-12 text-yellow-400" strokeWidth={1.4} />
            </div>

            <p className="text-center text-xs font-semibold uppercase tracking-[0.38em] text-yellow-400/80">
              {copy.eyebrow}
            </p>
            <h1 className="mt-3 text-center text-3xl font-black tracking-[0.18em] text-transparent bg-gradient-to-r from-slate-400 via-white to-yellow-400 bg-clip-text sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mx-auto mt-5 max-w-sm text-center text-sm leading-6 text-slate-400 sm:text-base">
              {copy.subtitle}
            </p>

            <button
              type="button"
              aria-checked={isChecked}
              role="checkbox"
              onClick={() => setIsChecked((checked) => !checked)}
              className="mt-8 flex w-full items-center gap-4 rounded-xl border border-slate-700 bg-slate-950/75 p-4 text-left transition-colors hover:border-yellow-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border transition-all ${isChecked ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-slate-500 bg-black text-transparent'}`}>
                <Check className="h-5 w-5" strokeWidth={3} />
              </span>
              <span className="flex-1 text-sm font-semibold text-white sm:text-base">{copy.check}</span>
              <ShieldCheck className={`h-6 w-6 flex-shrink-0 transition-colors ${isChecked ? 'text-yellow-400' : 'text-slate-600'}`} />
            </button>

            <button
              type="button"
              onClick={handleEnter}
              disabled={!isChecked}
              className="mt-5 w-full rounded-xl bg-yellow-500 px-6 py-4 text-sm font-black tracking-[0.16em] text-black transition-all hover:bg-yellow-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 sm:text-base"
            >
              {copy.button}
            </button>

            <p className="mt-5 text-center text-xs leading-5 text-slate-500">{copy.note}</p>
          </div>

          <p className="mt-6 text-center text-[10px] uppercase tracking-[0.3em] text-slate-600">Premium designs · Iraq</p>
        </div>
      </section>
    </main>
  );
}
