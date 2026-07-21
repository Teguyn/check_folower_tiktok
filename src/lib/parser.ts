import JSZip from "jszip";
import type { TikTokUser } from "./db";
import { parseTikTokJson, parseTikTokTxt } from "./parsers/tiktok";
import { parseInstagramJson, parseInstagramRecentFollowRequests } from "./parsers/instagram";

export interface ParsedTikTokData {
  followers: TikTokUser[];
  following: TikTokUser[];
  platform: "tiktok" | "instagram";
  recentFollowRequests?: TikTokUser[];
}

// Re-export specific parser functions just in case they are used elsewhere
export { parseTikTokJson, parseTikTokTxt, parseInstagramJson, parseInstagramRecentFollowRequests };

/**
 * Hàm chính xử lý phân tích tệp kéo thả (ZIP, JSON, TXT) cho cả TikTok và Instagram
 */
export async function parseUploadedFile(file: File): Promise<ParsedTikTokData> {
  const fileName = file.name.toLowerCase();

  // 1. XỬ LÝ FILE ZIP
  if (fileName.endsWith(".zip")) {
    try {
      const zip = await JSZip.loadAsync(file);
      let followers: TikTokUser[] = [];
      let following: TikTokUser[] = [];
      let recentFollowRequests: TikTokUser[] = [];
      let isInstagramZip = false;

      // Kiểm tra xem zip này là của TikTok hay Instagram
      zip.forEach((relativePath) => {
        const path = relativePath.toLowerCase();
        if (path.includes("followers_and_following/") || path.includes("followers_1.json")) {
          isInstagramZip = true;
        }
      });

      const platform = isInstagramZip ? "instagram" : "tiktok";
      const filePromises: Promise<void>[] = [];

      if (platform === "instagram") {
        zip.forEach((relativePath, zipEntry) => {
          const entryName = relativePath.toLowerCase();
          const fileNameOnly = entryName.split("/").pop() || "";
          if (entryName.endsWith(".json")) {
            // followers_1.json, followers_2.json ...
            if (fileNameOnly.includes("follower")) {
              const promise = zipEntry.async("text").then((content) => {
                const parsedList = parseInstagramJson(content);
                followers = followers.concat(parsedList);
              });
              filePromises.push(promise);
            }
            // following.json
            else if (fileNameOnly.includes("following")) {
              const promise = zipEntry.async("text").then((content) => {
                const parsedList = parseInstagramJson(content);
                following = following.concat(parsedList);
              });
              filePromises.push(promise);
            }
            // recent_follow_requests.json
            else if (fileNameOnly.includes("recent_follow_requests")) {
              const promise = zipEntry.async("text").then((content) => {
                const parsedList = parseInstagramRecentFollowRequests(content);
                recentFollowRequests = recentFollowRequests.concat(parsedList);
              });
              filePromises.push(promise);
            }
          }
        });
      } else {
        // TikTok
        zip.forEach((relativePath, zipEntry) => {
          const entryName = relativePath.toLowerCase();
          const fileNameOnly = entryName.split("/").pop() || "";
          const isJson = entryName.endsWith(".json");
          const isTxt = entryName.endsWith(".txt");

          if (isJson || isTxt) {
            const isFollowersFile = fileNameOnly.includes("follower");
            const isFollowingFile = fileNameOnly.includes("following");

            if (isFollowersFile || isFollowingFile) {
              const promise = zipEntry.async("text").then((content) => {
                if (isJson) {
                  const type = isFollowersFile ? "followers" : "following";
                  const result = parseTikTokJson(content, type);
                  if (type === "followers" && result.followers) {
                    followers = result.followers;
                  } else if (type === "following" && result.following) {
                    following = result.following;
                  }
                } else if (isTxt) {
                  const result = parseTikTokTxt(content);
                  if (isFollowersFile && result.followers) {
                    followers = result.followers;
                  } else if (isFollowingFile && result.following) {
                    following = result.following;
                  }
                }
              });
              filePromises.push(promise);
            }
          }
        });
      }

      await Promise.all(filePromises);

      // Nếu không tìm thấy file có từ khóa "follower" / "following" trong zip (dành riêng cho TikTok)
      if (platform === "tiktok" && followers.length === 0 && following.length === 0) {
        const backupPromises: Promise<void>[] = [];
        zip.forEach((relativePath, zipEntry) => {
          if (relativePath.endsWith(".json") && relativePath.includes("Activity/")) {
            const p = zipEntry.async("text").then((content) => {
              const res = parseTikTokJson(content, "detect");
              if (res.followers && res.followers.length > 0) followers = res.followers;
              if (res.following && res.following.length > 0) following = res.following;
            });
            backupPromises.push(p);
          }
        });
        await Promise.all(backupPromises);
      }

      return { followers, following, platform, recentFollowRequests };
    } catch (err) {
      console.error("Lỗi khi giải nén và phân tích ZIP:", err);
      throw new Error("Không thể đọc tệp ZIP. Vui lòng đảm bảo tệp tin ZIP xuất dữ liệu không bị lỗi.");
    }
  }

  // 2. XỬ LÝ FILE JSON LẺ
  if (fileName.endsWith(".json")) {
    const text = await file.text();
    if (fileName.includes("recent_follow_requests")) {
      const parsedList = parseInstagramRecentFollowRequests(text);
      return {
        followers: [],
        following: [],
        recentFollowRequests: parsedList,
        platform: "instagram"
      };
    }
    if (text.includes("string_list_data")) {
      const parsedList = parseInstagramJson(text);
      if (fileName.includes("follower")) {
        return {
          followers: parsedList,
          following: [],
          platform: "instagram"
        };
      } else {
        return {
          followers: [],
          following: parsedList,
          platform: "instagram"
        };
      }
    } else {
      const result = parseTikTokJson(text, "detect");
      return {
        followers: result.followers || [],
        following: result.following || [],
        platform: "tiktok"
      };
    }
  }

  // 3. XỬ LÝ FILE TXT LẺ (chỉ TikTok)
  if (fileName.endsWith(".txt")) {
    const text = await file.text();
    const result = parseTikTokTxt(text);
    return {
      followers: result.followers || [],
      following: result.following || [],
      platform: "tiktok"
    };
  }

  throw new Error("Định dạng tệp không được hỗ trợ. Hãy tải lên tệp ZIP, JSON hoặc TXT.");
}
