import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export interface CalculationRecord {
  id: string;
  date: string;
  krwAmount: number;
  exchangeRate: number;
  twdAmount: number;
  taxAmount: number;
  handlingFee: number;
  totalAmount: number;
  note?: string;
  title?: string;
}

export interface AppSettings {
  taxRate: number; // 預設 54.3
  handlingFee: number; // 預設 150000
  exchangeRate: number; // 韓元匯率
  usdExchangeRate: number; // 美元匯率
  useManualRate: boolean;
  rateSource?: string; // 匯率來源
  rateLastUpdated?: string; // 匯率最後更新時間
}

const RECORDS_KEY = "car_cost_records";
const SETTINGS_KEY = "car_cost_settings";

const DEFAULT_SETTINGS: AppSettings = {
  taxRate: 54.3,
  handlingFee: 150000,
  exchangeRate: 0, // 將由中央銀行當日匯率填入
  usdExchangeRate: 0, // 將由中央銀行當日匯率填入
  useManualRate: false, // 預設使用中央銀行當日匯率
};

export function useCalculatorStore() {
  const [records, setRecords] = useState<CalculationRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recordsJson, settingsJson] = await Promise.all([
        AsyncStorage.getItem(RECORDS_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
      ]);
      if (recordsJson) setRecords(JSON.parse(recordsJson));
      if (settingsJson) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) });
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoading(false);
    }
  };

  const saveRecord = useCallback(
    async (record: Omit<CalculationRecord, "id" | "date">) => {
      const newRecord: CalculationRecord = {
        ...record,
        id: Date.now().toString(),
        date: new Date().toISOString(),
      };
      const updated = [newRecord, ...records];
      setRecords(updated);
      await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(updated));
      return newRecord;
    },
    [records]
  );

  const deleteRecord = useCallback(
    async (id: string) => {
      const updated = records.filter((r) => r.id !== id);
      setRecords(updated);
      await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(updated));
    },
    [records]
  );

  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    },
    [settings]
  );

  const updateRecordTitle = useCallback(
    async (id: string, title: string) => {
      const updated = records.map((r) => (r.id === id ? { ...r, title } : r));
      setRecords(updated);
      await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(updated));
    },
    [records]
  );

  const updateExchangeRateFromAPI = useCallback(
    async (rate: number, source: string) => {
      const today = new Date().toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const updated = {
        ...settings,
        exchangeRate: rate,
        useManualRate: false,
        rateSource: source,
        rateLastUpdated: today,
      };
      setSettings(updated);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    },
    [settings]
  );

  return {
    records,
    settings,
    loading,
    saveRecord,
    deleteRecord,
    updateSettings,
    updateRecordTitle,
    updateExchangeRateFromAPI,
  };
}
