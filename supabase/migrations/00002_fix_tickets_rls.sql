-- Fix RLS for tickets inserts.
-- 现象：线上 tickets 表拒绝 authenticated 用户 INSERT（42501），但 00001 里已声明
-- "Authenticated users can insert tickets" WITH CHECK (true)。这里幂等地重建所有
-- 业务端需要的 policy，以兜底修复。
-- 写入权限由后端 Next.js API 做角色校验，RLS 层只区分「已登录」。

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- SELECT：仅能读当前身份所在项目的工单
DROP POLICY IF EXISTS "Users can read tickets in their project" ON tickets;
CREATE POLICY "Users can read tickets in their project"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT ur.project_id
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
    )
  );

-- INSERT：任何已登录用户（后端 API 会做质检员角色校验）
DROP POLICY IF EXISTS "Authenticated users can insert tickets" ON tickets;
CREATE POLICY "Authenticated users can insert tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE：任何已登录用户（后端 API 会做创建人 / 责任人 / 管理员校验）
DROP POLICY IF EXISTS "Authenticated users can update tickets" ON tickets;
CREATE POLICY "Authenticated users can update tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE：禁止直写
DROP POLICY IF EXISTS "No direct delete on tickets" ON tickets;
CREATE POLICY "No direct delete on tickets"
  ON tickets FOR DELETE
  TO authenticated
  USING (false);
