import { useState, useEffect, useCallback } from "react";

export interface NotificationPrefs {
  enabled: boolean;
  daysAhead: number; // 1 | 2 | 3 | 7
  reminderHour: number; // 0-23, default 8 (8am)
}

const KEY = "lawnrx-notification-prefs";

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  daysAhead: 1,
  reminderHour: 8,
};

function loadPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PREFS;
}

function savePrefs(prefs: NotificationPrefs) {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}

export function useNotifications() {
  const [prefs, setPrefsState] = useState<NotificationPrefs>(loadPrefs);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  const updatePrefs = useCallback((update: Partial<NotificationPrefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...update };
      savePrefs(next);
      return next;
    });
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "denied" as const;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const enable = useCallback(async () => {
    const result = await requestPermission();
    if (result === "granted") {
      updatePrefs({ enabled: true });
      return true;
    }
    return false;
  }, [requestPermission, updatePrefs]);

  const disable = useCallback(() => {
    updatePrefs({ enabled: false });
  }, [updatePrefs]);

  const fireNotification = useCallback((title: string, body: string) => {
    if (permission === "granted" && prefs.enabled) {
      try {
        new Notification(title, { body, icon: "/favicon.ico", tag: title });
      } catch {}
    }
  }, [permission, prefs.enabled]);

  const notifyUpcoming = useCallback(
    (events: Array<{ stepTitle: string; planTitle: string; date: Date }>) => {
      if (!prefs.enabled || permission !== "granted") return;
      const now = new Date();
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() + prefs.daysAhead);

      const upcoming = events.filter(
        (e) => e.date >= now && e.date <= cutoff
      );

      if (upcoming.length === 0) return;

      if (upcoming.length === 1) {
        fireNotification(
          `🌿 Treatment reminder: ${upcoming[0].stepTitle}`,
          `Due for "${upcoming[0].planTitle}"`
        );
      } else {
        fireNotification(
          `🌿 ${upcoming.length} lawn treatments coming up`,
          upcoming.map((e) => e.stepTitle).slice(0, 3).join(", ") +
            (upcoming.length > 3 ? ` +${upcoming.length - 3} more` : "")
        );
      }
    },
    [prefs, permission, fireNotification]
  );

  return { prefs, permission, enable, disable, updatePrefs, notifyUpcoming };
}
