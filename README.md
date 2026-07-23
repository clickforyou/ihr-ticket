# iHR Ticket

ระบบติดตามงาน (ticket) สำหรับทีม dev — จัดงานตาม **project**, กำหนด **ความสำคัญ (priority)**,
**แนบรูป**, มอบหมายงาน (assignee), ป้ายกำกับ (label), กำหนดเสร็จ (due date),
คอมเมนต์ และ activity log — แสดงผลแบบ **Kanban board** สลับ **List** ได้

**Stack:** Next.js 16 (App Router) · Supabase (Auth + Postgres + Storage) · Tailwind CSS v4 · deploy บน Vercel

---

## 1. ตั้งค่า Supabase

1. สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com) → เลือก region ใกล้ไทย (Singapore)
2. ไปที่ **SQL Editor** → **New query** → วางเนื้อหาไฟล์ [`supabase/schema.sql`](supabase/schema.sql) ทั้งหมด → **Run**
   - สร้างตาราง, RLS, trigger สร้าง profile อัตโนมัติ, storage bucket `ticket-attachments`, และ seed project/label ตัวอย่าง
   - รันซ้ำได้ปลอดภัย (idempotent)
3. (แนะนำสำหรับทีมภายใน) ปิดการยืนยันอีเมล เพื่อให้สมัครแล้วเข้าใช้ได้ทันที:
   **Authentication → Sign In / Providers → Email → ปิด "Confirm email"**
4. คัดลอกค่าจาก **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. รันในเครื่อง

```bash
# ใส่ค่าจริงลงใน .env.local (ดูตัวอย่างใน .env.local.example)
npm install
npm run dev
```

เปิด http://localhost:3000 → สมัครสมาชิก → เริ่มสร้าง ticket ได้เลย

## 3. Deploy ขึ้น Vercel

1. push โค้ดขึ้น GitHub
2. [vercel.com/new](https://vercel.com/new) → Import repo (Vercel ตรวจจับ Next.js อัตโนมัติ)
3. ใส่ Environment Variables ทั้งสองตัว (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy

> หรือใช้ CLI: `npx vercel` แล้ว `npx vercel --prod`

## โครงสร้าง

```
src/
  app/
    (app)/                 # กลุ่มหน้าที่ต้องล็อกอิน (มี sidebar)
      board/               # บอร์ดหลัก (Kanban + List) + server actions
      tickets/[id]/        # หน้ารายละเอียด ticket
    login/  signup/        # หน้า auth + server actions
  components/              # UI, board, ticket, sidebar
  lib/supabase/            # client / server / proxy (middleware)
  lib/storage.ts           # อัปโหลด/URL รูปแนบ
supabase/schema.sql        # สคีมา + RLS + storage
```

## หมายเหตุความปลอดภัย

- RLS ใช้โมเดล **ทีมภายใน**: ผู้ที่ล็อกอินแล้วเข้าถึง ticket ทั้งหมดได้ (แก้ profile ได้เฉพาะของตัวเอง)
  ถ้าต้องการจำกัดสิทธิ์ต่อ project ให้ปรับ policy ใน `schema.sql`
- bucket `ticket-attachments` เปิด public-read (เพื่อแสดงรูปง่าย) — ถ้าต้องการปิด ให้เปลี่ยนเป็น private + signed URL
