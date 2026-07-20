import { BookOpen, AlertCircle, FileJson, ArrowRight, Smartphone, ShieldCheck, DownloadCloud } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function Guide() {
  const steps = [
    {
      num: "01",
      title: "Vào mục Cài đặt tài khoản",
      description: "Mở ứng dụng TikTok trên điện thoại của bạn. Truy cập vào Hồ sơ cá nhân > Nhấn vào Menu 3 dấu gạch ở góc trên bên phải > Chọn 'Cài đặt và quyền riêng tư' (Settings and privacy).",
      icon: Smartphone,
    },
    {
      num: "02",
      title: "Yêu cầu tải dữ liệu",
      description: "Tại menu cài đặt, chọn mục 'Tài khoản' (Account) > Sau đó chọn 'Tải dữ liệu của bạn' (Download your data).",
      icon: DownloadCloud,
    },
    {
      num: "03",
      title: "Chọn định dạng JSON",
      description: "Chọn định dạng dữ liệu là JSON (RẤT QUAN TRỌNG: không chọn TXT vì định dạng JSON đầy đủ và dễ phân tích hơn). Sau đó, nhấn vào nút 'Yêu cầu dữ liệu' (Request data).",
      icon: FileJson,
    },
    {
      num: "04",
      title: "Chờ TikTok duyệt dữ liệu",
      description: "TikTok sẽ tiến hành xử lý yêu cầu. Thời gian chuẩn bị file dữ liệu thường mất từ 1 - 3 ngày. Khi dữ liệu đã sẵn sàng tải xuống, bạn sẽ nhận được thông báo từ TikTok.",
      icon: ArrowRight,
    },
    {
      num: "05",
      title: "Tải file dữ liệu về",
      description: "Quay trở lại mục 'Tải dữ liệu của bạn', chuyển sang tab 'Tải dữ liệu' (Download data) và bấm 'Tải về' (Download). Bạn sẽ nhận được 1 file nén ZIP (ví dụ: tiktok_user_data.zip).",
      icon: DownloadCloud,
    },
    {
      num: "06",
      title: "Kéo thả file vào web",
      description: "Mở ứng dụng web này, kéo thả trực tiếp tệp tin ZIP vừa tải về (hoặc tệp Followers.json đã giải nén bên trong) vào khu vực kéo thả để bắt đầu quét và so sánh.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Hướng dẫn lấy tệp dữ liệu từ TikTok
        </h2>
        <p className="text-muted-foreground text-sm">
          Vì bảo mật dữ liệu, TikTok chỉ cung cấp danh sách người theo dõi thông qua tệp xuất dữ liệu cá nhân. Dưới đây là cách thực hiện.
        </p>
      </div>

      <Alert className="border-primary/20 bg-primary/5 text-primary">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="font-semibold text-sm">Lưu ý quan trọng</AlertTitle>
        <AlertDescription className="text-xs leading-relaxed mt-1">
          Hãy chắc chắn bạn đã chọn định dạng <strong className="text-foreground">JSON</strong> khi yêu cầu dữ liệu. Dữ liệu này được xử lý hoàn toàn **nội bộ trên máy tính của bạn**. Web không gửi bất kỳ thông tin nào lên máy chủ, tuyệt đối không có rủi ro rò rỉ tài khoản hay bị ban.
        </AlertDescription>
      </Alert>

      {/* Grid các bước */}
      <div className="grid gap-6 md:grid-cols-2">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.num} className="bg-card/40 backdrop-blur-sm border-muted/20 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-muted/5 rounded-full group-hover:bg-primary/5 transition-colors duration-300" />
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="flex items-center justify-center font-mono text-xl font-black text-primary/30 group-hover:text-primary transition-colors">
                  {step.num}
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/20 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all">
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1 relative z-10">
                <CardTitle className="text-sm font-bold text-foreground">{step.title}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
