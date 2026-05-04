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
 * 從台灣銀行獲取當日賣出匯率
 * API 來源：台灣銀行公開 API
 */
export async function fetchCentralBankRates(): Promise<ExchangeRates | null> {
  try {
    // 使用台灣銀行的匯率查詢 API
    const response = await fetch(
      "https://rate.bot.com.tw/xrt/quote/history/USD/2026-05-04"
    );

    if (!response.ok) {
      console.error("Failed to fetch from Bank of Taiwan API:", response.status);
      return null;
    }

    const data = await response.json();

    if (!data || typeof data !== "object") {
      console.error("Invalid JSON response from Bank of Taiwan API");
      return null;
    }

    // 台灣銀行 API 返回的格式：{ result: true, data: { USD: { sell: "32.123" } } }
    let usdRate: number | null = null;
    let krwRate: number | null = null;

    if (data.data && typeof data.data === "object") {
      if (data.data.USD && data.data.USD.sell) {
        usdRate = parseFloat(data.data.USD.sell);
      }
      if (data.data.KRW && data.data.KRW.sell) {
        krwRate = parseFloat(data.data.KRW.sell);
      }
    }

    if (!usdRate || !krwRate) {
      console.warn("Could not parse exchange rates from Bank of Taiwan API, falling back to alternative API");
      return null;
    }

    // 四捨五入到小數點後 4 位
    usdRate = Math.round(usdRate * 10000) / 10000;
    krwRate = Math.round(krwRate * 10000) / 10000;

    if (isNaN(usdRate) || isNaN(krwRate) || usdRate <= 0 || krwRate <= 0) {
      console.error("Invalid exchange rates:", { usdRate, krwRate });
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
      source: "台灣銀行",
    };
  } catch (error) {
    console.error("Error fetching exchange rates from Bank of Taiwan:", error);
    return null;
  }
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
 * 優先使用台灣銀行 API，失敗時使用備用方案
 */
export async function getLatestExchangeRates(): Promise<ExchangeRates | null> {
  // 優先嘗試台灣銀行 API
  let result = await fetchCentralBankRates();

  // 如果失敗，使用備用 API
  if (!result) {
    console.log("Bank of Taiwan API failed, trying alternative API...");
    result = await fetchAlternativeRates();
  }

  if (!result) {
    console.warn("All exchange rate APIs failed");
  }

  return result;
}
