import { cn } from "cn";

export function FormPips({
  form,
  inverted = false,
}: {
  form: string;
  inverted?: boolean;
}) {
  const letters = form.slice(-5).split("");
  if (letters.length === 0) return null;
  return (
    <span className="inline-flex gap-0.5" aria-hidden>
      {letters.map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          className={cn(
            "inline-flex size-3.5 items-center justify-center rounded-[3px] text-[8px] font-bold leading-none",
            letter === "W" && (inverted ? "bg-emerald-400/25 text-emerald-200" : "bg-emerald-500/15 text-emerald-700"),
            letter === "D" && (inverted ? "bg-white/15 text-white/80" : "bg-muted text-muted-foreground"),
            letter === "L" && (inverted ? "bg-red-400/25 text-red-200" : "bg-red-500/15 text-red-700"),
          )}
        >
          {letter}
        </span>
      ))}
    </span>
  );
}
