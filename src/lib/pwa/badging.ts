/**
 * Native App Icon Badging API helper.
 * Displays the count of pending goals/tasks on the PWA app icon on the user's home screen.
 */

export async function updateAppBadge(pendingCount: number): Promise<void> {
  if (typeof window === 'undefined' || !('setAppBadge' in navigator)) {
    return;
  }

  try {
    if (pendingCount > 0) {
      await (navigator as any).setAppBadge(pendingCount);
    } else {
      await (navigator as any).clearAppBadge();
    }
  } catch (err) {
    // Some browsers reject if permission is not granted or window is unfocused
  }
}

export async function clearAppBadge(): Promise<void> {
  if (typeof window === 'undefined' || !('clearAppBadge' in navigator)) {
    return;
  }

  try {
    await (navigator as any).clearAppBadge();
  } catch (_) {}
}
