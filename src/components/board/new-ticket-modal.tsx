"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { LabelChip } from "@/components/ui/badges";
import { uploadAttachment } from "@/lib/storage";
import { createTicket } from "@/app/(app)/board/actions";
import {
  PRIORITIES,
  STATUSES,
  type Project,
  type Profile,
  type Label,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/types";
import { ImagePlus, Loader2, X } from "lucide-react";

const fieldCls =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40";
const labelCls = "mb-1.5 block text-xs font-semibold text-slate-600";

export function NewTicketModal({
  open,
  onClose,
  projects,
  members,
  labels,
  defaultProject,
}: {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  members: Profile[];
  labels: Label[];
  defaultProject?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [picked, setPicked] = useState<string[]>([]);

  const [form, setForm] = useState({
    project_id: defaultProject || projects[0]?.id || "",
    title: "",
    description: "",
    priority: "medium" as TicketPriority,
    status: "todo" as TicketStatus,
    assignee_id: "",
    due_date: "",
  });

  const availableLabels = labels.filter(
    (l) => l.project_id === null || l.project_id === form.project_id,
  );

  function reset() {
    setForm((f) => ({ ...f, title: "", description: "", due_date: "" }));
    setFiles([]);
    setPicked([]);
    setError(null);
  }

  function submit() {
    if (!form.title.trim()) return setError("กรุณาใส่ชื่องาน");
    if (!form.project_id) return setError("กรุณาเลือก project");
    setError(null);

    startTransition(async () => {
      try {
        const attachments = [];
        for (const f of files) attachments.push(await uploadAttachment(f));

        const res = await createTicket({
          project_id: form.project_id,
          title: form.title,
          description: form.description,
          priority: form.priority,
          status: form.status,
          assignee_id: form.assignee_id || null,
          due_date: form.due_date || null,
          label_ids: picked,
          attachments,
        });

        if (res?.error) return setError(res.error);
        reset();
        onClose();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ");
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="สร้างงานใหม่" className="max-w-xl">
      <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">
        {/* project + title */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <label className={labelCls}>Project</label>
            <select
              className={fieldCls}
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.key}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>ชื่องาน</label>
            <input
              autoFocus
              className={fieldCls}
              placeholder="เช่น แก้บั๊กหน้า login ค้าง"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>รายละเอียด</label>
          <textarea
            rows={3}
            className={fieldCls}
            placeholder="อธิบายงาน ขั้นตอนทำซ้ำ ผลที่คาดหวัง…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {/* priority + status + assignee + due */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>ความสำคัญ</label>
            <select
              className={fieldCls}
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value as TicketPriority })
              }
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>สถานะ</label>
            <select
              className={fieldCls}
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as TicketStatus })
              }
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>ผู้รับผิดชอบ</label>
            <select
              className={fieldCls}
              value={form.assignee_id}
              onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}
            >
              <option value="">— ยังไม่ระบุ —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name ?? "ผู้ใช้"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>กำหนดเสร็จ</label>
            <input
              type="date"
              className={fieldCls}
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>
        </div>

        {/* labels */}
        {availableLabels.length > 0 && (
          <div>
            <label className={labelCls}>ป้ายกำกับ</label>
            <div className="flex flex-wrap gap-1.5">
              {availableLabels.map((l) => {
                const on = picked.includes(l.id);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() =>
                      setPicked((p) =>
                        on ? p.filter((x) => x !== l.id) : [...p, l.id],
                      )
                    }
                    className={
                      "rounded-full transition " +
                      (on ? "ring-2 ring-offset-1 ring-violet-400" : "opacity-60 hover:opacity-100")
                    }
                  >
                    <LabelChip label={l} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* attachments */}
        <div>
          <label className={labelCls}>แนบรูป</label>
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div
                key={i}
                className="relative h-16 w-16 overflow-hidden rounded-lg border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(f)}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => setFiles((fs) => fs.filter((_, x) => x !== i))}
                  className="absolute right-0.5 top-0.5 rounded-full bg-slate-900/60 p-0.5 text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-slate-400 transition hover:border-violet-400 hover:text-violet-500">
              <ImagePlus size={18} />
              <span className="text-[10px]">เพิ่ม</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) =>
                  setFiles((fs) => [...fs, ...Array.from(e.target.files ?? [])])
                }
              />
            </label>
          </div>
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
        <Button onClick={submit} disabled={pending}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          สร้างงาน
        </Button>
      </div>
    </Modal>
  );
}
