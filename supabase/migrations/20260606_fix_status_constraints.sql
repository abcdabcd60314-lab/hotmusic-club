-- Fix: 社員狀態 constraint 加入「待審核」
ALTER TABLE "社員" DROP CONSTRAINT IF EXISTS "社員_狀態_check";
ALTER TABLE "社員" ADD CONSTRAINT "社員_狀態_check"
  CHECK ("狀態" IN ('在籍', '離社', '待審核'));

-- Fix: 場地預約狀態 constraint 加入「待確認」
ALTER TABLE "場地預約" DROP CONSTRAINT IF EXISTS "場地預約_狀態_check";
ALTER TABLE "場地預約" ADD CONSTRAINT "場地預約_狀態_check"
  CHECK ("狀態" IN ('待確認', '已確認', '已取消'));
