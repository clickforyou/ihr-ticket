"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { logout } from "@/app/login/actions";
import { deleteProject } from "@/app/(app)/board/actions";
import { cn } from "@/lib/utils";
import type { Profile, Project } from "@/lib/types";
import { ProjectModal } from "@/components/project-modal";
import {
  LayoutDashboard,
  Ticket,
  LogOut,
  ChevronDown,
  Hash,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

export function Sidebar({
  profile,
  projects,
}: {
  profile: Profile;
  projects: Project[];
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
          <Ticket size={18} />
        </div>
        <span className="text-[15px] font-bold tracking-tight">iHR Ticket</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <NavItem href="/board" icon={LayoutDashboard} active={pathname === "/board"}>
          บอร์ดงาน
        </NavItem>

        <div className="mt-6 mb-2 flex items-center justify-between px-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Projects
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            title="เพิ่ม project"
            className="flex h-5 w-5 items-center justify-center rounded-md text-slate-400 transition hover:bg-violet-50 hover:text-primary"
          >
            <Plus size={15} />
          </button>
        </div>
        <div className="space-y-0.5">
          {projects.map((p) => (
            <ProjectRow key={p.id} project={p} onEdit={() => setEditing(p)} />
          ))}
          {projects.length === 0 && (
            <button
              onClick={() => setCreateOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary transition hover:bg-violet-50"
            >
              <Plus size={15} />
              เพิ่ม project แรก
            </button>
          )}
        </div>
      </nav>

      {/* User */}
      <div className="relative border-t border-border p-3">
        {menuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 animate-in rounded-lg border border-border bg-white p-1 shadow-lg">
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={15} />
                ออกจากระบบ
              </button>
            </form>
          </div>
        )}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-slate-100"
        >
          <Avatar profile={profile} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {profile.full_name ?? "ผู้ใช้"}
            </p>
            <p className="truncate text-xs capitalize text-slate-400">
              {profile.role}
            </p>
          </div>
          <ChevronDown
            size={16}
            className={cn("text-slate-400 transition", menuOpen && "rotate-180")}
          />
        </button>
      </div>

      {/* create */}
      <ProjectModal
        key="new"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      {/* edit (remount per project ด้วย key เพื่อ prefill ค่าใหม่) */}
      <ProjectModal
        key={editing?.id ?? "edit"}
        open={Boolean(editing)}
        project={editing}
        onClose={() => setEditing(null)}
      />
    </aside>
  );
}

function ProjectRow({
  project,
  onEdit,
}: {
  project: Project;
  onEdit: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menu, setMenu] = useState(false);
  const [pending, start] = useTransition();
  const active = searchParams.get("project") === project.id;

  function remove() {
    setMenu(false);
    if (
      !confirm(
        `ลบ project "${project.name}"?\nงาน (ticket) ทั้งหมดใน project นี้จะถูกลบด้วย ย้อนกลับไม่ได้`,
      )
    )
      return;
    start(async () => {
      await deleteProject(project.id);
      if (active) router.push("/board");
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
        active ? "bg-violet-50 text-primary" : "text-slate-600 hover:bg-slate-100",
        pending && "opacity-50",
      )}
    >
      <Link
        href={`/board?project=${project.id}`}
        className="flex min-w-0 flex-1 items-center gap-2.5"
      >
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-sm"
          style={{ backgroundColor: project.color }}
        />
        <span className="truncate">{project.name}</span>
      </Link>

      {/* key (ซ่อนตอน hover เพื่อโชว์ปุ่มเมนู) */}
      <span className="flex items-center gap-0.5 text-[11px] text-slate-400 group-hover:hidden">
        <Hash size={11} />
        {project.key}
      </span>

      <button
        onClick={(e) => {
          e.preventDefault();
          setMenu((m) => !m);
        }}
        className="hidden h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-white hover:text-slate-700 group-hover:flex"
      >
        <MoreHorizontal size={15} />
      </button>

      {menu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.preventDefault();
              setMenu(false);
            }}
          />
          <div className="absolute right-2 top-9 z-20 w-32 animate-in overflow-hidden rounded-lg border border-border bg-white py-1 shadow-lg">
            <button
              onClick={(e) => {
                e.preventDefault();
                setMenu(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
            >
              <Pencil size={14} />
              แก้ไข
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                remove();
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={14} />
              ลบ
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  active,
  children,
}: {
  href: string;
  icon: React.ElementType;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-violet-50 text-primary"
          : "text-slate-600 hover:bg-slate-100",
      )}
    >
      <Icon size={18} />
      {children}
    </Link>
  );
}
