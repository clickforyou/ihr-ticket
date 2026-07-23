"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { logout } from "@/app/login/actions";
import { cn } from "@/lib/utils";
import type { Profile, Project } from "@/lib/types";
import { LayoutDashboard, Ticket, LogOut, ChevronDown, Hash } from "lucide-react";

export function Sidebar({
  profile,
  projects,
}: {
  profile: Profile;
  projects: Project[];
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

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

        <p className="mt-6 mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Projects
        </p>
        <div className="space-y-0.5">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/board?project=${p.id}`}
              className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: p.color }}
              />
              <span className="truncate">{p.name}</span>
              <span className="ml-auto flex items-center gap-0.5 text-[11px] text-slate-400">
                <Hash size={11} />
                {p.key}
              </span>
            </Link>
          ))}
          {projects.length === 0 && (
            <p className="px-3 py-2 text-sm text-slate-400">ยังไม่มี project</p>
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
    </aside>
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
