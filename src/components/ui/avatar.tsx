import { initials, cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const palette = [
  "bg-[#1e2a78]", // Deep Indigo
  "bg-[#4b8ef5]", // sky blue
  "bg-[#5de2b7]", // Mint Glow
  "bg-[#ff5a5f]", // AI Coral
  "bg-amber-500",
  "bg-[#6366f1]", // indigo
  "bg-teal-500",
];

function colorFor(id?: string | null) {
  if (!id) return "bg-slate-400";
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return palette[sum % palette.length];
}

export function Avatar({
  profile,
  size = 28,
  className,
}: {
  profile?: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
  size?: number;
  className?: string;
}) {
  const dim = { width: size, height: size, fontSize: size * 0.4 };

  if (profile?.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={profile.avatar_url}
        alt={profile.full_name ?? ""}
        style={dim}
        className={cn("rounded-full object-cover ring-2 ring-white", className)}
      />
    );
  }

  return (
    <span
      style={dim}
      title={profile?.full_name ?? "Unassigned"}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-white select-none",
        colorFor(profile?.id),
        className,
      )}
    >
      {initials(profile?.full_name)}
    </span>
  );
}
