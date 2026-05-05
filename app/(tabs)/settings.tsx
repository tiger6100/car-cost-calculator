import React, { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  Switch,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useCalculator } from "@/lib/calculator-context";
import { useColors } from "@/hooks/use-colors";

function SettingRow({
  label,
  description,
  value,
  onChangeText,
  suffix,
  keyboardType = "decimal-pad",
}: {
  label: string;
  description?: string;
  value: string;
  onChangeText: (text: string) => void;
  suffix?: string;
  keyboardType?: "decimal-pad" | "numeric";
}) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.inputBg,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <TextInput
          style={{ flex: 1, fontSize: 16, fontWeight: "600", color: colors.foreground }}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          returnKeyType="done"
          placeholderTextColor={colors.muted}
        />
        {suffix && (
          <Text style={{ fontSize: 14, color: colors.muted, marginLeft: 8 }}>{suffix}</Text>
        )}
      </View>
      {description && (
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4, lineHeight: 18 }}>
          {description}
        </Text>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings } = useCalculator();
  const colors = useColors();

  const [taxRate, setTaxRate] = useState(settings.taxRate.toString());
  const [handlingFee, setHandlingFee] = useState(settings.handlingFee.toString());
  const [exchangeRate, setExchangeRate] = useState(settings.exchangeRate.toFixed(4));
  const [usdExchangeRate, setUsdExchangeRate] = useState(settings.usdExchangeRate.toFixed(4));

  useEffect(() => {
    setTaxRate(settings.taxRate.toString());
    setHandlingFee(settings.handlingFee.toString());
    setExchangeRate(settings.exchangeRate.toFixed(4));
    setUsdExchangeRate(settings.usdExchangeRate.toFixed(4));
  }, [settings]);

  const handleSave = async () => {
    const parsedTax = parseFloat(taxRate);
    const parsedFee = parseFloat(handlingFee.replace(/[^0-9.]/g, ""));
    const parsedRate = parseFloat(exchangeRate);
    const parsedUsdRate = parseFloat(usdExchangeRate);

    if (isNaN(parsedTax) || parsedTax <= 0 || parsedTax > 200) {
      Alert.alert("無效稅率", "請輸入有效的稅率（0~200%）。");
      return;
    }
    if (isNaN(parsedFee) || parsedFee < 0) {
      Alert.alert("無效手續費", "請輸入有效的手續費金額。");
      return;
    }
    if (isNaN(parsedRate) || parsedRate <= 0) {
      Alert.alert("無效韓元匯率", "請輸入有效的韓元匯率數值。");
      return;
    }
    if (isNaN(parsedUsdRate) || parsedUsdRate <= 0) {
      Alert.alert("無效美元匯率", "請輸入有效的美元匯率數值。");
      return;
    }

    await updateSettings({
      taxRate: parsedTax,
      handlingFee: parsedFee,
      exchangeRate: parsedRate,
      usdExchangeRate: parsedUsdRate,
    });
    Alert.alert("已儲存", "設定已成功更新。");
  };

  const handleReset = () => {
    Alert.alert("重置設定", "確定要將所有設定恢復為預設值嗎？", [
      { text: "取消", style: "cancel" },
      {
        text: "重置",
        style: "destructive",
        onPress: async () => {
          await updateSettings({
            taxRate: 54.3,
            handlingFee: 150000,
            exchangeRate: 0.0215,
            usdExchangeRate: 30.5,
            useManualRate: true,
          });
          setTaxRate("54.3");
          setHandlingFee("150000");
          setExchangeRate("0.0215");
          setUsdExchangeRate("30.5");
          Alert.alert("已重置", "設定已恢復為預設值。");
        },
      },
    ]);
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-3 flex-row items-center gap-2">
          <Text style={{ fontSize: 22 }}>⚙️</Text>
          <Text className="text-xl font-bold text-foreground">設定</Text>
        </View>

        {/* Tax Settings */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Text style={{ fontSize: 18 }}>🏛️</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              稅率設定
            </Text>
          </View>

          <SettingRow
            label="進口稅率 (%)"
            description="台灣進口車輛綜合稅率，預設 54.3%（含進口稅、貨物稅、營業稅及推廣貿易服務費）"
            value={taxRate}
            onChangeText={setTaxRate}
            suffix="%"
          />
        </View>

        {/* Fee Settings */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Text style={{ fontSize: 18 }}>💳</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              手續費設定
            </Text>
          </View>

          <SettingRow
            label="過戶費及運費 (TWD)"
            description="包含領牌費、代辦費等行政規費，以及國際海運與國內拖運費用"
            value={handlingFee}
            onChangeText={setHandlingFee}
            suffix="TWD"
            keyboardType="numeric"
          />
        </View>

        {/* Exchange Rate Settings */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Text style={{ fontSize: 18 }}>💱</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              匯率設定
            </Text>
          </View>

            <SettingRow
            label="KRW/TWD 匯率"
            description="韓元對台幣匯率，預設值來自合作金庫賣出匯率"
            value={exchangeRate}
            onChangeText={setExchangeRate}
            suffix="TWD"
          />

          <SettingRow
            label="USD/TWD 匯率"
            description="美元對台幣匯率，預設值來自合作金庫賣出匯率"
            value={usdExchangeRate}
            onChangeText={setUsdExchangeRate}
            suffix="TWD"
          />
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => ({
            marginHorizontal: 16,
            marginBottom: 12,
            backgroundColor: pressed ? "#047857" : "#059669",
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            💾 儲存設定
          </Text>
        </Pressable>

        {/* Reset Button */}
        <Pressable
          onPress={handleReset}
          style={({ pressed }) => ({
            marginHorizontal: 16,
            marginBottom: 24,
            backgroundColor: pressed ? "#f3f4f6" : colors.surface,
            borderRadius: 16,
            paddingVertical: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}
        >
          <Text style={{ color: colors.muted, fontSize: 15, fontWeight: "600" }}>
            🔄 重置為預設值
          </Text>
        </Pressable>

        {/* About */}
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Text style={{ fontSize: 18 }}>🚗</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              關於本應用程式
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22 }}>
            購車成本計算器專為有意從韓國進口車輛至台灣的消費者設計，提供快速精確的進口成本估算。
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 12 }}>
            版本 1.0.0 · 計算結果僅供參考
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
