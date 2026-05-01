import React, { useState, useCallback } from "react";
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

function formatNumber(num: number): string {
  return num.toLocaleString("zh-TW", { maximumFractionDigits: 0 });
}

function parseInput(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

export default function CalculatorScreen() {
  const { settings, saveRecord } = useCalculator();
  const colors = useColors();

  const [krwInput, setKrwInput] = useState("");
  const [saving, setSaving] = useState(false);

  const krwAmount = parseInput(krwInput);
  const exchangeRate = settings.exchangeRate;
  const twdAmount = krwAmount * exchangeRate;
  const taxAmount = twdAmount * (settings.taxRate / 100);
  const handlingFee = settings.handlingFee;
  const totalAmount = twdAmount + taxAmount + handlingFee;

  const handleSave = useCallback(async () => {
    if (krwAmount <= 0) {
      Alert.alert("請輸入金額", "請先輸入韓元金額再儲存。");
      return;
    }
    setSaving(true);
    try {
      await saveRecord({
        krwAmount,
        exchangeRate,
        twdAmount,
        taxAmount,
        handlingFee,
        totalAmount,
      });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        "已儲存",
        "計算結果已成功儲存至紀錄。\n\n提示：前往『紀錄』頁面可以編輯標題，方便日後彙整統計。"
      );
    } catch (e) {
      Alert.alert("儲存失敗", "請稍後再試。");
    } finally {
      setSaving(false);
    }
  }, [krwAmount, exchangeRate, twdAmount, taxAmount, handlingFee, totalAmount, saveRecord]);

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

        {/* KRW Input Card */}
        <View className="mx-4 mb-4 bg-surface rounded-2xl p-5 border border-border shadow-sm">
          <View className="flex-row items-center gap-2 mb-3">
            <Text style={{ fontSize: 18 }}>💱</Text>
            <Text className="text-base font-semibold text-foreground">韓元轉台幣換算</Text>
          </View>

          <Text className="text-xs font-semibold text-muted uppercase tracking-widest mb-1">
            輸入韓元 (KRW)
          </Text>
          <View className="flex-row items-center bg-inputBg rounded-xl px-4 py-3 border border-border mb-3">
            <Text className="text-muted text-base mr-2">₩</Text>
            <TextInput
              className="flex-1 text-lg font-semibold text-foreground"
              placeholder="50,000,000"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={krwInput}
              onChangeText={setKrwInput}
              returnKeyType="done"
              style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}
            />
          </View>

          <View className="bg-background rounded-xl p-4 border border-border">
            <Text className="text-xs font-semibold text-muted uppercase tracking-widest mb-1">
              自動換算 (TWD)
            </Text>
            <View className="flex-row items-end justify-between">
              <Text className="text-3xl font-bold text-primary">
                {krwAmount > 0 ? formatNumber(twdAmount) : "—"}
              </Text>
              <View className="items-end">
                <Text className="text-xs text-muted">
                  匯率: 1 KRW = {exchangeRate.toFixed(4)} TWD
                </Text>
                <Text className="text-xs text-muted opacity-60">手動設定</Text>
              </View>
            </View>
          </View>
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
                {krwAmount > 0 ? formatNumber(twdAmount) : "—"}
              </Text>
            </View>
            <Text className="text-primary text-xl">→</Text>
            <View className="flex-1 bg-green-50 rounded-xl p-3 border border-green-100">
              <Text className="text-xs text-green-700 mb-1">預估總稅額</Text>
              <Text className="text-xl font-bold text-primary">
                {krwAmount > 0 ? formatNumber(taxAmount) : "—"}
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
                  {krwAmount > 0 ? `$${formatNumber(twdAmount)}` : "—"}
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-2 border-b border-border">
                <Text className="text-sm text-muted">預估稅金 ({settings.taxRate}%)</Text>
                <Text className="text-base font-semibold text-foreground">
                  {krwAmount > 0 ? `$${formatNumber(taxAmount)}` : "—"}
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
                      {krwAmount > 0 ? formatNumber(totalAmount) : "—"}
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
            disabled={saving}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#047857" : "#059669",
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
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
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
