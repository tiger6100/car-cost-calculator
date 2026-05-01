import React, { createContext, useContext } from "react";
import { useCalculatorStore, type AppSettings, type CalculationRecord } from "@/hooks/use-calculator-store";

interface CalculatorContextType {
  records: CalculationRecord[];
  settings: AppSettings;
  loading: boolean;
  saveRecord: (record: Omit<CalculationRecord, "id" | "date">) => Promise<CalculationRecord>;
  deleteRecord: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  updateRecordTitle: (id: string, title: string) => Promise<void>;
  updateExchangeRateFromAPI: (rate: number, source: string) => Promise<void>;
}

const CalculatorContext = createContext<CalculatorContextType | null>(null);

export function CalculatorProvider({ children }: { children: React.ReactNode }) {
  const store = useCalculatorStore();
  return (
    <CalculatorContext.Provider value={store}>
      {children}
    </CalculatorContext.Provider>
  );
}

export function useCalculator() {
  const ctx = useContext(CalculatorContext);
  if (!ctx) throw new Error("useCalculator must be used within CalculatorProvider");
  return ctx;
}
