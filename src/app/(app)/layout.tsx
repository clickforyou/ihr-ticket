import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import type { Profile, Project } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .eq("id", user.id)
    .single();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, key, description, color, created_at")
    .order("created_at", { ascending: true });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        profile={(profile as Profile) ?? { id: user.id, full_name: user.email ?? null, avatar_url: null, role: "member" }}
        projects={(projects as Project[]) ?? []}
      />
      <main className="flex-1 overflow-hidden bg-background">{children}</main>
    </div>
  );
}
