import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  receiptFooter: string;
}

const defaultSettings: StoreSettings = {
  storeName: 'PhoneStore',
  storeAddress: '123 Tech Street, Lagos',
  storePhone: '08012345678',
  receiptFooter: 'Thank you for your purchase!\nGoods sold are not returnable.',
};

interface StoreSettingsContextType {
  settings: StoreSettings;
  updateSettings: (newSettings: StoreSettings) => void;
}

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'phonestore_settings';

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
  };

  return (
    <StoreSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider');
  }
  return context;
}
