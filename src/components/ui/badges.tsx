import { cn } from "@/lib/utils";
import { PRIORITIES, type TicketPriority, type Label } from "@/lib/types";
import { AlertTriangle, ChevronsUp, Minus, ChevronDown } from "lucide-react";

const priorityIcon = {
  urgent: AlertTriangle,
  high: ChevronsUp,
  medium: Minus,
  low: ChevronDown,
} as const;

export function PriorityBadge({
  priority,
  showLabel = true,
}: {
  priority: TicketPriority;
  showLabel?: boolean;
}) {
  const p = PRIORITIES.find((x) => x.value === priority)!;
  const Icon = priorityIcon[priority];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", p.color)}>
      <Icon size={14} strokeWidth={2.5} />
      {showLabel && p.label}
    </span>
  );
}

export function LabelChip({ label }: { label: Label }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{
        backgroundColor: `${label.color}1a`,
        color: label.color,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: label.color }}
      />
      {label.name}
    </span>
  );
}
