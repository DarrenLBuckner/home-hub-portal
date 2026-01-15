// Global type declarations

// Facebook Pixel
declare global {
  interface Window {
    fbq: (
      action: 'track' | 'init' | 'trackCustom',
      event: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

export {};
