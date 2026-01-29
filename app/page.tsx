import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <AppLayout>
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Planr</h1>
        <p className="text-muted-foreground">
          Your centralized academic planning platform.
        </p>
        <div className="flex gap-4">
          <Button>Get Started</Button>
          <Button variant="outline">Learn More</Button>
        </div>
      </div>
    </AppLayout>
  );
}