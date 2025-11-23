// A/B Testing Utility
// Randomly assigns users to either homepage or generator landing page

export type Variant = 'control' | 'generator';

const AB_TEST_COOKIE = 'clip_ab_variant';
const AB_TEST_ENABLED = true; // Set to false to disable A/B test

export function getABTestVariant(): Variant {
  if (!AB_TEST_ENABLED) {
    return 'control';
  }

  // Check if user already has a variant assigned
  if (typeof window !== 'undefined') {
    const existingVariant = getCookie(AB_TEST_COOKIE);
    if (existingVariant === 'control' || existingVariant === 'generator') {
      return existingVariant as Variant;
    }

    // Assign new variant (50/50 split)
    const variant: Variant = Math.random() < 0.5 ? 'control' : 'generator';
    setCookie(AB_TEST_COOKIE, variant, 30); // 30 days
    
    // Track variant assignment
    if ((window as any).gtag) {
      (window as any).gtag('event', 'ab_test_assigned', {
        variant: variant,
      });
    }

    return variant;
  }

  return 'control';
}

export function shouldRedirectToGenerator(): boolean {
  return getABTestVariant() === 'generator';
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

// Analytics tracking helper
export function trackABTestConversion(variant: Variant, source: string): void {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'conversion', {
      variant: variant,
      source: source,
      send_to: 'ab_test_conversion',
    });
  }
}

