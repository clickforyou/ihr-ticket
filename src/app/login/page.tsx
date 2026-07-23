import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Ticket } from "lucide-react";

export default function LoginPage() {
  return (
    <AuthShell
      title="ยินดีต้อนรับกลับ"
      subtitle="เข้าสู่ระบบเพื่อจัดการงานของทีม"
    >
      <AuthForm mode="login" />
      <p className="mt-6 text-center text-sm text-muted">
        ยังไม่มีบัญชี?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          สมัครสมาชิก
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left: brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-2 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
            <Ticket size={20} />
          </div>
          <span className="text-lg font-bold tracking-tight">iHR Ticket</span>
        </div>
        <div className="text-white">
          <h2 className="max-w-sm text-3xl font-bold leading-tight">
            ติดตามงาน dev ทุก project ได้ในที่เดียว
          </h2>
          <p className="mt-3 max-w-sm text-violet-100">
            จัดลำดับความสำคัญ แนบรูป มอบหมายงาน และดูความคืบหน้าแบบ Kanban
          </p>
        </div>
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Right: form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm animate-in">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
              <Ticket size={20} />
            </div>
            <span className="text-lg font-bold">iHR Ticket</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1.5 mb-8 text-muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
