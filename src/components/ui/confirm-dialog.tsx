"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2 } from "lucide-react";

type Tone = "danger" | "warning";

const toneStyle: Record<Tone, { icon: string; ring: string }> = {
  danger: { icon: "text-red-600", ring: "bg-red-50" },
  warning: { icon: "text-amber-600", ring: "bg-amber-50" },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  tone = "danger",
}: {
  open: boolean;
  onClose: () => void;
  /** อาจ return promise ได้ — dialog จะโชว์ loading จนเสร็จ */
  onConfirm: () => void | Promise<void>;
  title: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: Tone;
}) {
  const [loading, setLoading] = useState(false);
  const t = toneStyle[tone];

  async function handle() {
    try {
      setLoading(true);
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} className="max-w-md">
      <div className="flex gap-4 px-5 pb-2 pt-5">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            t.ring,
          )}
        >
          <AlertTriangle size={20} className={t.icon} />
        </div>
        <div className="pt-0.5">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          {message && (
            <div className="mt-1 text-sm leading-relaxed text-slate-500">
              {message}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 px-5 py-4">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant={tone === "danger" ? "danger" : "primary"}
          onClick={handle}
          disabled={loading}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
