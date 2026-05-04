/**
 * 台灣匯率 API 服務
 * 提取當日美金 (USD) 及韓幣 (KRW) 對台幣的賣出匯率
 */

export interface ExchangeRates {
  usdRate: number;
  krwRate: number;
  date: string;
  source: string;
}

/**
 * 備用方案：使用 ExchangeRate-API
 * 此方案不需要 API 金鑰
 */
export async function fetchAlternativeRates(): Promise<ExchangeRates | null> {
  try {
    // 使用 exchangerate-api.com 的免費 API
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/TWD"
    );

    if (!response.ok) {
      console.error("Failed to fetch from alternative API:", response.status);
      return null;
    }

    const data = await response.json();

    if (!data || typeof data !== "object" || !data.rates) {
      console.error("Invalid JSON response from alternative API");
      return null;
    }

    // 計算 USD 和 KRW 對 TWD 的匯率
    // API 返回的是 1 TWD = X USD/KRW，需要反轉
    let usdRate = data.rates.USD ? 1 / data.rates.USD : null;
    let krwRate = data.rates.KRW ? 1 / data.rates.KRW : null;

    // 四捨五入到小數點後 4 位
    if (usdRate) {
      usdRate = Math.round(usdRate * 10000) / 10000;
    }
    if (krwRate) {
      krwRate = Math.round(krwRate * 10000) / 10000;
    }

    if (!usdRate || !krwRate || usdRate <= 0 || krwRate <= 0) {
      console.error("Invalid exchange rates from alternative API:", {
        usdRate,
        krwRate,
      });
      return null;
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    return {
      usdRate,
      krwRate,
      date: dateStr,
      source: "ExchangeRate-API",
    };
  } catch (error) {
    console.error("Error fetching alternative exchange rates:", error);
    return null;
  }
}

/**
 * 主要匯率獲取函數
 * 使用 ExchangeRate-API，失敗時使用預設值
 */
export async function getLatestExchangeRates(): Promise<ExchangeRates | null> {
  // 嘗試使用 ExchangeRate-API
  let result = await fetchAlternativeRates();

  // 如果失敗，使用預設值（台灣銀行最近一次查詢的匯率）
  if (!result) {
    console.warn("All exchange rate APIs failed, using fallback rates");
    const today = new Date();
    const dateStr = today.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    result = {
      usdRate: 31.5, // 預設美元匯率
      krwRate: 0.0215, // 預設韓元匯率
      date: dateStr,
      source: "預設值",
    };
  }

  return result;
}
