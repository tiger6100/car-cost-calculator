import React, { useState } from "react";
import {
  FlatList,
  Text,
  View,
  Pressable,
  Alert,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useCalculator } from "@/lib/calculator-context";
import { useColors } from "@/hooks/use-colors";
import type { CalculationRecord } from "@/hooks/use-calculator-store";

function formatNumber(num: number): string {
  return num.toLocaleString("zh-TW", { maximumFractionDigits: 0 });
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RecordDetailModal({
  record,
  visible,
  onClose,
  onDelete,
  onUpdateTitle,
}: {
  record: CalculationRecord | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
}) {
  const colors = useColors();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(record?.title || "");

  if (!record) return null;

  const handleSaveTitle = async () => {
    if (titleInput.trim()) {
      await onUpdateTitle(record.id, titleInput.trim());
      setEditingTitle(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Modal Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
            費用明細
          </Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              padding: 8,
            })}
          >
            <Text style={{ fontSize: 16, color: colors.primary, fontWeight: "600" }}>關閉</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Title Section */}
          <View style={{ marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              備註標題
            </Text>
            {editingTitle ? (
              <View style={{ gap: 8 }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.foreground,
                  }}
                  placeholder="輸入標題（如：2024 年 5 月 BMW X5）"
                  placeholderTextColor={colors.muted}
                  value={titleInput}
                  onChangeText={setTitleInput}
                  returnKeyType="done"
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    onPress={handleSaveTitle}
                    style={({ pressed }) => ({
                      flex: 1,
                      backgroundColor: pressed ? "#047857" : "#059669",
                      borderRadius: 10,
                      paddingVertical: 10,
                      alignItems: "center",
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    })}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>保存</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setEditingTitle(false);
                      setTitleInput(record.title || "");
                    }}
                    style={({ pressed }) => ({
                      flex: 1,
                      backgroundColor: colors.surface,
                      borderRadius: 10,
                      paddingVertical: 10,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    })}
                  >
                    <Text style={{ color: colors.muted, fontWeight: "600", fontSize: 14 }}>取消</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  setEditingTitle(true);
                  setTitleInput(record.title || "");
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: record.title ? colors.foreground : colors.muted, flex: 1 }}>
                  {record.title || "點擊新增標題..."}
                </Text>
                <Text style={{ fontSize: 16, color: colors.primary }}>✏️</Text>
              </Pressable>
            )}
          </View>

          {/* Detail Items */}
          {[
            { label: "計算時間", value: formatDate(record.date), highlight: false },
            { label: "韓元金額", value: `₩${formatNumber(record.krwAmount)}`, highlight: false },
            { label: "使用匯率", value: `1 KRW = ${record.exchangeRate.toFixed(4)} TWD`, highlight: false },
            { label: "車輛淨成本 (TWD)", value: `$${formatNumber(record.twdAmount)}`, highlight: false },
            { label: `進口稅金`, value: `$${formatNumber(record.taxAmount)}`, highlight: false },
            { label: "過戶費及運費", value: `$${formatNumber(record.handlingFee)}`, highlight: false },
          ].map((item, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 14, color: colors.muted }}>{item.label}</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                {item.value}
              </Text>
            </View>
          ))}

          {/* Total */}
          <View
            style={{
              marginTop: 16,
              padding: 16,
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
              預估總成本
            </Text>
            <Text style={{ fontSize: 36, fontWeight: "800", color: colors.primary }}>
              {formatNumber(record.totalAmount)}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>TWD</Text>
          </View>

          {/* Delete Button */}
          <Pressable
            onPress={() => {
              Alert.alert("刪除紀錄", "確定要刪除這筆計算紀錄嗎？", [
                { text: "取消", style: "cancel" },
                {
                  text: "刪除",
                  style: "destructive",
                  onPress: () => {
                    onDelete(record.id);
                    onClose();
                  },
                },
              ]);
            }}
            style={({ pressed }) => ({
              marginTop: 16,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
              backgroundColor: pressed ? "#fee2e2" : "#fef2f2",
              borderWidth: 1,
              borderColor: "#fecaca",
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            <Text style={{ color: "#dc2626", fontSize: 15, fontWeight: "600" }}>
              🗑️ 刪除此紀錄
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function HistoryScreen() {
  const { records, deleteRecord, updateRecordTitle, loading } = useCalculator();
  const colors = useColors();
  const [selectedRecord, setSelectedRecord] = useState<CalculationRecord | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleRecordPress = (record: CalculationRecord) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: CalculationRecord }) => (
    <Pressable
      onPress={() => handleRecordPress(item)}
      style={({ pressed }) => ({
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      {item.title && (
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
          {item.title}
        </Text>
      )}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ fontSize: 12, color: colors.muted }}>{formatDate(item.date)}</Text>
        <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>查看明細 →</Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <View>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>韓元金額</Text>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
            ₩{formatNumber(item.krwAmount)}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>預估總成本</Text>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.primary }}>
            ${formatNumber(item.totalAmount)}
          </Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>TWD</Text>
        </View>
      </View>
    </Pressable>
  );

  const EmptyState = () => (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
      <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
        尚無計算紀錄
      </Text>
      <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", paddingHorizontal: 40 }}>
        前往「計算」頁面輸入車輛資訊，計算完成後點擊「儲存」即可在此查看紀錄。
      </Text>
    </View>
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View className="px-5 pt-4 pb-3 flex-row items-center gap-2">
        <Text style={{ fontSize: 22 }}>📋</Text>
        <Text className="text-xl font-bold text-foreground">計算紀錄</Text>
        {records.length > 0 && (
          <View
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 2,
              marginLeft: 4,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
              {records.length}
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={loading ? null : <EmptyState />}
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />

      <RecordDetailModal
        record={selectedRecord}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onDelete={deleteRecord}
        onUpdateTitle={updateRecordTitle}
      />
    </ScreenContainer>
  );
}
