CREATE TYPE ticket_status AS ENUM ('待处理', '已完成', '已拒绝');
CREATE TYPE severity AS ENUM ('轻微', '一般', '严重', '紧急');
CREATE TYPE specialty_type AS ENUM ('建筑设计专业', '结构专业', '给排水专业');

CREATE TABLE tickets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  status ticket_status NOT NULL DEFAULT '待处理',
  severity severity NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  creator_id UUID NOT NULL REFERENCES profiles(id),
  project_id BIGINT NOT NULL REFERENCES projects(id),
  assignee_id UUID NOT NULL REFERENCES profiles(id),
  specialty_type specialty_type NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  detail TEXT NOT NULL DEFAULT '',
  root_cause TEXT NOT NULL DEFAULT '',
  prevention TEXT NOT NULL DEFAULT '',
  knowledge_base BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Authenticated users can insert tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "No direct delete on tickets"
  ON tickets FOR DELETE
  TO authenticated
  USING (false);
