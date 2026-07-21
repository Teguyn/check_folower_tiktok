import { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  ArrowLeftRight, 
  History, 
  BookOpen, 
  Plus, 
  ShieldAlert, 
  Layers,
  Heart
} from "lucide-react";
import { dbInstance } from "@/lib/db";
import type { FollowerSnapshot } from "@/lib/db";
import { parseUploadedFile } from "@/lib/parser";
import type { ParsedTikTokData } from "@/lib/parser";
import { DropZone } from "@/components/DropZone";
import { Dashboard } from "@/components/Dashboard";
import { CompareSnapshots } from "@/components/CompareSnapshots";
import { SnapshotManager } from "@/components/SnapshotManager";
import { Guide } from "@/components/Guide";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PageType = "dashboard" | "compare" | "snapshots" | "guide";

function App() {
  const [snapshots, setSnapshots] = useState<FollowerSnapshot[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<"tiktok" | "instagram">("tiktok");
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<PageType>("dashboard");
  const [loading, setLoading] = useState(true);

  // State cho Modal lưu snapshot mới
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingData, setPendingData] = useState<ParsedTikTokData | null>(null);
  const [newSnapshotLabel, setNewSnapshotLabel] = useState("");

  const filteredSnapshots = useMemo(() => {
    return snapshots.filter((s: FollowerSnapshot) => s.platform === selectedPlatform);
  }, [snapshots, selectedPlatform]);

  // Đồng bộ activeSnapshotId khi chuyển nền tảng hoặc danh sách snapshot thay đổi
  useEffect(() => {
    if (filteredSnapshots.length > 0) {
      const exists = filteredSnapshots.some((s: FollowerSnapshot) => s.id === activeSnapshotId);
      if (!exists) {
        setActiveSnapshotId(filteredSnapshots[0].id);
      }
    } else {
      setActiveSnapshotId(null);
    }
  }, [selectedPlatform, filteredSnapshots, activeSnapshotId]);

  // Kích hoạt Dark Mode mặc định
  useEffect(() => {
    document.documentElement.classList.add("dark");
    loadSnapshots();
  }, []);

  // Tải danh sách các snapshot từ IndexedDB
  const loadSnapshots = async () => {
    setLoading(true);
    try {
      await dbInstance.init();
      const list = await dbInstance.getSnapshots();
      setSnapshots(list);
      
      // Nếu có snapshot, tự chọn platform và snapshot đầu tiên làm mặc định
      if (list.length > 0) {
        setSelectedPlatform(list[0].platform || "tiktok");
        setActiveSnapshotId(list[0].id);
      }
    } catch (err) {
      console.error("Lỗi khi kết nối cơ sở dữ liệu IndexedDB:", err);
    } finally {
      setLoading(false);
    }
  };

  // Nhận dữ liệu sau khi kéo thả file thành công
  const handleDataParsed = (data: ParsedTikTokData, _fileName: string) => {
    setPendingData(data);
    
    // Gợi ý tên nhãn dựa trên ngày hiện tại và tên file
    const dateStr = new Date().toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
    const platformName = data.platform === "instagram" ? "Instagram" : "TikTok";
    setNewSnapshotLabel(`Xuất dữ liệu ${platformName} ${dateStr}`);
    setShowSaveDialog(true);
  };

  // Lưu snapshot vào CSDL
  const handleSaveSnapshot = async () => {
    if (!pendingData || !newSnapshotLabel.trim()) return;

    try {
      const saved = await dbInstance.saveSnapshot(
        newSnapshotLabel.trim(),
        pendingData.followers,
        pendingData.following,
        pendingData.platform
      );
      
      // Cập nhật state
      const updatedSnapshots = [saved, ...snapshots];
      setSnapshots(updatedSnapshots);
      setSelectedPlatform(saved.platform);
      setActiveSnapshotId(saved.id);
      
      // Đóng modal và chuyển sang Dashboard
      setShowSaveDialog(false);
      setPendingData(null);
      setActivePage("dashboard");
    } catch (err) {
      alert("Đã xảy ra lỗi khi lưu bản ghi vào trình duyệt.");
      console.error(err);
    }
  };

  // Xóa snapshot
  const handleDeleteSnapshot = async (id: string) => {
    try {
      await dbInstance.deleteSnapshot(id);
      const updated = snapshots.filter(s => s.id !== id);
      setSnapshots(updated);
      
      if (activeSnapshotId === id) {
        setActiveSnapshotId(updated.length > 0 ? updated[0].id : null);
      }
    } catch (err) {
      console.error("Lỗi khi xóa bản ghi:", err);
    }
  };

  // Đổi tên nhãn snapshot
  const handleRenameSnapshot = async (id: string, newLabel: string) => {
    try {
      const target = snapshots.find(s => s.id === id);
      if (!target) return;

      // Trong IndexedDB, ta cập nhật bằng cách lưu đè bản ghi mới trùng ID
      await dbInstance.deleteSnapshot(id);
      
      const db = await dbInstance.init();
      const transaction = db.transaction("snapshots", "readwrite");
      const store = transaction.objectStore("snapshots");
      const updatedSnapshot = { ...target, label: newLabel };
      
      await new Promise<void>((resolve, reject) => {
        const req = store.add(updatedSnapshot);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // Cập nhật state cục bộ
      setSnapshots(prev => 
        prev.map(s => s.id === id ? { ...s, label: newLabel } : s)
      );
    } catch (err) {
      console.error("Lỗi khi cập nhật tên nhãn:", err);
    }
  };

  const activeSnapshot = filteredSnapshots.find((s: FollowerSnapshot) => s.id === activeSnapshotId) || null;

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] font-sans antialiased selection:bg-primary/30">
      {/* Background Decor */}
      <div className={`absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b transition-all duration-500 pointer-events-none ${
        selectedPlatform === "tiktok" ? "from-[#fe2c55]/5" : "from-[#fd1d1d]/5"
      } to-transparent`} />
      <div className={`absolute top-1/4 right-1/4 w-[350px] h-[350px] rounded-full blur-[100px] transition-all duration-500 pointer-events-none ${
        selectedPlatform === "tiktok" ? "bg-[#25f4ee]/3" : "bg-[#fcb045]/2"
      }`} />
      <div className={`absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full blur-[80px] transition-all duration-500 pointer-events-none ${
        selectedPlatform === "tiktok" ? "bg-[#fe2c55]/3" : "bg-[#833ab4]/3"
      }`} />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#27272a]/40 bg-[#09090b]/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-8 py-3 md:py-0 min-h-[4rem] flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`flex items-center justify-center p-2 rounded-xl text-white transition-all duration-500 bg-gradient-to-tr ${
              selectedPlatform === "tiktok" ? "from-[#fe2c55] to-[#25f4ee]" : "from-[#833ab4] via-[#fd1d1d] to-[#fcb045]"
            }`}>
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-[#a1a1aa] bg-clip-text text-transparent">
                Social Follower
              </span>
              <span className={`font-extrabold text-lg tracking-tight ml-1 transition-all duration-500 ${
                selectedPlatform === "tiktok" ? "text-[#fe2c55]" : "text-[#fd1d1d]"
              }`}>
                Tracker
              </span>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center gap-1 w-full md:w-auto overflow-x-auto scrollbar-none py-1.5 px-1 justify-center md:justify-end flex-nowrap shrink-0">
            <Button
              variant={activePage === "dashboard" ? "default" : "ghost"}
              onClick={() => setActivePage("dashboard")}
              className="text-xs md:text-sm font-medium"
            >
              <Layers className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Bảng điều khiển
            </Button>
            <Button
              variant={activePage === "compare" ? "default" : "ghost"}
              onClick={() => setActivePage("compare")}
              className="text-xs md:text-sm font-medium"
            >
              <ArrowLeftRight className="h-4 w-4 mr-1.5 hidden sm:inline" />
              So sánh
            </Button>
            <Button
              variant={activePage === "snapshots" ? "default" : "ghost"}
              onClick={() => setActivePage("snapshots")}
              className="text-xs md:text-sm font-medium"
            >
              <History className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Lịch sử
            </Button>
            <Button
              variant={activePage === "guide" ? "default" : "ghost"}
              onClick={() => setActivePage("guide")}
              className="text-xs md:text-sm font-medium"
            >
              <BookOpen className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Hướng dẫn
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-8 py-8 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">Đang khởi tạo cơ sở dữ liệu trình duyệt...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Thanh chuyển đổi Platform */}
            <div className="flex justify-center md:justify-start">
              <div className="flex items-center bg-[#18181b]/60 border border-muted/10 p-1 rounded-xl backdrop-blur-md">
                <button
                  onClick={() => setSelectedPlatform("tiktok")}
                  className={`text-xs md:text-sm font-semibold rounded-lg transition-all px-4 py-2 flex items-center gap-1.5 cursor-pointer ${
                    selectedPlatform === "tiktok"
                      ? "bg-gradient-to-r from-[#fe2c55] to-[#fd1d1d] text-white shadow-[0_2px_10px_rgba(254,44,85,0.2)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full transition-colors ${selectedPlatform === "tiktok" ? "bg-[#25f4ee]" : "bg-muted-foreground"}`} />
                  TikTok
                </button>
                <button
                  onClick={() => setSelectedPlatform("instagram")}
                  className={`text-xs md:text-sm font-semibold rounded-lg transition-all px-4 py-2 flex items-center gap-1.5 cursor-pointer ${
                    selectedPlatform === "instagram"
                      ? "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white shadow-[0_2px_10px_rgba(253,29,29,0.2)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full transition-colors ${selectedPlatform === "instagram" ? "bg-white" : "bg-muted-foreground"}`} />
                  Instagram
                </button>
              </div>
            </div>

            {/* Khu vực Drag & Drop nhỏ thu gọn ở trên cùng để thêm tệp mới (Chỉ hiện khi đã có dữ liệu) */}
            {filteredSnapshots.length > 0 && (
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/20 border border-muted/10 p-4 rounded-2xl backdrop-blur-md">
                <div className="text-center md:text-left space-y-1">
                  <p className="text-sm font-bold text-foreground">Bạn có file xuất dữ liệu {selectedPlatform === "tiktok" ? "TikTok" : "Instagram"} mới?</p>
                  <p className="text-xs text-muted-foreground">Kéo thả thêm tệp ZIP/JSON mới để cập nhật mốc Snapshot so sánh.</p>
                </div>
                <div className="w-full md:w-auto">
                  <input
                    type="file"
                    id="mini-file-upload"
                    className="hidden"
                    accept=".zip,.json,.txt"
                    multiple
                    onChange={async (e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const fileList = Array.from(e.target.files);
                        if (fileList.length === 1) {
                          const parsed = await parseUploadedFile(fileList[0]);
                          handleDataParsed(parsed, fileList[0].name);
                        } else {
                          let mergedFollowers: any[] = [];
                          let mergedFollowing: any[] = [];
                          let detectedPlatform: "tiktok" | "instagram" = "instagram";
                          for (const file of fileList) {
                            const parsed = await parseUploadedFile(file);
                            if (parsed.platform) {
                              detectedPlatform = parsed.platform;
                            }
                            mergedFollowers = mergedFollowers.concat(parsed.followers);
                            mergedFollowing = mergedFollowing.concat(parsed.following);
                          }
                          handleDataParsed({
                            followers: mergedFollowers,
                            following: mergedFollowing,
                            platform: detectedPlatform
                          }, `Gộp ${fileList.length} tệp (${detectedPlatform === "instagram" ? "Instagram" : "TikTok"})`);
                        }
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    className={`w-full md:w-auto h-9 text-xs transition-all duration-300 ${
                      selectedPlatform === "tiktok" 
                        ? "border-[#fe2c55]/30 hover:bg-[#fe2c55]/10 text-foreground" 
                        : "border-[#fd1d1d]/30 hover:bg-[#fd1d1d]/10 text-foreground"
                    }`}
                    onClick={() => document.getElementById("mini-file-upload")?.click()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Tải lên Snapshot mới
                  </Button>
                </div>
              </div>
            )}

            {/* Nội dung Render theo Trang active */}
            {activePage === "dashboard" && (
              filteredSnapshots.length === 0 ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="text-center space-y-4 max-w-2xl mx-auto my-8 md:my-12 px-2">
                    <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                      Ai đã hủy follow {selectedPlatform === "tiktok" ? "TikTok" : "Instagram"} của bạn?
                    </h1>
                    <p className="text-sm md:text-lg text-muted-foreground leading-relaxed">
                      Xác định người hủy follow cực kỳ dễ dàng và bảo mật tuyệt đối 100%. Không cần đăng nhập, không cần nhập mật khẩu.
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-2.5 text-xs text-muted-foreground/80 pt-1">
                      <span className="flex items-center gap-1.5 bg-muted/20 px-3.5 py-1.5 rounded-full shrink-0">
                        <Heart className={`h-3.5 w-3.5 transition-colors ${selectedPlatform === "tiktok" ? "text-[#fe2c55]" : "text-[#fd1d1d]"}`} />
                        Bảo mật trình duyệt
                      </span>
                      <span className="flex items-center gap-1.5 bg-muted/20 px-3.5 py-1.5 rounded-full shrink-0">
                        <ShieldAlert className={`h-3.5 w-3.5 transition-colors ${selectedPlatform === "tiktok" ? "text-[#25f4ee]" : "text-[#fcb045]"}`} />
                        Không cần API/Pass
                      </span>
                    </div>
                  </div>

                  <DropZone onDataParsed={handleDataParsed} platform={selectedPlatform} />
                  <Guide platform={selectedPlatform} />
                </div>
              ) : (
                activeSnapshot && <Dashboard snapshot={activeSnapshot} />
              )
            )}

            {activePage === "compare" && (
              <CompareSnapshots snapshots={filteredSnapshots} />
            )}

            {activePage === "snapshots" && (
              <SnapshotManager
                snapshots={filteredSnapshots}
                onSelect={(id) => {
                  setActiveSnapshotId(id);
                  setActivePage("dashboard");
                }}
                onDelete={handleDeleteSnapshot}
                onRename={handleRenameSnapshot}
                activeSnapshotId={activeSnapshotId}
              />
            )}

            {activePage === "guide" && (
              <Guide platform={selectedPlatform} />
            )}
          </div>
        )}
      </main>

      {/* Dialog Đặt Tên nhãn khi thêm Snapshot mới */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-popover border-muted/20 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Lưu mốc dữ liệu mới</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Phân tích thành công! Đặt tên cho bản ghi này để dễ dàng phân biệt khi đối chiếu (ví dụ: "Dữ liệu sau khi đăng video").
            </DialogDescription>
          </DialogHeader>

          {pendingData && (
            <div className="bg-muted/10 p-3 rounded-lg border border-muted/10 my-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Followers phát hiện:</span>
                <span className="font-mono text-[#fe2c55] font-bold">{pendingData.followers.length.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Following phát hiện:</span>
                <span className="font-mono text-[#25f4ee] font-bold">{pendingData.following.length.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="snapshot-label" className="text-xs font-semibold text-muted-foreground">Tên nhãn bản ghi</Label>
              <Input
                id="snapshot-label"
                value={newSnapshotLabel}
                onChange={(e) => setNewSnapshotLabel(e.target.value)}
                className="bg-muted/10 border-muted/20 text-sm focus-visible:ring-1 focus-visible:ring-primary"
                placeholder="Nhập tên nhãn..."
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setShowSaveDialog(false); setPendingData(null); }} className="h-9 text-xs">
              Hủy
            </Button>
            <Button onClick={handleSaveSnapshot} className="h-9 text-xs bg-primary hover:bg-primary/90">
              Lưu bản ghi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-[#27272a]/20 bg-[#09090b]/50 text-center text-xs text-muted-foreground leading-relaxed">
        <div className="container mx-auto px-4 space-y-2">
          <p>© {new Date().getFullYear()} Social Follower Tracker. Thiết kế hiện đại, bảo mật và riêng tư 100%.</p>
          <p className="max-w-md mx-auto text-[10px] text-muted-foreground/60">
            Ứng dụng web này không liên kết hay được tài trợ bởi bất kỳ mạng xã hội nào. Toàn bộ dữ liệu của bạn chỉ được xử lý và lưu trữ cục bộ trong trình duyệt của bạn.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
