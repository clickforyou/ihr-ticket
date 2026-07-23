"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TicketCard } from "./ticket-card";
import { NewTicketModal } from "./new-ticket-modal";
import { ListView } from "./list-view";
import { Button } from "@/components/ui/button";
import { updateTicketStatus } from "@/app/(app)/board/actions";
import { cn } from "@/lib/utils";
import {
  STATUSES,
  PRIORITIES,
  type Ticket,
  type Project,
  type Profile,
  type Label,
  type TicketStatus,
} from "@/lib/types";
import {
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  SlidersHorizontal,
} from "lucide-react";

const statusAccent: Record<TicketStatus, string> = {
  todo: "bg-slate-400",
  in_progress: "bg-[#4b8ef5]",
  in_review: "bg-amber-500",
  done: "bg-[#5de2b7]",
};

export function BoardView({
  projects,
  members,
  labels,
  initialTickets,
  activeProject,
}: {
  projects: Project[];
  members: Profile[];
  labels: Label[];
  initialTickets: Ticket[];
  activeProject: string | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tickets, setTickets] = useState(initialTickets);
  const [view, setView] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<string>("");
  const [assignee, setAssignee] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TicketStatus | null>(null);

  useEffect(() => setTickets(initialTickets), [initialTickets]);

  const activeProjectObj = projects.find((p) => p.id === activeProject);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (priority && t.priority !== priority) return false;
      if (assignee && t.assignee_id !== assignee) return false;
      return true;
    });
  }, [tickets, search, priority, assignee]);

  const byStatus = (s: TicketStatus) => filtered.filter((t) => t.status === s);

  function onDrop(status: TicketStatus) {
    setOverCol(null);
    const id = draggedId;
    setDraggedId(null);
    if (!id) return;
    const t = tickets.find((x) => x.id === id);
    if (!t || t.status === status) return;

    // optimistic
    setTickets((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status } : x)),
    );
    startTransition(async () => {
      await updateTicketStatus(id, status);
      router.refresh();
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Topbar */}
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-6">
        <div className="flex items-center gap-2.5">
          {activeProjectObj && (
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: activeProjectObj.color }}
            />
          )}
          <h1 className="text-lg font-bold tracking-tight">
            {activeProjectObj ? activeProjectObj.name : "งานทั้งหมด"}
          </h1>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {filtered.length}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* search */}
          <div className="relative hidden sm:block">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหางาน…"
              className="h-9 w-48 rounded-lg border border-border bg-white pl-9 pr-3 text-sm outline-none transition focus:w-60 focus:border-primary focus:ring-2 focus:ring-ring/40"
            />
          </div>

          {/* view toggle */}
          <div className="flex rounded-lg border border-border bg-white p-0.5">
            <ToggleBtn active={view === "board"} onClick={() => setView("board")}>
              <LayoutGrid size={16} />
            </ToggleBtn>
            <ToggleBtn active={view === "list"} onClick={() => setView("list")}>
              <ListIcon size={16} />
            </ToggleBtn>
          </div>

          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            งานใหม่
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface/60 px-6 py-2.5">
        <SlidersHorizontal size={15} className="text-slate-400" />
        <FilterSelect
          value={priority}
          onChange={setPriority}
          placeholder="ความสำคัญทั้งหมด"
          options={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
        />
        <FilterSelect
          value={assignee}
          onChange={setAssignee}
          placeholder="ผู้รับผิดชอบทั้งหมด"
          options={members.map((m) => ({
            value: m.id,
            label: m.full_name ?? "ผู้ใช้",
          }))}
        />
        {(priority || assignee || search) && (
          <button
            onClick={() => {
              setPriority("");
              setAssignee("");
              setSearch("");
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* Body */}
      {view === "board" ? (
        <div className="flex flex-1 gap-4 overflow-x-auto p-6">
          {STATUSES.map((s) => {
            const items = byStatus(s.value);
            return (
              <div
                key={s.value}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverCol(s.value);
                }}
                onDragLeave={() => setOverCol((c) => (c === s.value ? null : c))}
                onDrop={() => onDrop(s.value)}
                className={cn(
                  "flex w-80 shrink-0 flex-col rounded-xl transition",
                  overCol === s.value && "bg-primary-soft ring-2 ring-primary/20",
                )}
              >
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className={cn("h-2 w-2 rounded-full", statusAccent[s.value])} />
                  <h3 className="text-sm font-semibold text-slate-700">{s.label}</h3>
                  <span className="text-xs text-slate-400">{items.length}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto pb-2">
                  {items.map((t) => (
                    <TicketCard
                      key={t.id}
                      ticket={t}
                      dragging={draggedId === t.id}
                      onDragStart={() => setDraggedId(t.id)}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-slate-400">
                      ลากงานมาที่นี่
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-6">
          <ListView tickets={filtered} projects={projects} />
        </div>
      )}

      <NewTicketModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        projects={projects}
        members={members}
        labels={labels}
        defaultProject={activeProject}
      />
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md transition",
        active
          ? "bg-primary-soft text-primary"
          : "text-slate-400 hover:text-slate-600",
      )}
    >
      {children}
    </button>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-8 rounded-lg border border-border bg-white px-2.5 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40",
        value ? "text-slate-700" : "text-slate-400",
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value} className="text-slate-700">
          {o.label}
        </option>
      ))}
    </select>
  );
}
