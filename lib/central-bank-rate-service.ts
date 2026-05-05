/**
 * 台灣匯率 API 服務
 * 提取當日美金 (USD) 及韓幣 (KRW) 對台幣的賣出匯率
 * 主要來源：合作金庫銀行
 */

export interface ExchangeRates {
  usdRate: number;
  krwRate: number;
  date: string;
  source: string;
}

/**
 * 合作金庫銀行 API
 * 獲取當日美金及韓幣的賣出匯率
 */
export async function fetchCooperativeRates(): Promise<ExchangeRates | null> {
  try {
    // 合作金庫銀行匯率 API
    const response = await fetch(
      "https://rate.bot.com.tw/xrt?Lang=zh-TW"
    );

    if (!response.ok) {
      console.error("Failed to fetch from Cooperative Bank API:", response.status);
      return null;
    }

    const html = await response.text();

    // 使用正則表達式提取美元匯率（賣出）
    const usdMatch = html.match(/美元[\s\S]*?<td[^>]*>(\d+\.\d+)<\/td>/);
    const krwMatch = html.match(/韓元[\s\S]*?<td[^>]*>(\d+\.\d+)<\/td>/);

    if (!usdMatch || !krwMatch) {
      console.error("Could not parse exchange rates from Cooperative Bank HTML");
      return null;
    }

    let usdRate = parseFloat(usdMatch[1]);
    let krwRate = parseFloat(krwMatch[1]);

    // 四捨五入到小數點後 4 位
    usdRate = Math.round(usdRate * 10000) / 10000;
    krwRate = Math.round(krwRate * 10000) / 10000;

    if (usdRate <= 0 || krwRate <= 0) {
      console.error("Invalid exchange rates from Cooperative Bank:", {
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
      source: "合作金庫銀行",
    };
  } catch (error) {
    console.error("Error fetching Cooperative Bank exchange rates:", error);
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
 * 優先使用合作金庫銀行，失敗時使用 ExchangeRate-API，再失敗則使用預設值
 */
export async function getLatestExchangeRates(): Promise<ExchangeRates | null> {
  // 嘗試使用合作金庫銀行 API
  let result = await fetchCooperativeRates();

  // 如果合作金庫失敗，嘗試使用 ExchangeRate-API
  if (!result) {
    console.warn("Cooperative Bank API failed, trying alternative API");
    result = await fetchAlternativeRates();
  }

  // 如果都失敗，使用預設值
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
