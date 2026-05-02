/**
 * 台灣中央銀行匯率 API 服務
 * 提取當日美金 (USD) 及韓幣 (KRW) 對台幣的匯率
 */

export interface ExchangeRates {
  usdRate: number;
  krwRate: number;
  date: string;
  source: string;
}

/**
 * 從台灣中央銀行 API 獲取當日匯率
 * API 來源：https://www.cbc.gov.tw/
 */
export async function fetchCentralBankRates(): Promise<ExchangeRates | null> {
  try {
    // 台灣中央銀行提供的匯率 API
    // 格式：https://www.cbc.gov.tw/tw/cp-137-30585-1E9A9-1.html
    const response = await fetch(
      "https://www.cbc.gov.tw/tw/cp-137-30585-1E9A9-1.html"
    );

    if (!response.ok) {
      console.error("Failed to fetch from CBC API:", response.status);
      return null;
    }

    const html = await response.text();

    // 解析 HTML 以提取匯率資料
    // 中央銀行網頁格式可能會變更，需要根據實際情況調整解析邏輯
    const usdMatch = html.match(/USD[\s\S]*?(\d+\.\d+)/);
    const krwMatch = html.match(/KRW[\s\S]*?(\d+\.\d+)/);

    if (!usdMatch || !krwMatch) {
      console.error("Could not parse exchange rates from CBC HTML");
      return null;
    }

    // 讀取小數點後 4 位
    let usdRate = parseFloat(usdMatch[1]);
    let krwRate = parseFloat(krwMatch[1]);
    
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
      source: "台灣中央銀行",
    };
  } catch (error) {
    console.error("Error fetching exchange rates from CBC:", error);
    return null;
  }
}

/**
 * 備用方案：使用 OpenExchangeRates 或其他公開 API
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
 * 優先使用中央銀行 API，失敗時使用備用方案
 */
export async function getLatestExchangeRates(): Promise<ExchangeRates | null> {
  // 優先嘗試中央銀行 API
  let result = await fetchCentralBankRates();

  // 如果失敗，使用備用 API
  if (!result) {
    console.log("CBC API failed, trying alternative API...");
    result = await fetchAlternativeRates();
  }

  if (!result) {
    console.warn("All exchange rate APIs failed");
  }

  return result;
}
