import React, { useState, useCallback, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useCalculator } from "@/lib/calculator-context";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { getLatestExchangeRates } from "@/lib/central-bank-rate-service";

function formatNumber(num: number): string {
  return num.toLocaleString("zh-TW", { maximumFractionDigits: 0 });
}

function parseInput(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

type CurrencyType = "krw" | "usd" | null;

export default function CalculatorScreen() {
  const { settings, saveRecord, updateSettings } = useCalculator();
  const colors = useColors();

  const [krwInput, setKrwInput] = useState("");
  const [usdInput, setUsdInput] = useState("");
  const [activeCurrency, setActiveCurrency] = useState<CurrencyType>(null);
  const [saving, setSaving] = useState(false);
  const [loadingRates, setLoadingRates] = useState(true);
  const [rateUpdateTime, setRateUpdateTime] = useState<string>("");

  // 頁面載入時自動查詢當日匯率
  useEffect(() => {
    fetchAndUpdateRates();
  }, []);

  const fetchAndUpdateRates = useCallback(async () => {
    setLoadingRates(true);
    try {
      const rates = await getLatestExchangeRates();
      if (rates && rates.usdRate > 0 && rates.krwRate > 0) {
        await updateSettings({
          usdExchangeRate: rates.usdRate,
          exchangeRate: rates.krwRate,
        });
        setRateUpdateTime(`${rates.date} (${rates.source})`);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        console.warn("Failed to fetch rates, using default values");
        setRateUpdateTime("使用預設匯率");
      }
    } catch (error) {
      console.error("Error fetching rates:", error);
      setRateUpdateTime("使用預設匯率");
    } finally {
      setLoadingRates(false);
    }
  }, [updateSettings]);

  const krwAmount = parseInput(krwInput);
  const usdAmount = parseInput(usdInput);

  // 根據輸入的幣別決定計算邏輯
  const isKrwMode = activeCurrency === "krw" || (krwAmount > 0 && usdAmount === 0);
  const isUsdMode = activeCurrency === "usd" || (usdAmount > 0 && krwAmount === 0);

  // 計算台幣金額
  const twdAmount = isKrwMode ? krwAmount * settings.exchangeRate : usdAmount * settings.usdExchangeRate;
  
  const taxAmount = twdAmount * (settings.taxRate / 100);
  const handlingFee = settings.handlingFee;
  const totalAmount = twdAmount + taxAmount + handlingFee;

  const handleKrwChange = (text: string) => {
    setKrwInput(text);
    if (parseInput(text) > 0) {
      setActiveCurrency("krw");
      setUsdInput(""); // 清空美金輸入
    } else if (parseInput(text) === 0 && parseInput(usdInput) === 0) {
      setActiveCurrency(null);
    }
  };

  const handleUsdChange = (text: string) => {
    setUsdInput(text);
    if (parseInput(text) > 0) {
      setActiveCurrency("usd");
      setKrwInput(""); // 清空韓元輸入
    } else if (parseInput(text) === 0 && parseInput(krwInput) === 0) {
      setActiveCurrency(null);
    }
  };

  const handleSave = useCallback(async () => {
    if (twdAmount <= 0) {
      Alert.alert("請輸入金額", "請先輸入韓元或美金金額再儲存。");
      return;
    }
    setSaving(true);
    try {
      const currencyLabel = isKrwMode ? "韓元" : "美金";
      const originalAmount = isKrwMode ? krwAmount : usdAmount;
      
      await saveRecord({
        krwAmount: isKrwMode ? krwAmount : 0,
        exchangeRate: isKrwMode ? settings.exchangeRate : settings.usdExchangeRate,
        twdAmount,
        taxAmount,
        handlingFee,
        totalAmount,
        note: `${currencyLabel}: ${formatNumber(originalAmount)}`,
      });
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        "已儲存",
        `${currencyLabel}計算結果已成功儲存至紀錄。\n\n提示：前往『紀錄』頁面可以編輯標題，方便日後彙整統計。`
      );
      setKrwInput("");
      setUsdInput("");
      setActiveCurrency(null);
    } catch (e) {
      Alert.alert("儲存失敗", "請稍後再試。");
    } finally {
      setSaving(false);
    }
  }, [isKrwMode, krwAmount, usdAmount, twdAmount, taxAmount, handlingFee, totalAmount, settings, saveRecord]);

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-3 flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
            <Text style={{ color: "#fff", fontSize: 16 }}>🚗</Text>
          </View>
          <Text className="text-xl font-bold text-foreground">購車成本計算器</Text>
        </View>

        {/* Currency Input Card */}
        <View className="mx-4 mb-4 bg-surface rounded-2xl p-5 border border-border shadow-sm">
          <View className="flex-row items-center gap-2 mb-4">
            <Text style={{ fontSize: 18 }}>💱</Text>
            <Text className="text-base font-semibold text-foreground">幣別轉台幣換算</Text>
          </View>

          {/* KRW Input Section */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs font-semibold text-muted uppercase tracking-widest">
                輸入韓元 (KRW)
              </Text>
              <Text className="text-xs text-muted">
                當日: 1 KRW = {settings.exchangeRate.toFixed(1)} TWD
              </Text>
            </View>
            <View className="flex-row items-center bg-inputBg rounded-xl px-4 py-3 border border-border">
              <Text className="text-muted text-base mr-2">₩</Text>
              <TextInput
                className="flex-1 text-lg font-semibold text-foreground"
                placeholder="50,000,000"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                value={krwInput}
                onChangeText={handleKrwChange}
                returnKeyType="done"
                style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}
              />
            </View>
          </View>

          {/* Divider */}
          <View className="flex-row items-center gap-2 mb-4">
            <View className="flex-1 h-px bg-border" />
            <Text className="text-xs text-muted font-semibold">或</Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          {/* USD Input Section */}
          <View>
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs font-semibold text-muted uppercase tracking-widest">
                輸入美金 (USD)
              </Text>
              <Text className="text-xs text-muted">
                當日: 1 USD = {settings.usdExchangeRate.toFixed(1)} TWD
              </Text>
            </View>
            <View className="flex-row items-center bg-inputBg rounded-xl px-4 py-3 border border-border">
              <Text className="text-muted text-base mr-2">$</Text>
              <TextInput
                className="flex-1 text-lg font-semibold text-foreground"
                placeholder="50,000"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                value={usdInput}
                onChangeText={handleUsdChange}
                returnKeyType="done"
                style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}
              />
            </View>
          </View>

          {/* Status Indicator */}
          {activeCurrency && (
            <View className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Text className="text-xs text-blue-700 font-semibold">
                ℹ️ 目前使用{activeCurrency === "krw" ? "韓元" : "美金"}計算，另一幣別已自動清空
              </Text>
            </View>
          )}
        </View>

        {/* Auto Exchange Rate Section */}
        <View className="mx-4 mb-4 bg-background rounded-xl p-4 border border-border">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-semibold text-muted uppercase tracking-widest">
              自動換算 (TWD)
            </Text>
            {loadingRates && (
              <Text className="text-xs text-primary font-semibold">更新中...</Text>
            )}
          </View>
          <View className="flex-row items-end justify-between mb-3">
            <Text className="text-3xl font-bold text-primary">
              {twdAmount > 0 ? formatNumber(twdAmount) : "—"}
            </Text>
          </View>
          {rateUpdateTime && (
            <Text className="text-xs text-muted">
              當日匯率: {rateUpdateTime}
            </Text>
          )}
        </View>

        {/* Tax Card */}
        <View className="mx-4 mb-4 bg-surface rounded-2xl p-5 border border-border shadow-sm">
          <View className="flex-row items-center gap-2 mb-3">
            <Text style={{ fontSize: 18 }}>🏛️</Text>
            <Text className="text-base font-semibold text-foreground">
              進口稅金計算 ({settings.taxRate}%)
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="flex-1 bg-inputBg rounded-xl p-3 border border-border">
              <Text className="text-xs text-muted mb-1">車輛進口淨成本 (TWD)</Text>
              <Text className="text-base font-semibold text-foreground">
                {twdAmount > 0 ? formatNumber(twdAmount) : "—"}
              </Text>
            </View>
            <Text className="text-primary text-xl">→</Text>
            <View className="flex-1 bg-green-50 rounded-xl p-3 border border-green-100">
              <Text className="text-xs text-green-700 mb-1">預估總稅額</Text>
              <Text className="text-xl font-bold text-primary">
                {twdAmount > 0 ? formatNumber(taxAmount) : "—"}
              </Text>
              <Text className="text-xs text-green-600 mt-1">TWD</Text>
            </View>
          </View>
          <Text className="text-xs text-muted mt-2">
            包含進口稅、貨物稅、營業稅及推廣貿易服務費
          </Text>
        </View>

        {/* Handling Fee Card */}
        <View className="mx-4 mb-4 bg-surface rounded-2xl p-5 border border-border shadow-sm">
          <View className="flex-row items-center gap-2 mb-3">
            <Text style={{ fontSize: 18 }}>💳</Text>
            <Text className="text-base font-semibold text-foreground">手續與規費</Text>
          </View>

          <View className="flex-row items-center justify-between bg-inputBg rounded-xl px-4 py-3 border border-border">
            <View>
              <Text className="text-xs text-muted mb-1">過戶費及運費</Text>
              <Text className="text-base font-semibold text-foreground">
                {formatNumber(handlingFee)} TWD
              </Text>
            </View>
            <Text className="text-xs text-muted">可於設定調整</Text>
          </View>
          <Text className="text-xs text-muted mt-2">
            包含領牌費、代辦費等行政規費，以及國際海運與國內拖運之固定費用
          </Text>
        </View>

        {/* Summary Card */}
        <View className="mx-4 mb-4 bg-surface rounded-2xl border-t-4 border-primary shadow-sm overflow-hidden">
          <View className="p-5">
            <View className="flex-row items-center gap-2 mb-4">
              <Text style={{ fontSize: 18 }}>🧾</Text>
              <Text className="text-base font-semibold text-foreground">費用明細總覽</Text>
            </View>

            <View className="gap-3">
              <View className="flex-row justify-between items-center py-2 border-b border-border">
                <Text className="text-sm text-muted">車輛淨成本</Text>
                <Text className="text-base font-semibold text-foreground">
                  {twdAmount > 0 ? `$${formatNumber(twdAmount)}` : "—"}
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-2 border-b border-border">
                <Text className="text-sm text-muted">預估稅金 ({settings.taxRate}%)</Text>
                <Text className="text-base font-semibold text-foreground">
                  {twdAmount > 0 ? `$${formatNumber(taxAmount)}` : "—"}
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-2 border-b border-border">
                <Text className="text-sm text-muted">過戶費及運費</Text>
                <Text className="text-base font-semibold text-foreground">
                  ${formatNumber(handlingFee)}
                </Text>
              </View>

              <View className="pt-3 mt-1 border-t-2 border-dashed border-border">
                <View className="flex-row justify-between items-end">
                  <View>
                    <Text className="text-xs text-muted uppercase tracking-widest mb-1">
                      預估總成本
                    </Text>
                    <Text className="text-xs text-muted">含稅費及手續費</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-4xl font-bold text-foreground">
                      {twdAmount > 0 ? formatNumber(totalAmount) : "—"}
                    </Text>
                    <Text className="text-xs text-muted">TWD</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={saving || twdAmount <= 0}
            style={({ pressed }) => ({
              backgroundColor: twdAmount > 0 ? (pressed ? "#047857" : "#059669") : "#d1d5db",
              margin: 16,
              marginTop: 0,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              transform: [{ scale: pressed ? 0.97 : 1 }],
              opacity: saving ? 0.7 : 1,
            })}
          >
            <Text style={{ color: twdAmount > 0 ? "#fff" : "#6b7280", fontSize: 16, fontWeight: "600" }}>
              {saving ? "儲存中..." : "🧮 重新計算並儲存"}
            </Text>
          </Pressable>

          {/* Disclaimer */}
          <View className="mx-4 mb-4 flex-row items-start gap-2 p-3 bg-background rounded-xl border border-border">
            <Text style={{ fontSize: 14 }}>ℹ️</Text>
            <Text className="text-xs text-muted flex-1 leading-5">
              本計算結果僅供參考，實際費用可能因排氣量、到港匯率及相關法規調整而有所變動。
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
