import React, { useState, useRef } from "react";
import { Upload, FileArchive, FileCode, FileText, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { parseUploadedFile } from "@/lib/parser";
import type { ParsedTikTokData } from "@/lib/parser";

interface DropZoneProps {
  onDataParsed: (data: ParsedTikTokData, fileName: string) => void;
}

export function DropZone({ onDataParsed }: DropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const parsedData = await parseUploadedFile(file);
      
      if (parsedData.followers.length === 0 && parsedData.following.length === 0) {
        throw new Error(
          "Không tìm thấy danh sách Người theo dõi (Followers) hoặc Đang theo dõi (Following) trong tệp này. Hãy chắc chắn bạn đã tải lên đúng tệp tin xuất từ TikTok."
        );
      }
      
      onDataParsed(parsedData, file.name);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi không xác định khi phân tích tệp.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-6">
      <Card className="border-dashed border-2 border-muted-foreground/30 bg-card/50 backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(251,43,101,0.15)]">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-[#fe2c55] to-[#25f4ee] bg-clip-text text-transparent">
            Tải lên Dữ liệu TikTok của bạn
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Kéo thả tệp ZIP, JSON hoặc TXT xuất từ TikTok để bắt đầu phân tích
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center p-8 rounded-lg border border-transparent transition-colors duration-200 min-h-[220px] cursor-pointer ${
              isDragActive ? "bg-primary/5 border-primary/20" : "bg-muted/10"
            }`}
            onClick={onButtonClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".zip,.json,.txt"
              onChange={handleChange}
              disabled={loading}
            />

            {loading ? (
              <div className="flex flex-col items-center space-y-3">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-sm font-medium text-muted-foreground">
                  Đang phân tích cú pháp dữ liệu TikTok... Vui lòng đợi
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex items-center gap-3 p-3 rounded-full bg-[#fe2c55]/10 text-[#fe2c55] animate-pulse">
                  <Upload className="h-8 w-8" />
                </div>
                
                <div className="space-y-1">
                  <p className="text-base font-semibold">
                    Kéo thả tệp vào đây hoặc click để chọn tệp
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Khuyên dùng tệp dạng <strong className="text-foreground">.ZIP</strong> (hoặc <strong className="text-foreground">Followers.json / Followers.txt</strong>) để có kết quả chính xác nhất.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 md:gap-4 text-muted-foreground text-xs pt-2">
                  <div className="flex items-center gap-1.5 bg-muted/20 px-2.5 py-1.5 rounded-md">
                    <FileArchive className="h-3.5 w-3.5" />
                    <span>ZIP Archive</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-muted/20 px-2.5 py-1.5 rounded-md">
                    <FileCode className="h-3.5 w-3.5" />
                    <span>JSON File</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-muted/20 px-2.5 py-1.5 rounded-md">
                    <FileText className="h-3.5 w-3.5" />
                    <span>TXT File</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4 border-destructive/20 bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi phân tích tệp</AlertTitle>
              <AlertDescription className="text-xs mt-1 leading-relaxed">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
