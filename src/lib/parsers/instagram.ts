import type { TikTokUser } from "../db";

/**
 * Hàm phân tích cú pháp chuỗi JSON Instagram
 */
export function parseInstagramJson(jsonText: string): TikTokUser[] {
  try {
    const data = JSON.parse(jsonText);
    let list: any[] = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (data && typeof data === "object") {
      if (Array.isArray(data.relationships_following)) {
        list = data.relationships_following;
      } else {
        for (const key of Object.keys(data)) {
          if (Array.isArray(data[key])) {
            const first = data[key][0];
            if (first && first.string_list_data) {
              list = data[key];
              break;
            }
          }
        }
      }
    }

    return list
      .map((item: any) => {
        const stringListData = item.string_list_data;
        if (Array.isArray(stringListData) && stringListData.length > 0) {
          const username = stringListData[0].value || "";
          const timestamp = stringListData[0].timestamp || 0;
          let date = "";
          if (timestamp) {
            const d = new Date(timestamp * 1000);
            date = d.toLocaleString("vi-VN");
          }
          return {
            username: username.trim(),
            date,
          };
        }
        return null;
      })
      .filter((u): u is TikTokUser => u !== null && u.username !== "");
  } catch (err) {
    console.error("Lỗi khi parse Instagram JSON:", err);
    return [];
  }
}
