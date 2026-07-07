declare global {
  interface Window {
    Cashfree?: (config: { mode: 'sandbox' | 'production' }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget: '_self' | '_blank' }) => Promise<void>;
    };
  }
}

const SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Cashfree) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.body.appendChild(script);
  });
}

/** Launches the Cashfree hosted checkout for the given payment session, redirecting back to our return URL on completion. */
export async function launchCashfreeCheckout(paymentSessionId: string): Promise<void> {
  await loadScript();
  if (!window.Cashfree) throw new Error('Cashfree SDK unavailable');

  const mode = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'PRODUCTION' ? 'production' : 'sandbox';
  const cashfree = window.Cashfree({ mode });
  await cashfree.checkout({ paymentSessionId, redirectTarget: '_self' });
}
