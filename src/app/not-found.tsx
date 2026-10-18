import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">这场不在赛程里</h1>
      <p className="mt-2 text-muted-foreground">
        链接可能写错了，或者这名选手没有本场表现卡。
      </p>
      <Button className="mt-6" render={<Link href="/" />}>
        回到赛程
      </Button>
    </div>
  );
}
