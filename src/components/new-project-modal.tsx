"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { createProject } from "@/app/(app)/board/actions";
import { cn } from "@/lib/utils";
import { Loader2, Hash } from "lucide-react";

const COLORS = [
  "#7c3aed", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#6366f1", "#14b8a6",
];

const fieldCls =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40";
const labelCls = "mb-1.5 block text-xs font-semibold text-slate-600";

/** สร้าง key อัตโนมัติจากชื่อ: เอาอักษร A-Z/0-9 ตัวแรกๆ */
function suggestKey(name: string) {
  const ascii = name.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return ascii.slice(0, 4);
}

export function NewProjectModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  function onName(v: string) {
    setName(v);
    if (!keyTouched) setKey(suggestKey(v));
  }

  function reset() {
    setName("");
    setKey("");
    setKeyTouched(false);
    setDescription("");
    setColor(COLORS[0]);
    setError(null);
  }

  function submit() {
    setError(null);
    start(async () => {
      const res = await createProject({ name, key, description, color });
      if (res?.error) return setError(res.error);
      reset();
      onClose();
      router.push(`/board?project=${res.id}`);
      router.refresh();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="สร้าง Project ใหม่">
      <div className="space-y-4 px-5 py-5">
        <div>
          <label className={labelCls}>ชื่อ Project</label>
          <input
            autoFocus
            className={fieldCls}
            placeholder="เช่น iHR Payroll"
            value={name}
            onChange={(e) => onName(e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>รหัสย่อ (key)</label>
          <div className="relative">
            <Hash
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className={cn(fieldCls, "pl-8 font-mono uppercase")}
              placeholder="IHR"
              maxLength={10}
              value={key}
              onChange={(e) => {
                setKeyTouched(true);
                setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
              }}
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            A–Z / 0–9 ยาว 2–10 ตัว ใช้แสดงหน้าการ์ด (ต้องไม่ซ้ำ)
          </p>
        </div>

        <div>
          <label className={labelCls}>สี</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={cn(
                  "h-7 w-7 rounded-full transition",
                  color === c
                    ? "ring-2 ring-offset-2 ring-slate-400"
                    : "hover:scale-110",
                )}
              />
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>รายละเอียด (ไม่บังคับ)</label>
          <textarea
            rows={2}
            className={fieldCls}
            placeholder="อธิบายสั้นๆ ว่า project นี้เกี่ยวกับอะไร"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
        <Button variant="ghost" onClick={onClose} disabled={pending}>
          ยกเลิก
        </Button>
        <Button onClick={submit} disabled={pending || !name.trim()}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          สร้าง Project
        </Button>
      </div>
    </Modal>
  );
}
