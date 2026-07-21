import { useState, useMemo } from "react";
import { Users, UserPlus, UserCheck, Heart, UserMinus, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { FollowerSnapshot } from "@/lib/db";
import { CopyButton } from "./CopyButton";

interface DashboardProps {
  snapshot: FollowerSnapshot;
}

type TabType = "all_followers" | "all_following" | "mutuals" | "fans" | "idols" | "recent_requests";

export function Dashboard({ snapshot }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("mutuals");
  const [searchQuery, setSearchQuery] = useState("");

  const followers = snapshot.followers || [];
  const following = snapshot.following || [];
  const recentRequests = snapshot.recentFollowRequests || [];

  // Tạo Maps để tra cứu nhanh
  const followersMap = useMemo(() => new Map(followers.map(u => [u.username.toLowerCase(), u])), [followers]);
  const followingMap = useMemo(() => new Map(following.map(u => [u.username.toLowerCase(), u])), [following]);

  // Phân loại danh sách
  const mutuals = useMemo(() => {
    return followers.filter(user => followingMap.has(user.username.toLowerCase()));
  }, [followers, followingMap]);

  const fans = useMemo(() => {
    return followers.filter(user => !followingMap.has(user.username.toLowerCase()));
  }, [followers, followingMap]);

  const idols = useMemo(() => {
    return following.filter(user => !followersMap.has(user.username.toLowerCase()));
  }, [following, followersMap]);

  // Dữ liệu hiển thị dựa trên tab
  const currentList = useMemo(() => {
    switch (activeTab) {
      case "all_followers":
        return followers;
      case "all_following":
        return following;
      case "mutuals":
        return mutuals;
      case "fans":
        return fans;
      case "idols":
        return idols;
      case "recent_requests":
        return recentRequests;
      default:
        return [];
    }
  }, [activeTab, followers, following, mutuals, fans, idols, recentRequests]);

  // Lọc theo tìm kiếm
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    return currentList.filter(user =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentList, searchQuery]);

  const stats = [
    {
      title: "Tổng Followers",
      value: followers.length,
      description: "Người đang theo dõi bạn",
      icon: Users,
      color: "text-[#fe2c55] bg-[#fe2c55]/10",
      tab: "all_followers" as TabType,
    },
    {
      title: "Tổng Following",
      value: following.length,
      description: "Người bạn đang theo dõi",
      icon: UserPlus,
      color: "text-[#25f4ee] bg-[#25f4ee]/10",
      tab: "all_following" as TabType,
    },
    {
      title: "Bạn chung (Mutuals)",
      value: mutuals.length,
      description: "Cả hai cùng theo dõi nhau",
      icon: Heart,
      color: "text-red-500 bg-red-500/10",
      tab: "mutuals" as TabType,
    },
    {
      title: "Người hâm mộ (Fans)",
      value: fans.length,
      description: "Follow bạn nhưng bạn chưa follow lại",
      icon: UserCheck,
      color: "text-amber-500 bg-amber-500/10",
      tab: "fans" as TabType,
    },
    {
      title: "Thần tượng (Idols)",
      value: idols.length,
      description: "Bạn follow họ nhưng họ chưa follow lại",
      icon: UserMinus,
      color: "text-purple-500 bg-purple-500/10",
      tab: "idols" as TabType,
    },
  ];

  if (recentRequests.length > 0) {
    stats.push({
      title: "Yêu cầu follow",
      value: recentRequests.length,
      description: "Yêu cầu theo dõi gần đây",
      icon: UserPlus,
      color: "text-blue-500 bg-blue-500/10",
      tab: "recent_requests" as TabType,
    });
  }

  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case "all_followers": return "Người theo dõi";
      case "all_following": return "Đang theo dõi";
      case "mutuals": return "Bạn chung";
      case "fans": return "Người hâm mộ";
      case "idols": return "Thần tượng";
      case "recent_requests": return "Yêu cầu follow";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Bảng điều khiển: <span className="text-[#fe2c55]">{snapshot.label}</span>
        </h2>
        <p className="text-muted-foreground text-sm">
          Cập nhật ngày {new Date(snapshot.timestamp).toLocaleString("vi-VN")} | Có {followers.length} followers và {following.length} followings
        </p>
      </div>

      {/* Grid thẻ thông tin */}
      <div className={`grid gap-4 md:grid-cols-2 ${stats.length > 5 ? "lg:grid-cols-3 xl:grid-cols-6" : "lg:grid-cols-5"}`}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isSelected = activeTab === stat.tab;
          return (
            <Card
              key={stat.title}
              onClick={() => {
                setActiveTab(stat.tab);
                setSearchQuery("");
              }}
              className={`cursor-pointer transition-all duration-300 hover:scale-102 border-2 ${
                isSelected 
                  ? "border-[#fe2c55] shadow-[0_0_15px_rgba(251,43,101,0.15)] bg-card"
                  : "border-transparent hover:border-muted bg-card/60"
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Danh sách người dùng */}
      <Card className="bg-card/50 backdrop-blur-md border-muted/20">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                Danh sách: {getTabLabel(activeTab)}
                <Badge variant="secondary" className="font-normal text-xs ml-1 bg-muted/30">
                  {filteredList.length} / {currentList.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Bảng danh sách tài khoản được phân loại dựa trên bản snapshot hiện tại
              </CardDescription>
            </div>
            
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm username..."
                className="pl-9 bg-muted/10 border-muted/20 text-sm focus-visible:ring-1 focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px]">
            <Table>
              <TableHeader className="bg-muted/10 sticky top-0 backdrop-blur-md">
                <TableRow className="hover:bg-transparent border-muted/20">
                  <TableHead className="w-12 text-center text-xs">#</TableHead>
                  <TableHead className="text-xs">Tên người dùng ({snapshot.platform === "instagram" ? "Instagram Username" : "TikTok Username"})</TableHead>
                  <TableHead className="text-xs">{activeTab === "recent_requests" ? "Thời điểm yêu cầu" : "Thời điểm follow"}</TableHead>
                  <TableHead className="w-24 text-right text-xs pr-6">Sao chép</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-sm">
                      {searchQuery ? "Không tìm thấy kết quả phù hợp" : "Danh sách này hiện tại trống"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredList.map((user, idx) => (
                    <TableRow key={user.username + idx} className="hover:bg-muted/5 border-muted/10">
                      <TableCell className="text-center text-xs font-mono text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        <a
                          href={snapshot.platform === "instagram" ? `https://www.instagram.com/${user.username}` : `https://www.tiktok.com/@${user.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-foreground hover:underline transition-all duration-200 ${
                            snapshot.platform === "instagram" ? "hover:text-[#e1306c]" : "hover:text-[#fe2c55]"
                          }`}
                        >
                          @{user.username}
                        </a>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">
                        {user.date || "Không có thông tin ngày"}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <CopyButton text={user.username} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
