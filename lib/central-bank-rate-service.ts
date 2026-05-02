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
 * 從台灣中央銀行 JSON API 獲取當日匯率
 * API 來源：https://www.cbc.gov.tw/
 */
export async function fetchCentralBankRates(): Promise<ExchangeRates | null> {
  try {
    // 使用中央銀行的 JSON API 端點
    const response = await fetch(
      "https://www.cbc.gov.tw/tw/cp-137-30585-1E9A9-1.html"
    );

    if (!response.ok) {
      console.error("Failed to fetch from CBC API:", response.status);
      return null;
    }

    const html = await response.text();

    // 改進的 HTML 解析邏輯
    // 尋找 USD 和 KRW 的匯率資料
    // 中央銀行網頁通常包含 "美元" 和 "韓元" 等關鍵字
    
    // 嘗試多種正則表達式模式
    let usdRate: number | null = null;
    let krwRate: number | null = null;

    // 模式 1: 尋找 "USD" 後面的數字
    const usdMatch1 = html.match(/USD[:\s]+(\d+\.\d{2,4})/i);
    if (usdMatch1) {
      usdRate = parseFloat(usdMatch1[1]);
    }

    // 模式 2: 尋找 "美元" 後面的數字
    if (!usdRate) {
      const usdMatch2 = html.match(/美元[:\s]+(\d+\.\d{2,4})/);
      if (usdMatch2) {
        usdRate = parseFloat(usdMatch2[1]);
      }
    }

    // 模式 3: 尋找 "KRW" 後面的數字
    const krwMatch1 = html.match(/KRW[:\s]+(\d+\.\d{2,4})/i);
    if (krwMatch1) {
      krwRate = parseFloat(krwMatch1[1]);
    }

    // 模式 4: 尋找 "韓元" 後面的數字
    if (!krwRate) {
      const krwMatch2 = html.match(/韓元[:\s]+(\d+\.\d{2,4})/);
      if (krwMatch2) {
        krwRate = parseFloat(krwMatch2[1]);
      }
    }

    if (!usdRate || !krwRate) {
      console.warn("Could not parse exchange rates from CBC HTML, falling back to alternative API");
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
      source: "台灣中央銀行",
    };
  } catch (error) {
    console.error("Error fetching exchange rates from CBC:", error);
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
