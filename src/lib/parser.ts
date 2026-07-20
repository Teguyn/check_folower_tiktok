import JSZip from "jszip";
import type { TikTokUser } from "./db";

export interface ParsedTikTokData {
  followers: TikTokUser[];
  following: TikTokUser[];
}

/**
 * Hàm phân tích cú pháp chuỗi JSON TikTok
 * Hỗ trợ nhiều dạng cấu trúc JSON khác nhau của TikTok
 */
export function parseTikTokJson(jsonText: string, type: "followers" | "following" | "detect"): {
  followers?: TikTokUser[];
  following?: TikTokUser[];
} {
  try {
    const data = JSON.parse(jsonText);

    // Chuẩn hóa cấu trúc của danh sách người dùng
    const normalizeList = (list: any[]): TikTokUser[] => {
      if (!Array.isArray(list)) return [];
      return list
        .map((item: any) => {
          const username = item.UserName || item.userName || item.username || "";
          const date = item.Date || item.date || item.DateTime || item.dateTime || item.date_time || "";
          return {
            username: username.trim(),
            date: date.trim(),
          };
        })
        .filter((user) => user.username !== "");
    };

    // Tìm kiếm các trường trong JSON
    let followers: TikTokUser[] | undefined;
    let following: TikTokUser[] | undefined;

    // 1. Dạng Followers
    if (type === "followers" || type === "detect") {
      const followersData = data.FollowerList || data.followerList || data.followers || data.Followers;
      if (followersData) {
        if (Array.isArray(followersData)) {
          followers = normalizeList(followersData);
        } else if (followersData.List && Array.isArray(followersData.List)) {
          followers = normalizeList(followersData.List);
        } else if (followersData.list && Array.isArray(followersData.list)) {
          followers = normalizeList(followersData.list);
        }
      }
    }

    // 2. Dạng Following
    if (type === "following" || type === "detect") {
      const followingData = data.FollowingList || data.followingList || data.following || data.Following;
      if (followingData) {
        if (Array.isArray(followingData)) {
          following = normalizeList(followingData);
        } else if (followingData.List && Array.isArray(followingData.List)) {
          following = normalizeList(followingData.List);
        } else if (followingData.list && Array.isArray(followingData.list)) {
          following = normalizeList(followingData.list);
        }
      }
    }

    // 3. Dự phòng tìm kiếm đệ quy nếu không đúng cấu trúc chuẩn
    if (type === "detect" && !followers && !following) {
      // Thử tìm bất cứ mảng nào chứa UserName/Date
      const allLists = findListsRecursive(data);
      if (allLists.length > 0) {
        // Dự đoán dựa trên key của mảng
        const likelyFollowers = allLists.find(l => l.key.toLowerCase().includes("follower"));
        const likelyFollowing = allLists.find(l => l.key.toLowerCase().includes("following"));

        if (likelyFollowers) followers = normalizeList(likelyFollowers.list);
        if (likelyFollowing) following = normalizeList(likelyFollowing.list);

        // Nếu chỉ tìm thấy một danh sách không phân biệt được tên key
        if (!followers && !following && allLists.length > 0) {
          if (jsonText.toLowerCase().includes("follower")) {
            followers = normalizeList(allLists[0].list);
          } else {
            following = normalizeList(allLists[0].list);
          }
        }
      }
    }

    return { followers, following };
  } catch (err) {
    console.error("Lỗi khi parse TikTok JSON:", err);
    return {};
  }
}

/**
 * Tìm các mảng đối tượng có khả năng là danh sách người dùng TikTok
 */
function findListsRecursive(obj: any, keyName = ""): Array<{ key: string; list: any[] }> {
  let results: Array<{ key: string; list: any[] }> = [];

  if (!obj || typeof obj !== "object") return results;

  if (Array.isArray(obj)) {
    // Kiểm tra xem phần tử đầu tiên có dạng người dùng TikTok không
    if (obj.length > 0 && typeof obj[0] === "object") {
      const first = obj[0];
      const hasUser = "UserName" in first || "userName" in first || "username" in first;
      if (hasUser) {
        results.push({ key: keyName, list: obj });
      }
    }
    return results;
  }

  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      results = results.concat(findListsRecursive(obj[k], k));
    }
  }

  return results;
}

/**
 * Phân tích cú pháp tệp TXT của TikTok
 */
export function parseTikTokTxt(txtText: string): { followers?: TikTokUser[]; following?: TikTokUser[] } {
  const followers: TikTokUser[] = [];
  const following: TikTokUser[] = [];

  // Xác định xem đây là file followers hay following
  const isFollowerFile = txtText.toLowerCase().includes("follower");
  const isFollowingFile = txtText.toLowerCase().includes("following");

  // Tách dòng
  const lines = txtText.split(/\r?\n/);
  let currentUsername = "";
  let currentDate = "";

  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;

    // Dạng dòng: "Date: 2026-07-20 21:55:00"
    if (cleanLine.toLowerCase().startsWith("date:")) {
      currentDate = cleanLine.substring(5).trim();
    }
    // Dạng dòng: "Username: username" hoặc "UserName: username"
    else if (cleanLine.toLowerCase().startsWith("username:") || cleanLine.toLowerCase().startsWith("username :")) {
      const idx = cleanLine.indexOf(":");
      currentUsername = cleanLine.substring(idx + 1).trim();

      if (currentUsername) {
        const user = { username: currentUsername, date: currentDate || "Không rõ ngày" };
        if (isFollowerFile) {
          followers.push(user);
        } else if (isFollowingFile) {
          following.push(user);
        } else {
          // Mặc định cho vào followers
          followers.push(user);
        }
        currentUsername = "";
        currentDate = "";
      }
    }
  }

  return {
    followers: followers.length > 0 ? followers : undefined,
    following: following.length > 0 ? following : undefined,
  };
}

/**
 * Hàm chính xử lý phân tích tệp kéo thả (ZIP, JSON, TXT)
 */
export async function parseUploadedFile(file: File): Promise<ParsedTikTokData> {
  const fileName = file.name.toLowerCase();

  // 1. XỬ LÝ FILE ZIP
  if (fileName.endsWith(".zip")) {
    try {
      const zip = await JSZip.loadAsync(file);
      let followers: TikTokUser[] = [];
      let following: TikTokUser[] = [];

      // Duyệt qua tất cả các file trong ZIP
      const filePromises: Promise<void>[] = [];

      zip.forEach((relativePath, zipEntry) => {
        const entryName = relativePath.toLowerCase();

        // Kiểm tra xem file có liên quan tới followers hay following không
        const isJson = entryName.endsWith(".json");
        const isTxt = entryName.endsWith(".txt");

        if (isJson || isTxt) {
          const isFollowersFile = entryName.includes("follower");
          const isFollowingFile = entryName.includes("following");

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

      await Promise.all(filePromises);

      // Nếu không tìm thấy file có từ khóa "follower" / "following" trong zip,
      // thử tìm kiếm các file JSON bất kỳ ở root hoặc trong thư mục Activity
      if (followers.length === 0 && following.length === 0) {
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

      return { followers, following };
    } catch (err) {
      console.error("Lỗi khi giải nén và phân tích ZIP:", err);
      throw new Error("Không thể đọc tệp ZIP. Vui lòng đảm bảo tệp tin ZIP xuất từ TikTok không bị lỗi.");
    }
  }

  // 2. XỬ LÝ FILE JSON LẺ
  if (fileName.endsWith(".json")) {
    const text = await file.text();
    const result = parseTikTokJson(text, "detect");
    return {
      followers: result.followers || [],
      following: result.following || [],
    };
  }

  // 3. XỬ LÝ FILE TXT LẺ
  if (fileName.endsWith(".txt")) {
    const text = await file.text();
    const result = parseTikTokTxt(text);
    return {
      followers: result.followers || [],
      following: result.following || [],
    };
  }

  throw new Error("Định dạng tệp không được hỗ trợ. Hãy tải lên tệp ZIP, JSON hoặc TXT xuất từ TikTok.");
}
