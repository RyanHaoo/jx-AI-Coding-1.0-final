import { Monitor, Smartphone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-white p-8">
      <div className="flex max-w-md flex-col items-center gap-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          建筑施工质检情报员
        </h1>
        <div className="flex w-full flex-col gap-4 sm:flex-row">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-24 flex-1 gap-3 text-base"
          >
            <Link href="/mobile/assistant">
              <Smartphone className="size-6" />
              移动端
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-24 flex-1 gap-3 text-base"
          >
            <Link href="/dashboard/overview">
              <Monitor className="size-6" />
              PC 管理端
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
