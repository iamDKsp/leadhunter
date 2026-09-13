/**
 * Utility for subtle native haptic feedback on mobile devices
 */

export type HapticType = 'light' | 'medium' | 'success' | 'warning';

export const triggerHaptic = (type: HapticType = 'light') => {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'success':
          navigator.vibrate([15, 30, 15]);
          break;
        case 'warning':
          navigator.vibrate([30, 50, 30]);
          break;
        default:
          navigator.vibrate(10);
      }
    }
  } catch {
    // Graceful fallback on devices that don't support or disallow vibration
  }
};
