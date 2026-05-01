import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useCalculator } from "@/lib/calculator-context";
import { useColors } from "@/hooks/use-colors";

function formatNumber(num: number): string {
  return num.toLocaleString("zh-TW", { maximumFractionDigits: 0 });
}

const QUICK_AMOUNTS = [10000000, 20000000, 30000000, 50000000, 80000000, 100000000];

export default function ExchangeScreen() {
  const { settings, updateSettings } = useCalculator();
  const colors = useColors();
  const [rateInput, setRateInput] = useState(settings.exchangeRate.toString());
  const [useManual, setUseManual] = useState(settings.useManualRate);

  const currentRate = parseFloat(rateInput) || settings.exchangeRate;

  const handleSaveRate = async () => {
    const rate = parseFloat(rateInput);
    if (!rate || rate <= 0) {
      Alert.alert("無效匯率", "請輸入有效的匯率數值。");
      return;
    }
    await updateSettings({ exchangeRate: rate, useManualRate: useManual });
    Alert.alert("已更新", "匯率設定已儲存。");
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-3 flex-row items-center gap-2">
          <Text style={{ fontSize: 22 }}>💱</Text>
          <Text className="text-xl font-bold text-foreground">匯率設定</Text>
        </View>

        {/* Current Rate Display */}
        <View className="mx-4 mb-4 bg-surface rounded-2xl p-5 border border-border shadow-sm">
          <Text className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">
            當前使用匯率
          </Text>
          <View className="flex-row items-end gap-2 mb-1">
            <Text className="text-5xl font-bold text-primary">{currentRate.toFixed(4)}</Text>
          </View>
          <Text className="text-sm text-muted">1 KRW = {currentRate.toFixed(4)} TWD</Text>
          <Text className="text-xs text-muted opacity-60 mt-1">
            {useManual ? "手動設定匯率" : "手動設定匯率"}
          </Text>
        </View>

        {/* Manual Rate Input */}
        <View className="mx-4 mb-4 bg-surface rounded-2xl p-5 border border-border shadow-sm">
          <View className="flex-row items-center gap-2 mb-3">
            <Text style={{ fontSize: 18 }}>✏️</Text>
            <Text className="text-base font-semibold text-foreground">自訂匯率</Text>
          </View>

          <Text className="text-xs text-muted mb-2">
            輸入 1 韓元 (KRW) 等於多少台幣 (TWD)
          </Text>

          <View className="flex-row items-center bg-inputBg rounded-xl px-4 py-3 border border-border mb-4">
            <Text className="text-muted text-sm mr-2">1 KRW =</Text>
            <TextInput
              className="flex-1 text-lg font-semibold text-foreground"
              placeholder="0.0250"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              value={rateInput}
              onChangeText={setRateInput}
              returnKeyType="done"
              style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}
            />
            <Text className="text-muted text-sm ml-2">TWD</Text>
          </View>

          <Pressable
            onPress={handleSaveRate}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#047857" : "#059669",
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
              儲存匯率設定
            </Text>
          </Pressable>
        </View>

        {/* Quick Reference Table */}
        <View className="mx-4 mb-4 bg-surface rounded-2xl p-5 border border-border shadow-sm">
          <View className="flex-row items-center gap-2 mb-3">
            <Text style={{ fontSize: 18 }}>📊</Text>
            <Text className="text-base font-semibold text-foreground">常用換算快速參考</Text>
          </View>

          <View className="flex-row justify-between mb-2 px-2">
            <Text className="text-xs font-semibold text-muted uppercase tracking-widest flex-1">
              韓元 (KRW)
            </Text>
            <Text className="text-xs font-semibold text-muted uppercase tracking-widest flex-1 text-right">
              台幣 (TWD)
            </Text>
          </View>

          {QUICK_AMOUNTS.map((krw, idx) => (
            <View
              key={krw}
              className="flex-row justify-between items-center px-2 py-3"
              style={{
                borderTopWidth: idx > 0 ? 1 : 0,
                borderTopColor: colors.border,
              }}
            >
              <Text className="text-sm text-foreground flex-1">
                ₩{formatNumber(krw)}
              </Text>
              <Text className="text-sm font-semibold text-primary flex-1 text-right">
                ${formatNumber(krw * currentRate)}
              </Text>
            </View>
          ))}
        </View>

        {/* Info Card */}
        <View className="mx-4 mb-4 bg-surface rounded-2xl p-5 border border-border shadow-sm">
          <View className="flex-row items-center gap-2 mb-3">
            <Text style={{ fontSize: 18 }}>ℹ️</Text>
            <Text className="text-base font-semibold text-foreground">匯率說明</Text>
          </View>
          <Text className="text-sm text-muted leading-6">
            韓元兌台幣匯率會隨市場波動。建議在計算前查詢最新匯率（可參考台灣銀行或各大銀行牌告匯率），並手動輸入以確保計算準確性。
          </Text>
          <Text className="text-sm text-muted leading-6 mt-2">
            一般參考範圍：1 KRW ≈ 0.023 ~ 0.027 TWD（視市場而定）
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
