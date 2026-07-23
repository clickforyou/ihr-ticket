"use client";

import Link from "next/link";
import { format, isPast, isToday } from "date-fns";
import { Avatar } from "@/components/ui/avatar";
import { PriorityBadge, LabelChip } from "@/components/ui/badges";
import { publicUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/lib/types";
import { MessageSquare, Paperclip, CalendarDays, ImageIcon } from "lucide-react";

export function TicketCard({
  ticket,
  onDragStart,
  dragging,
}: {
  ticket: Ticket;
  onDragStart?: (e: React.DragEvent) => void;
  dragging?: boolean;
}) {
  const cover = ticket.attachments?.find((a) =>
    a.mime_type?.startsWith("image/"),
  );
  const due = ticket.due_date ? new Date(ticket.due_date) : null;
  const overdue = due && isPast(due) && !isToday(due) && ticket.status !== "done";

  return (
    <Link
      href={`/tickets/${ticket.id}`}
      draggable
      onDragStart={onDragStart}
      className={cn(
        "group block rounded-xl border border-border bg-white p-3 shadow-sm transition hover:border-primary/40 hover:shadow-md",
        dragging && "opacity-40",
      )}
    >
      {cover && (
        <div className="mb-2.5 overflow-hidden rounded-lg border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={publicUrl(cover.file_path)}
            alt=""
            className="h-28 w-full object-cover transition group-hover:scale-[1.02]"
          />
        </div>
      )}

      {ticket.labels && ticket.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {ticket.labels.map((l) => (
            <LabelChip key={l.id} label={l} />
          ))}
        </div>
      )}

      <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-800">
        {ticket.title}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-slate-400">
          <PriorityBadge priority={ticket.priority} showLabel={false} />
          {ticket.attachments && ticket.attachments.length > 0 && (
            <span className="flex items-center gap-0.5 text-[11px]">
              <Paperclip size={12} />
              {ticket.attachments.length}
            </span>
          )}
          {cover && <ImageIcon size={12} />}
          {due && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-[11px]",
                overdue && "text-red-500 font-medium",
              )}
            >
              <CalendarDays size={12} />
              {format(due, "d MMM")}
            </span>
          )}
        </div>
        <Avatar profile={ticket.assignee} size={24} />
      </div>
    </Link>
  );
}
