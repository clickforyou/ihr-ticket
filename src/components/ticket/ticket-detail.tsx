"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Avatar } from "@/components/ui/avatar";
import { LabelChip, PriorityBadge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  publicUrl,
  uploadAttachment,
  removeAttachmentFile,
} from "@/lib/storage";
import {
  updateTicket,
  deleteTicket,
  addComment,
  addAttachment,
  deleteAttachment,
} from "@/app/(app)/board/actions";
import {
  STATUSES,
  PRIORITIES,
  type Ticket,
  type Profile,
  type Label,
  type Comment,
  type Activity,
  type TicketStatus,
  type TicketPriority,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Trash2,
  Send,
  Loader2,
  ImageIcon,
  ImagePlus,
  X,
  Clock,
} from "lucide-react";

const fieldCls =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40";

export function TicketDetail({
  ticket,
  members,
  comments,
  activity,
}: {
  ticket: Ticket;
  members: Profile[];
  allLabels: Label[];
  comments: Comment[];
  activity: Activity[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [title, setTitle] = useState(ticket.title);
  const [desc, setDesc] = useState(ticket.description ?? "");
  const [editingDesc, setEditingDesc] = useState(false);
  const [comment, setComment] = useState("");
  const [posting, startPost] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const images = ticket.attachments?.filter((a) =>
    a.mime_type?.startsWith("image/"),
  );

  function patch(p: Parameters<typeof updateTicket>[1]) {
    startTransition(async () => {
      await updateTicket(ticket.id, p);
      router.refresh();
    });
  }

  function saveTitle() {
    if (title.trim() && title !== ticket.title) patch({ title: title.trim() });
  }

  function saveDesc() {
    setEditingDesc(false);
    if (desc !== (ticket.description ?? "")) patch({ description: desc || null });
  }

  async function remove() {
    await deleteTicket(ticket.id);
    router.push("/board");
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const meta = await uploadAttachment(file);
        const res = await addAttachment(ticket.id, meta);
        if (res?.error) throw new Error(res.error);
      }
      router.refresh();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(id: string, path: string) {
    startTransition(async () => {
      await removeAttachmentFile(path);
      await deleteAttachment(id, ticket.id);
      router.refresh();
    });
  }

  function postComment() {
    const body = comment.trim();
    if (!body) return;
    startPost(async () => {
      await addComment(ticket.id, body);
      setComment("");
      router.refresh();
    });
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-surface/90 px-6 py-3 backdrop-blur">
        <Link
          href={ticket.project_id ? `/board?project=${ticket.project_id}` : "/board"}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-500 transition hover:bg-slate-100"
        >
          <ArrowLeft size={16} />
          กลับ
        </Link>
        {ticket.project && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: ticket.project.color }}
            />
            {ticket.project.name}
          </span>
        )}
        <button
          onClick={() => setConfirmDelete(true)}
          className="ml-auto rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
          title="ลบงาน"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mx-auto grid max-w-5xl gap-8 p-6 lg:grid-cols-[1fr_280px]">
        {/* main */}
        <div className="min-w-0">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-2xl font-bold tracking-tight outline-none transition hover:bg-slate-50 focus:border-border focus:bg-white"
          />

          {ticket.labels && ticket.labels.length > 0 && (
            <div className="mb-4 mt-2 flex flex-wrap gap-1.5 px-2">
              {ticket.labels.map((l) => (
                <LabelChip key={l.id} label={l} />
              ))}
            </div>
          )}

          {/* description */}
          <div className="mt-4 px-2">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              รายละเอียด
            </h3>
            {editingDesc ? (
              <div>
                <textarea
                  autoFocus
                  rows={5}
                  className={fieldCls}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={saveDesc}>
                    บันทึก
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDesc(ticket.description ?? "");
                      setEditingDesc(false);
                    }}
                  >
                    ยกเลิก
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setEditingDesc(true)}
                className="cursor-text whitespace-pre-wrap rounded-lg px-3 py-2.5 text-sm leading-relaxed text-slate-700 transition hover:bg-slate-50"
              >
                {ticket.description || (
                  <span className="text-slate-400">
                    คลิกเพื่อเพิ่มรายละเอียด…
                  </span>
                )}
              </div>
            )}
          </div>

          {/* attachments */}
          <div className="mt-6 px-2">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <ImageIcon size={13} />
              รูปแนบ {images && images.length > 0 && `(${images.length})`}
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images?.map((a) => (
                <div
                  key={a.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                >
                  <button
                    onClick={() => setLightbox(publicUrl(a.file_path))}
                    className="h-full w-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={publicUrl(a.file_path)}
                      alt={a.file_name}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  </button>
                  <button
                    onClick={() => removeImage(a.id, a.file_path)}
                    title="ลบรูป"
                    className="absolute right-1 top-1 rounded-full bg-slate-900/60 p-1 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}

              {/* upload tile */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className={cn(
                  "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-slate-400 transition hover:border-violet-400 hover:text-violet-500",
                  uploading && "pointer-events-none opacity-60",
                )}
              >
                {uploading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ImagePlus size={18} />
                )}
                <span className="text-[10px]">
                  {uploading ? "กำลังอัป..." : "เพิ่มรูป"}
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  handleUpload(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
            {uploadError && (
              <p className="mt-2 text-xs text-red-600">{uploadError}</p>
            )}
          </div>

          {/* comments */}
          <div className="mt-8 px-2">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              ความคิดเห็น ({comments.length})
            </h3>
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar profile={c.author} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium">
                        {c.author?.full_name ?? "ผู้ใช้"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {format(new Date(c.created_at), "d MMM HH:mm")}
                      </span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">
                      {c.body}
                    </p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-slate-400">ยังไม่มีความคิดเห็น</p>
              )}
            </div>

            {/* new comment */}
            <div className="mt-4 flex gap-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) postComment();
                }}
                rows={2}
                placeholder="เขียนความคิดเห็น… (Ctrl+Enter เพื่อส่ง)"
                className={fieldCls}
              />
              <Button
                size="icon"
                onClick={postComment}
                disabled={posting || !comment.trim()}
                className="h-auto self-stretch"
              >
                {posting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* sidebar */}
        <aside className="space-y-5">
          <Field label="สถานะ">
            <select
              className={fieldCls}
              value={ticket.status}
              onChange={(e) =>
                patch({ status: e.target.value as TicketStatus })
              }
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="ความสำคัญ">
            <select
              className={fieldCls}
              value={ticket.priority}
              onChange={(e) =>
                patch({ priority: e.target.value as TicketPriority })
              }
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <div className="mt-1.5">
              <PriorityBadge priority={ticket.priority} />
            </div>
          </Field>

          <Field label="ผู้รับผิดชอบ">
            <select
              className={fieldCls}
              value={ticket.assignee_id ?? ""}
              onChange={(e) =>
                patch({ assignee_id: e.target.value || null })
              }
            >
              <option value="">— ยังไม่ระบุ —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name ?? "ผู้ใช้"}
                </option>
              ))}
            </select>
          </Field>

          <Field label="กำหนดเสร็จ">
            <input
              type="date"
              className={fieldCls}
              value={ticket.due_date ?? ""}
              onChange={(e) => patch({ due_date: e.target.value || null })}
            />
          </Field>

          <div className="space-y-2 border-t border-border pt-4 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span>ผู้แจ้ง</span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <Avatar profile={ticket.reporter} size={20} />
                {ticket.reporter?.full_name ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>สร้างเมื่อ</span>
              <span>{format(new Date(ticket.created_at), "d MMM yyyy")}</span>
            </div>
          </div>

          {/* activity */}
          {activity.length > 0 && (
            <div className="border-t border-border pt-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Clock size={12} />
                กิจกรรม
              </h3>
              <ul className="space-y-2.5">
                {activity.map((a) => (
                  <li key={a.id} className="flex gap-2 text-xs text-slate-500">
                    <Avatar profile={a.actor} size={18} />
                    <span className="flex-1">
                      <span className="font-medium text-slate-600">
                        {a.actor?.full_name ?? "ผู้ใช้"}
                      </span>{" "}
                      {actionLabel(a.action)}
                      <span className="mt-0.5 block text-[11px] text-slate-400">
                        {format(new Date(a.created_at), "d MMM HH:mm")}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {/* lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8"
        >
          <button className="absolute right-6 top-6 text-white/80 hover:text-white">
            <X size={24} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        title="ลบงานนี้?"
        message={
          <>
            งาน <span className="font-medium text-slate-700">{ticket.title}</span>{" "}
            รวมถึงคอมเมนต์ รูปแนบ และประวัติทั้งหมดจะถูกลบถาวร ย้อนกลับไม่ได้
          </>
        }
        confirmText="ลบงาน"
      />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function actionLabel(action: string) {
  switch (action) {
    case "created":
      return "สร้างงานนี้";
    case "status_changed":
      return "เปลี่ยนสถานะ";
    case "commented":
      return "แสดงความคิดเห็น";
    case "attached":
      return "แนบรูป";
    case "updated":
      return "แก้ไขงาน";
    default:
      return action;
  }
}
