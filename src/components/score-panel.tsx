"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { DIMENSIONS } from "@/lib/data";
import { clampScore, emptyScores, overallFromRest } from "@/lib/store";
import type { DimensionId, ScoreMap } from "@/lib/types";

export function ScorePanel({
  initial,
  disabled,
  onSubmit,
}: {
  initial?: ScoreMap | null;
  disabled?: boolean;
  onSubmit: (scores: ScoreMap) => void;
}) {
  const [scores, setScores] = useState<ScoreMap>(initial ?? emptyScores());
  const [saved, setSaved] = useState(false);
  const [syncOverall, setSyncOverall] = useState(true);

  function update(id: DimensionId, value: number) {
    const next = { ...scores, [id]: clampScore(value) };
    if (syncOverall && id !== "overall") {
      next.overall = overallFromRest(next);
    }
    setScores(next);
    setSaved(false);
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(scores);
        setSaved(true);
      }}
    >
      {DIMENSIONS.map((dim) => (
        <div key={dim.id} className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <Label className="text-sm">{dim.label}</Label>
              <p className="text-xs text-muted-foreground">{dim.hint}</p>
            </div>
            <span className="text-lg font-semibold tabular-nums">
              {scores[dim.id].toFixed(1)}
            </span>
          </div>
          <Slider
            min={0}
            max={10}
            step={0.5}
            value={[scores[dim.id]]}
            disabled={disabled}
            onValueChange={(v) => {
              const n = Array.isArray(v) ? v[0] : Number(v);
              update(dim.id, n);
            }}
          />
        </div>
      ))}
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={syncOverall}
          onChange={(e) => {
            const checked = e.target.checked;
            setSyncOverall(checked);
            if (checked) {
              setScores((s) => ({ ...s, overall: overallFromRest(s) }));
            }
          }}
        />
        整体分跟随前四项平均（仍可手动改）
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={disabled} size="lg">
          {initial ? "更新我的评分" : "提交评分"}
        </Button>
        {saved && (
          <p className="text-sm text-primary">已写入本机。刷新后还在。</p>
        )}
      </div>
    </form>
  );
}
