"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Avatar } from "@/components/ui/avatar";
import { PriorityBadge, LabelChip } from "@/components/ui/badges";
import { STATUSES, type Ticket, type Project } from "@/lib/types";
import { Paperclip } from "lucide-react";

export function ListView({
  tickets,
  projects,
}: {
  tickets: Ticket[];
  projects: Project[];
}) {
  const router = useRouter();
  const projectOf = (id: string) => projects.find((p) => p.id === id);

  if (tickets.length === 0)
    return (
      <div className="rounded-xl border border-dashed border-border py-20 text-center text-sm text-slate-400">
        ไม่พบงานที่ตรงกับตัวกรอง
      </div>
    );

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">งาน</th>
            <th className="px-4 py-3">Project</th>
            <th className="px-4 py-3">สถานะ</th>
            <th className="px-4 py-3">ความสำคัญ</th>
            <th className="px-4 py-3">กำหนดเสร็จ</th>
            <th className="px-4 py-3">ผู้รับผิดชอบ</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => {
            const proj = projectOf(t.project_id);
            const st = STATUSES.find((s) => s.value === t.status);
            return (
              <tr
                key={t.id}
                onClick={() => router.push(`/tickets/${t.id}`)}
                className="cursor-pointer border-b border-border last:border-0 transition hover:bg-slate-50"
              >
                <td className="max-w-xs px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-slate-800">
                      {t.title}
                    </span>
                    {t.attachments && t.attachments.length > 0 && (
                      <Paperclip size={13} className="shrink-0 text-slate-400" />
                    )}
                  </div>
                  {t.labels && t.labels.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {t.labels.map((l) => (
                        <LabelChip key={l.id} label={l} />
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {proj && (
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: proj.color }}
                      />
                      {proj.key}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {st?.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {t.due_date ? format(new Date(t.due_date), "d MMM yyyy") : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar profile={t.assignee} size={24} />
                    <span className="text-slate-600">
                      {t.assignee?.full_name ?? "—"}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
