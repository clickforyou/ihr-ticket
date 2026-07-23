-- ลบ test user ที่ค้างจากการทดสอบ API (QA Bot / Dev Test)
-- ticket ตัวอย่างยังอยู่ครบ (reporter/assignee = แอดมิน ไม่กระทบ)
-- รันใน Supabase SQL Editor:
--   https://supabase.com/dashboard/project/wonxobhfpylveusfpkol/sql/new
-- การลบ auth.users จะ cascade ลบ profiles ให้อัตโนมัติ

delete from auth.users
where email like 'ihrticket.qa.%@gmail.com';

-- ตรวจผล: ควรเหลือแค่ผู้ใช้จริง
select email, created_at from auth.users order by created_at;
