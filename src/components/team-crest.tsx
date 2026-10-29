import { cn } from "cn";

export function TeamCrest({
  name,
  badgeUrl,
  size = "md",
  className,
}: {
  name: string;
  badgeUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box =
    size === "lg" ? "size-16 sm:size-20" : size === "sm" ? "size-8" : "size-10";
  const text =
    size === "lg" ? "text-lg" : size === "sm" ? "text-[10px]" : "text-xs";

  if (badgeUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={badgeUrl}
        alt=""
        className={cn(box, "shrink-0 object-contain", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        box,
        "flex shrink-0 items-center justify-center rounded-xl bg-muted font-bold text-muted-foreground",
        text,
        className,
      )}
      aria-hidden
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
