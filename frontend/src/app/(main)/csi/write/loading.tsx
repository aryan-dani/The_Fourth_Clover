import { Loader2 } from "lucide-react";

export default function CsiWriteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="text-primary mx-auto mb-4 h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading CSI editor...</p>
      </div>
    </div>
  );
}
