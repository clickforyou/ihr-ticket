import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/app/login/page";

export default function SignupPage() {
  return (
    <AuthShell
      title="สร้างบัญชีใหม่"
      subtitle="เริ่มต้นจัดการ ticket ของทีม dev"
    >
      <AuthForm mode="signup" />
      <p className="mt-6 text-center text-sm text-muted">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </AuthShell>
  );
}
