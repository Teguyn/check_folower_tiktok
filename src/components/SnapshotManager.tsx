import { useState } from "react";
import { History, Calendar, Trash2, Edit2, Check, X, FileSpreadsheet, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { FollowerSnapshot } from "@/lib/db";

interface SnapshotManagerProps {
  snapshots: FollowerSnapshot[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newLabel: string) => void;
  activeSnapshotId: string | null;
}

export function SnapshotManager({
  snapshots,
  onSelect,
  onDelete,
  onRename,
  activeSnapshotId
}: SnapshotManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const startRename = (snapshot: FollowerSnapshot) => {
    setEditingId(snapshot.id);
    setEditLabel(snapshot.label);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditLabel("");
  };

  const submitRename = (id: string) => {
    if (editLabel.trim()) {
      onRename(id, editLabel.trim());
      setEditingId(null);
      setEditLabel("");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          Quản lý bản ghi lịch sử
        </h2>
        <p className="text-muted-foreground text-sm">
          Xem danh sách, đổi tên hoặc xóa các mốc dữ liệu cũ đã lưu trữ trong trình duyệt của bạn.
        </p>
      </div>

      <Card className="bg-card/50 backdrop-blur-md border-muted/20">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            Bản ghi đã lưu
            <Badge variant="secondary" className="font-normal text-xs bg-muted/30">
              {snapshots.length} bản ghi
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Dữ liệu này được lưu trữ hoàn toàn trên trình duyệt của thiết bị hiện tại (IndexedDB).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="hover:bg-transparent border-muted/20">
                  <TableHead className="text-xs">Tên nhãn (Label)</TableHead>
                  <TableHead className="text-xs">Ngày tải lên</TableHead>
                  <TableHead className="text-center text-xs">Followers</TableHead>
                  <TableHead className="text-center text-xs">Following</TableHead>
                  <TableHead className="text-center text-xs">Trạng thái</TableHead>
                  <TableHead className="text-right text-xs pr-6">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FileSpreadsheet className="h-8 w-8 text-muted-foreground/30" />
                        <p className="font-semibold text-foreground">Chưa có bản ghi nào được lưu</p>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                          Hãy tải lên tệp xuất dữ liệu TikTok ở tab đầu tiên để tạo bản ghi lịch sử đầu tiên.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  snapshots.map((snapshot) => {
                    const isActive = snapshot.id === activeSnapshotId;
                    const isEditing = snapshot.id === editingId;

                    return (
                      <TableRow
                        key={snapshot.id}
                        className={`border-muted/10 transition-colors ${
                          isActive ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/5"
                        }`}
                      >
                        {/* Cột Tên nhãn */}
                        <TableCell className="font-semibold text-sm">
                          {isEditing ? (
                            <div className="flex items-center gap-1 max-w-xs">
                              <Input
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                className="h-8 text-sm focus-visible:ring-1 focus-visible:ring-primary bg-background border-muted/20"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") submitRename(snapshot.id);
                                  if (e.key === "Escape") cancelRename();
                                }}
                              />
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                className="text-green-500 hover:bg-green-500/10 rounded-md shrink-0"
                                onClick={() => submitRename(snapshot.id)}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10 rounded-md shrink-0"
                                onClick={cancelRename}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <span className="text-foreground">{snapshot.label}</span>
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                                onClick={() => startRename(snapshot)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>

                        {/* Cột Ngày tải lên */}
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(snapshot.timestamp).toLocaleString("vi-VN")}
                          </span>
                        </TableCell>

                        {/* Cột Followers */}
                        <TableCell className="text-center font-mono text-sm text-[#fe2c55] font-semibold">
                          {snapshot.followers.length.toLocaleString()}
                        </TableCell>

                        {/* Cột Following */}
                        <TableCell className="text-center font-mono text-sm text-[#25f4ee] font-semibold">
                          {snapshot.following.length.toLocaleString()}
                        </TableCell>

                        {/* Cột Trạng thái */}
                        <TableCell className="text-center">
                          {isActive ? (
                            <Badge className="bg-[#fe2c55] hover:bg-[#fe2c55]/90 text-white border-none text-[10px] px-1.5 py-0.5">
                              Đang xem
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground font-light">-</span>
                          )}
                        </TableCell>

                        {/* Cột Hành động */}
                        <TableCell className="text-right pr-6 space-x-1.5">
                          <Button
                            size="sm"
                            variant={isActive ? "outline" : "default"}
                            className={`h-7 px-2.5 text-xs rounded-md ${
                              isActive ? "border-muted/30 text-muted-foreground" : "bg-primary hover:bg-primary/80"
                            }`}
                            onClick={() => onSelect(snapshot.id)}
                            disabled={isActive}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Xem
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2.5 text-xs rounded-md"
                            onClick={() => {
                              if (confirm(`Bạn chắc chắn muốn xóa bản ghi "${snapshot.label}" này chứ?`)) {
                                onDelete(snapshot.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
