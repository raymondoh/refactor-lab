import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AdComponent() {
  return (
    <Card className="flex flex-col items-center justify-center h-full border-2 border-dashed border-primary/50 bg-primary/5 text-center">
      <CardContent className="p-6">
        <Badge>Sponsored</Badge>
        <p className="mt-4 font-semibold text-lg text-primary">Promote Your Business Here</p>
        <p className="text-sm text-muted-foreground mt-2">Reach local customers actively looking for your services.</p>
      </CardContent>
    </Card>
  );
}
