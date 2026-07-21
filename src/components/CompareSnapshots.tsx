import { useState, useMemo } from "react";
import { ArrowLeftRight, TrendingUp, UserMinus, UserPlus, Search, Copy, Check, Calendar, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { FollowerSnapshot } from "@/lib/db";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Không thể sao chép:", err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={`rounded-md transition-all duration-200 ${
        copied 
          ? "text-green-500 hover:text-green-600 hover:bg-green-500/10" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
      onClick={handleCopy}
      title="Sao chép tên người dùng"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

interface CompareSnapshotsProps {
  snapshots: FollowerSnapshot[];
}

type DiffType = "unfollowers" | "new_followers" | "lost_following" | "new_following";

export function CompareSnapshots({ snapshots }: CompareSnapshotsProps) {
  const [baseId, setBaseId] = useState<string>("");
  const [targetId, setTargetId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<DiffType>("unfollowers");
  const [searchQuery, setSearchQuery] = useState("");

  // Tìm nạp thông tin chi tiết của snapshot được chọn
  const baseSnapshot = useMemo(() => snapshots.find(s => s.id === baseId), [snapshots, baseId]);
  const targetSnapshot = useMemo(() => snapshots.find(s => s.id === targetId), [snapshots, targetId]);

  // Phân tích sự thay đổi giữa hai snapshot
  const diffData = useMemo(() => {
    if (!baseSnapshot || !targetSnapshot) {
      return {
        unfollowers: [],
        newFollowers: [],
        lostFollowing: [],
        newFollowing: []
      };
    }

    const baseFollowers = baseSnapshot.followers || [];
    const targetFollowers = targetSnapshot.followers || [];
    const baseFollowing = baseSnapshot.following || [];
    const targetFollowing = targetSnapshot.following || [];

    // Tạo Sets để kiểm tra nhanh
    const baseFollowersSet = new Set(baseFollowers.map(u => u.username.toLowerCase()));
    const targetFollowersSet = new Set(targetFollowers.map(u => u.username.toLowerCase()));
    const baseFollowingSet = new Set(baseFollowing.map(u => u.username.toLowerCase()));
    const targetFollowingSet = new Set(targetFollowing.map(u => u.username.toLowerCase()));

    // 1. Unfollowers: Có trong A nhưng không còn trong B
    const unfollowers = baseFollowers.filter(
      u => !targetFollowersSet.has(u.username.toLowerCase())
    );

    // 2. New Followers: Có trong B nhưng chưa có trong A
    const newFollowers = targetFollowers.filter(
      u => !baseFollowersSet.has(u.username.toLowerCase())
    );

    // 3. Lost Following (Bạn hủy follow họ): Bạn follow ở A nhưng không còn ở B
    const lostFollowing = baseFollowing.filter(
      u => !targetFollowingSet.has(u.username.toLowerCase())
    );

    // 4. New Following (Bạn mới follow): Bạn mới follow ở B
    const newFollowing = targetFollowing.filter(
      u => !baseFollowingSet.has(u.username.toLowerCase())
    );

    return {
      unfollowers,
      newFollowers,
      lostFollowing,
      newFollowing
    };
  }, [baseSnapshot, targetSnapshot]);

  // Bộ lọc tìm kiếm
  const currentList = useMemo(() => {
    switch (activeTab) {
      case "unfollowers":
        return diffData.unfollowers;
      case "new_followers":
        return diffData.newFollowers;
      case "lost_following":
        return diffData.lostFollowing;
      case "new_following":
        return diffData.newFollowing;
      default:
        return [];
    }
  }, [activeTab, diffData]);

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    return currentList.filter(user =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentList, searchQuery]);

  // Tự động gán giá trị mặc định cho Select nếu có từ 2 snapshots
  useMemo(() => {
    if (snapshots.length >= 2) {
      // Sắp xếp theo thứ tự thời gian: snapshots[0] là mới nhất, snapshots[1] là cũ thứ 2
      // Do đó Mốc cũ (Base) nên là snapshots[1], Mốc mới (Target) nên là snapshots[0]
      if (!baseId) setBaseId(snapshots[1].id);
      if (!targetId) setTargetId(snapshots[0].id);
    }
  }, [snapshots, baseId, targetId]);

  if (snapshots.length < 2) {
    return (
      <Card className="bg-card/50 backdrop-blur-md border-muted/20 my-6 animate-in fade-in">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <ArrowLeftRight className="h-16 w-16 text-muted-foreground/40 mb-4 animate-bounce" />
          <CardTitle className="text-xl font-bold text-foreground">Cần ít nhất 2 bản ghi lịch sử</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-2 max-w-md">
            Hiện tại bạn chỉ có {snapshots.length} bản ghi (snapshot) được lưu. Vui lòng tải thêm một file xuất dữ liệu TikTok của mốc thời gian khác để thực hiện so sánh đối chiếu.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      type: "unfollowers" as DiffType,
      title: "Ai hủy follow bạn?",
      value: diffData.unfollowers.length,
      description: "Có trong mốc cũ nhưng đã biến mất ở mốc mới",
      icon: UserMinus,
      color: "text-[#fe2c55] bg-[#fe2c55]/10 border-[#fe2c55]/30",
    },
    {
      type: "new_followers" as DiffType,
      title: "Follower mới",
      value: diffData.newFollowers.length,
      description: "Mới xuất hiện trong mốc mới",
      icon: UserPlus,
      color: "text-green-500 bg-green-500/10 border-green-500/30",
    },
    {
      type: "lost_following" as DiffType,
      title: "Bạn đã hủy follow",
      value: diffData.lostFollowing.length,
      description: "Người mà bạn đã bỏ theo dõi",
      icon: UserMinus,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
    },
    {
      type: "new_following" as DiffType,
      title: "Bạn đã follow mới",
      value: diffData.newFollowing.length,
      description: "Những người bạn mới theo dõi gần đây",
      icon: UserPlus,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/30",
    },
  ];

  const getTabLabel = (type: DiffType) => {
    switch (type) {
      case "unfollowers": return "Người đã hủy follow bạn";
      case "new_followers": return "Người mới follow bạn";
      case "lost_following": return "Người bạn bỏ follow";
      case "new_following": return "Người bạn mới follow";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ArrowLeftRight className="h-6 w-6 text-primary" />
          So sánh đối chiếu dữ liệu
        </h2>
        <p className="text-muted-foreground text-sm">
          Chọn 2 mốc thời gian khác nhau để so sánh sự thay đổi của danh sách Follower/Following.
        </p>
      </div>

      {/* Selector chọn Snapshot */}
      <Card className="bg-card/50 backdrop-blur-md border-muted/20">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            {/* Snapshot Cũ (A) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar className="h-3.5 w-3.5" />
                Mốc dữ liệu CŨ (Snapshot A)
              </label>
              <Select value={baseId} onValueChange={(val) => { setBaseId(val); setSearchQuery(""); }}>
                <SelectTrigger className="bg-muted/10 border-muted/20 w-full text-sm">
                  <SelectValue placeholder="Chọn bản ghi cũ" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-muted/20">
                  {snapshots.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-sm">
                      {s.label} ({new Date(s.timestamp).toLocaleDateString("vi-VN")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {baseSnapshot && (
                <p className="text-[10px] text-muted-foreground px-1">
                  Followers: {baseSnapshot.followers.length} | Following: {baseSnapshot.following.length}
                </p>
              )}
            </div>

            {/* Snapshot Mới (B) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#fe2c55] flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar className="h-3.5 w-3.5" />
                Mốc dữ liệu MỚI (Snapshot B)
              </label>
              <Select value={targetId} onValueChange={(val) => { setTargetId(val); setSearchQuery(""); }}>
                <SelectTrigger className="bg-muted/10 border-muted/20 w-full text-sm">
                  <SelectValue placeholder="Chọn bản ghi mới" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-muted/20">
                  {snapshots.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-sm">
                      {s.label} ({new Date(s.timestamp).toLocaleDateString("vi-VN")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {targetSnapshot && (
                <p className="text-[10px] text-muted-foreground px-1">
                  Followers: {targetSnapshot.followers.length} | Following: {targetSnapshot.following.length}
                </p>
              )}
            </div>
          </div>

          {baseId === targetId && baseId !== "" && (
            <Alert className="mt-4 border-amber-500/20 bg-amber-500/5 text-amber-500">
              <HelpCircle className="h-4 w-4" />
              <AlertTitle>Mẹo sử dụng</AlertTitle>
              <AlertDescription className="text-xs">
                Bạn đang so sánh cùng một bản ghi dữ liệu. Vui lòng chọn hai mốc thời gian khác nhau để ứng dụng hiển thị các thông số thay đổi.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {baseSnapshot && targetSnapshot && baseId !== targetId && (
        <>
          {/* Thẻ Thống Kê Sự Thay Đổi */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              const isSelected = activeTab === card.type;
              return (
                <Card
                  key={card.title}
                  onClick={() => {
                    setActiveTab(card.type);
                    setSearchQuery("");
                  }}
                  className={`cursor-pointer transition-all duration-300 hover:scale-102 border-2 ${
                    isSelected 
                      ? "border-primary bg-card/90 shadow-[0_0_15px_rgba(251,43,101,0.15)]"
                      : "border-transparent bg-card/40 hover:border-muted"
                  }`}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-xs font-semibold text-muted-foreground">{card.title}</CardTitle>
                    <div className={`p-2 rounded-lg ${card.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold flex items-baseline gap-1">
                      {card.value}
                      {card.value > 0 && (
                        <span className="text-xs font-medium">
                          {card.type === "unfollowers" || card.type === "lost_following" ? (
                            <span className="text-[#fe2c55] flex items-center font-semibold">↓</span>
                          ) : (
                            <span className="text-green-500 flex items-center font-semibold">↑</span>
                          )}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Bảng Danh Sách Phân Tích */}
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
                  <CardDescription className="text-xs text-muted-foreground">
                    So sánh sự thay đổi từ {baseSnapshot.label} sang {targetSnapshot.label}
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
                      <TableHead className="text-xs">Tên tài khoản (TikTok Username)</TableHead>
                      <TableHead className="text-xs">
                        {activeTab === "unfollowers" || activeTab === "lost_following" ? "Ngày lưu trữ (Mốc cũ)" : "Ngày lưu trữ (Mốc mới)"}
                      </TableHead>
                      <TableHead className="w-24 text-right text-xs pr-6">Sao chép</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-36 text-center text-muted-foreground text-sm">
                          {searchQuery ? (
                            "Không tìm thấy kết quả phù hợp"
                          ) : (
                            <div className="flex flex-col items-center justify-center space-y-2 p-6">
                              {activeTab === "unfollowers" ? (
                                <>
                                  <TrendingUp className="h-8 w-8 text-green-500 animate-pulse" />
                                  <p className="font-semibold text-foreground">Tuyệt vời! Không ai hủy follow bạn</p>
                                  <p className="text-xs max-w-sm text-muted-foreground leading-relaxed">
                                    Không có tài khoản nào rời khỏi danh sách follower của bạn giữa hai mốc thời gian này.
                                  </p>
                                </>
                              ) : (
                                "Không phát hiện thay đổi nào trong mục này."
                              )}
                            </div>
                          )}
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
                              href={`https://www.tiktok.com/@${user.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-foreground hover:text-[#fe2c55] hover:underline transition-all duration-200"
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
        </>
      )}
    </div>
  );
}
