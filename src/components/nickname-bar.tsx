"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NicknameBar({
  nickname,
  onSave,
}: {
  nickname: string;
  onSave: (name: string) => void;
}) {
  const [value, setValue] = useState(nickname);

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(value);
      }}
    >
      <div className="flex-1 space-y-1">
        <Label htmlFor="nickname">看台昵称</Label>
        <Input
          id="nickname"
          value={value}
          maxLength={16}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <Button type="submit" variant="secondary">
        保存昵称
      </Button>
    </form>
  );
}
