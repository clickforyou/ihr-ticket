import { createClient } from "@/lib/supabase/server";
import { STATUSES, PRIORITIES, type Project } from "@/lib/types";
import {
  LayoutList,
  Loader,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Row = {
  status: string;
  priority: string;
  project_id: string;
  due_date: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  todo: "#94a3b8",
  in_progress: "#4b8ef5",
  in_review: "#f59e0b",
  done: "#5de2b7",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#ef4444",
  high: "#fb923c",
  medium: "#fbbf24",
  low: "#94a3b8",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ data: rows }, { data: projects }] = await Promise.all([
    supabase.from("tickets").select("status, priority, project_id, due_date"),
    supabase
      .from("projects")
      .select("id, name, key, description, color, created_at")
      .order("created_at"),
  ]);

  const tickets = (rows as Row[]) ?? [];
  const projList = (projects as Project[]) ?? [];
  const today = new Date().toISOString().slice(0, 10);

  const total = tickets.length;
  const count = (fn: (t: Row) => boolean) => tickets.filter(fn).length;

  const byStatus = STATUSES.map((s) => ({
    label: s.label,
    value: count((t) => t.status === s.value),
    color: STATUS_COLORS[s.value],
  }));
  const byPriority = PRIORITIES.map((p) => ({
    label: p.label,
    value: count((t) => t.priority === p.value),
    color: PRIORITY_COLORS[p.value],
  }));
  const byProject = projList
    .map((p) => ({
      label: p.name,
      value: count((t) => t.project_id === p.id),
      color: p.color,
    }))
    .sort((a, b) => b.value - a.value);

  const doneCount = count((t) => t.status === "done");
  const inProgressCount = count((t) => t.status === "in_progress");
  const overdueCount = count(
    (t) => !!t.due_date && t.due_date < today && t.status !== "done",
  );

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">แดชบอร์ด</h1>
          <p className="mt-1 text-sm text-muted">ภาพรวมงานทั้งหมดในระบบ</p>
        </header>

        {/* stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={LayoutList}
            label="งานทั้งหมด"
            value={total}
            tint="text-primary"
            bg="bg-primary-soft"
          />
          <StatCard
            icon={Loader}
            label="กำลังทำ"
            value={inProgressCount}
            tint="text-[#4b8ef5]"
            bg="bg-[#4b8ef5]/10"
          />
          <StatCard
            icon={CheckCircle2}
            label="เสร็จแล้ว"
            value={doneCount}
            tint="text-[#12b886]"
            bg="bg-[#5de2b7]/15"
          />
          <StatCard
            icon={AlertTriangle}
            label="เกินกำหนด"
            value={overdueCount}
            tint="text-red-500"
            bg="bg-red-500/10"
          />
        </div>

        {total === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface py-20 text-center text-sm text-muted">
            ยังไม่มีงานในระบบ — สร้างงานแรกที่หน้า “บอร์ดงาน”
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <Card title="แยกตามสถานะ">
                <div className="flex items-center gap-6">
                  <Donut segments={byStatus} total={total} />
                  <Legend segments={byStatus} total={total} />
                </div>
              </Card>
              <Card title="แยกตามความสำคัญ">
                <BarList segments={byPriority} total={total} />
              </Card>
            </div>

            <div className="mt-4">
              <Card title="แยกตาม Project">
                <BarList segments={byProject} total={total} />
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- presentational ---------- */

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tint: string;
  bg: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${bg}`}>
        <Icon size={18} className={tint} />
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

type Seg = { label: string; value: number; color: string };

function Donut({ segments, total }: { segments: Seg[]; total: number }) {
  const active = segments.filter((s) => s.value > 0);
  let acc = 0;
  const stops = active
    .map((s) => {
      const from = (acc / total) * 100;
      acc += s.value;
      const to = (acc / total) * 100;
      return `${s.color} ${from}% ${to}%`;
    })
    .join(", ");

  return (
    <div
      className="relative h-32 w-32 shrink-0 rounded-full"
      style={{ background: `conic-gradient(${stops})` }}
    >
      <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-surface">
        <span className="text-xl font-bold leading-none">{total}</span>
        <span className="text-[10px] text-muted">งาน</span>
      </div>
    </div>
  );
}

function Legend({ segments, total }: { segments: Seg[]; total: number }) {
  return (
    <ul className="flex-1 space-y-2">
      {segments.map((s) => (
        <li key={s.label} className="flex items-center gap-2 text-sm">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: s.color }}
          />
          <span className="text-muted">{s.label}</span>
          <span className="ml-auto font-medium tabular-nums">{s.value}</span>
          <span className="w-10 text-right text-xs text-muted tabular-nums">
            {total ? Math.round((s.value / total) * 100) : 0}%
          </span>
        </li>
      ))}
    </ul>
  );
}

function BarList({ segments, total }: { segments: Seg[]; total: number }) {
  const max = Math.max(1, ...segments.map((s) => s.value));
  return (
    <div className="space-y-3">
      {segments.map((s) => (
        <div key={s.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate text-muted">{s.label}</span>
            <span className="font-medium tabular-nums">{s.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(s.value / max) * 100}%`,
                backgroundColor: s.color,
              }}
            />
          </div>
        </div>
      ))}
      {segments.length === 0 && (
        <p className="text-sm text-muted">ยังไม่มีข้อมูล</p>
      )}
      <p className="pt-1 text-right text-[11px] text-muted">รวม {total} งาน</p>
    </div>
  );
}
