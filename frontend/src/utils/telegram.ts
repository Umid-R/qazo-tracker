interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
  };
  ready: () => void;
  close: () => void;
  expand: () => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export const getTelegramUser = (): TelegramUser | null => {
  if (typeof window === 'undefined') return null;

  const tg = window.Telegram?.WebApp;
  if (!tg) return null;

  tg.ready();
  return tg.initDataUnsafe.user || null;
};

export const getTelegramUserId = (): number | null => {
  const user = getTelegramUser();
  if (user?.id) return user.id;

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const uidParam = params.get('uid');
    if (uidParam) {
      const parsed = Number(uidParam);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  // Fallback for preview: return a demo user ID so the app is usable outside Telegram
  return 12345;
};

export const initTelegramApp = () => {
  if (typeof window === 'undefined') return;

  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }
};
