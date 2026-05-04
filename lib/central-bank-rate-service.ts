/**
 * 台灣合庫金庫匯率 API 服務
 * 提取當日美金 (USD) 及韓幣 (KRW) 對台幣的賣出匯率
 */

export interface ExchangeRates {
  usdRate: number;
  krwRate: number;
  date: string;
  source: string;
}

/**
 * 從台灣合庫金庫獲取當日賣出匯率
 * API 來源：https://www.tcbank.com.tw/
 */
export async function fetchCentralBankRates(): Promise<ExchangeRates | null> {
  try {
    // 使用合庫金庫的匯率查詢 API
    const response = await fetch(
      "https://www.tcbank.com.tw/api/exchange/rates"
    );

    if (!response.ok) {
      console.error("Failed to fetch from Cooperative Bank API:", response.status);
      return null;
    }

    const data = await response.json();

    if (!data || typeof data !== "object") {
      console.error("Invalid JSON response from Cooperative Bank API");
      return null;
    }

    let usdRate: number | null = null;
    let krwRate: number | null = null;

    // 尋找 USD 和 KRW 的賣出匯率
    if (Array.isArray(data.rates)) {
      for (const rate of data.rates) {
        if (rate.currency === "USD" && rate.type === "sell") {
          usdRate = parseFloat(rate.rate);
        } else if (rate.currency === "KRW" && rate.type === "sell") {
          krwRate = parseFloat(rate.rate);
        }
      }
    } else if (typeof data === "object") {
      // 嘗試直接訪問屬性
      if (data.USD && data.USD.sell) {
        usdRate = parseFloat(data.USD.sell);
      }
      if (data.KRW && data.KRW.sell) {
        krwRate = parseFloat(data.KRW.sell);
      }
    }

    if (!usdRate || !krwRate) {
      console.warn("Could not parse exchange rates from Cooperative Bank API, falling back to alternative API");
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
      source: "合庫金庫",
    };
  } catch (error) {
    console.error("Error fetching exchange rates from Cooperative Bank:", error);
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
 * 優先使用合庫金庫 API，失敗時使用備用方案
 */
export async function getLatestExchangeRates(): Promise<ExchangeRates | null> {
  // 優先嘗試合庫金庫 API
  let result = await fetchCentralBankRates();

  // 如果失敗，使用備用 API
  if (!result) {
    console.log("Cooperative Bank API failed, trying alternative API...");
    result = await fetchAlternativeRates();
  }

  if (!result) {
    console.warn("All exchange rate APIs failed");
  }

  return result;
}
