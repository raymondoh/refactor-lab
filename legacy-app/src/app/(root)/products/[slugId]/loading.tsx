import { Loader2 } from "lucide-react";

export default function LoadingProductPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">Loading product...</p>
    </div>
  );
}
