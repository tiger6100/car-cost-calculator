/**
 * 台灣銀行匯率 API 服務
 * 提取當日韓幣 (KRW) 兌台幣 (TWD) 的匯率
 */

export interface ExchangeRateData {
  rate: number;
  date: string;
  source: string;
  lastUpdated: string;
}

/**
 * 從台灣銀行 API 獲取當日韓幣匯率
 * API 文件：https://www.bot.com.tw/
 */
export async function fetchTaiwanBankExchangeRate(): Promise<ExchangeRateData | null> {
  try {
    // 台灣銀行提供的匯率 API
    // 使用公開的匯率查詢 API
    const response = await fetch(
      "https://www.bot.com.tw/xrt/flcsv/0?q=KRW"
    );

    if (!response.ok) {
      console.error("Failed to fetch from Taiwan Bank API:", response.status);
      return null;
    }

    const text = await response.text();
    
    // 解析 CSV 格式的回應
    // 格式: 幣別,現金買入,現金賣出,即期買入,即期賣出
    const lines = text.trim().split("\n");
    
    if (lines.length < 2) {
      console.error("Invalid response format from Taiwan Bank API");
      return null;
    }

    // 跳過標題行，取第一筆資料
    const dataLine = lines[1];
    const fields = dataLine.split(",");

    if (fields.length < 5) {
      console.error("Invalid data format - expected at least 5 fields, got:", fields.length);
      return null;
    }

    // 使用即期賣出匯率（通常是進口用匯率）
    // fields[0]: 幣別 (KRW)
    // fields[1]: 現金買入
    // fields[2]: 現金賣出
    // fields[3]: 即期買入
    // fields[4]: 即期賣出
    const rateStr = fields[4]?.trim();
    
    if (!rateStr) {
      console.error("Empty rate value at field 4");
      return null;
    }

    const rate = parseFloat(rateStr);

    if (isNaN(rate) || rate <= 0) {
      console.error("Invalid rate value:", rateStr, "parsed as:", rate);
      return null;
    }

    // 台灣銀行的匯率是以 1 KRW = X TWD 的格式
    // 一般參考：1 KRW ≈ 0.023-0.027 TWD

    const today = new Date();
    const dateStr = today.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    return {
      rate: rate,
      date: dateStr,
      source: "台灣銀行",
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching exchange rate from Taiwan Bank:", error);
    return null;
  }
}

/**
 * 備用方案：使用 ExchangeRate-API 或其他公開 API
 * 此方案不需要 API 金鑰
 */
export async function fetchAlternativeExchangeRate(): Promise<ExchangeRateData | null> {
  try {
    // 使用 exchangerate-api.com 的免費 API
    // 限制：每月 1500 次請求
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/KRW"
    );

    if (!response.ok) {
      console.error("Failed to fetch from alternative API:", response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data || typeof data !== "object") {
      console.error("Invalid JSON response from alternative API");
      return null;
    }

    const rate = data.rates?.TWD;

    if (!rate || typeof rate !== "number" || rate <= 0) {
      console.error("No valid TWD rate found in response:", rate);
      return null;
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    return {
      rate: rate,
      date: dateStr,
      source: "ExchangeRate-API",
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching alternative exchange rate:", error);
    return null;
  }
}

/**
 * 主要匯率獲取函數
 * 優先使用台灣銀行 API，失敗時使用備用方案
 */
export async function getLatestExchangeRate(): Promise<ExchangeRateData | null> {
  // 優先嘗試台灣銀行 API
  let result = await fetchTaiwanBankExchangeRate();
  
  // 如果失敗，使用備用 API
  if (!result) {
    console.log("Taiwan Bank API failed, trying alternative API...");
    result = await fetchAlternativeExchangeRate();
  }

  if (!result) {
    console.warn("All exchange rate APIs failed, using default rate");
  }

  return result;
}
