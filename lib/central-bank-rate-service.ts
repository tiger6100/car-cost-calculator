/**
 * 合作金庫銀行匯率 API 服務
 * 提取當日美金 (USD) 及韓幣 (KRW) 對台幣的賣出匯率
 */

export interface ExchangeRates {
  usdRate: number;
  krwRate: number;
  date: string;
  source: string;
}

/**
 * 合作金庫銀行 API - 賣出匯率
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
      source: "合作金庫銀行賣出匯率",
    };
  } catch (error) {
    console.error("Error fetching Cooperative Bank exchange rates:", error);
    return null;
  }
}

/**
 * 主要匯率獲取函數
 * 使用合作金庫銀行賣出匯率，失敗時使用預設值
 */
export async function getLatestExchangeRates(): Promise<ExchangeRates | null> {
  // 嘗試使用合作金庫銀行 API
  let result = await fetchCooperativeRates();

  // 如果都失敗，使用預設值
  if (!result) {
    console.warn("Cooperative Bank API failed, using fallback rates");
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
