import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
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
      title="Sao chép"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}
