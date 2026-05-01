import { describe, it, expect } from "vitest";

// Core calculation logic extracted for testing
function calculateCosts(params: {
  krwAmount: number;
  exchangeRate: number;
  taxRate: number;
  handlingFee: number;
}) {
  const { krwAmount, exchangeRate, taxRate, handlingFee } = params;
  const twdAmount = krwAmount * exchangeRate;
  const taxAmount = twdAmount * (taxRate / 100);
  const totalAmount = twdAmount + taxAmount + handlingFee;
  return { twdAmount, taxAmount, totalAmount };
}

describe("購車成本計算器 - 核心計算邏輯", () => {
  it("韓元轉台幣換算正確", () => {
    const result = calculateCosts({
      krwAmount: 50_000_000,
      exchangeRate: 0.025,
      taxRate: 54.3,
      handlingFee: 150_000,
    });
    expect(result.twdAmount).toBe(1_250_000);
  });

  it("進口稅金計算正確（54.3%）", () => {
    const result = calculateCosts({
      krwAmount: 50_000_000,
      exchangeRate: 0.025,
      taxRate: 54.3,
      handlingFee: 150_000,
    });
    expect(result.taxAmount).toBeCloseTo(678_750, 0);
  });

  it("總成本計算正確（含稅金與手續費）", () => {
    const result = calculateCosts({
      krwAmount: 50_000_000,
      exchangeRate: 0.025,
      taxRate: 54.3,
      handlingFee: 150_000,
    });
    // 1,250,000 + 678,750 + 150,000 = 2,078,750
    expect(result.totalAmount).toBeCloseTo(2_078_750, 0);
  });

  it("韓元為 0 時，台幣金額應為 0", () => {
    const result = calculateCosts({
      krwAmount: 0,
      exchangeRate: 0.025,
      taxRate: 54.3,
      handlingFee: 150_000,
    });
    expect(result.twdAmount).toBe(0);
    expect(result.taxAmount).toBe(0);
    expect(result.totalAmount).toBe(150_000);
  });

  it("自訂稅率計算正確", () => {
    const result = calculateCosts({
      krwAmount: 10_000_000,
      exchangeRate: 0.025,
      taxRate: 30,
      handlingFee: 100_000,
    });
    const expected = {
      twdAmount: 250_000,
      taxAmount: 75_000,
      totalAmount: 425_000,
    };
    expect(result.twdAmount).toBeCloseTo(expected.twdAmount, 0);
    expect(result.taxAmount).toBeCloseTo(expected.taxAmount, 0);
    expect(result.totalAmount).toBeCloseTo(expected.totalAmount, 0);
  });

  it("自訂匯率計算正確", () => {
    const result = calculateCosts({
      krwAmount: 50_000_000,
      exchangeRate: 0.026,
      taxRate: 54.3,
      handlingFee: 150_000,
    });
    expect(result.twdAmount).toBeCloseTo(1_300_000, 0);
    expect(result.taxAmount).toBeCloseTo(705_900, 0);
  });
});

describe("數字格式化", () => {
  function formatNumber(num: number): string {
    return num.toLocaleString("zh-TW", { maximumFractionDigits: 0 });
  }

  it("大數字格式化含千分位", () => {
    const formatted = formatNumber(2_078_750);
    expect(formatted).toContain(",");
  });

  it("零值格式化為 0", () => {
    const formatted = formatNumber(0);
    expect(formatted).toBe("0");
  });
});
