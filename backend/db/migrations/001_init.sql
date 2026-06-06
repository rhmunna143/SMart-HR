-- Up Migration

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
CREATE TYPE user_role      AS ENUM ('ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER');
CREATE TYPE project_status AS ENUM ('ACTIVE', 'COMPLETED', 'ON_HOLD');
CREATE TYPE task_priority  AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE task_status    AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED');

-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'TEAM_MEMBER',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects
CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  deadline      DATE,
  status        project_status NOT NULL DEFAULT 'ACTIVE',
  created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

-- Project membership (many-to-many)
CREATE TABLE project_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  UNIQUE (project_id, user_id)
);

-- Tasks
CREATE TABLE tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  assignee_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date      DATE,
  priority      task_priority NOT NULL DEFAULT 'MEDIUM',
  status        task_status   NOT NULL DEFAULT 'TODO',
  created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_task_title_per_project
  ON tasks (project_id, lower(title))
  WHERE deleted_at IS NULL;

-- Comments
CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attachments
CREATE TABLE attachments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id        UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  filename       TEXT NOT NULL,
  mime_type      TEXT NOT NULL,
  size_bytes     BIGINT NOT NULL,
  data           BYTEA NOT NULL,
  uploaded_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity log
CREATE TABLE activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin-configurable application settings
CREATE TABLE app_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO app_settings (key, value)
VALUES ('team_member_project_visibility', '"ASSIGNED_ONLY"');

-- Indexes
CREATE INDEX idx_tasks_project    ON tasks (project_id);
CREATE INDEX idx_tasks_assignee   ON tasks (assignee_id);
CREATE INDEX idx_tasks_status     ON tasks (status);
CREATE INDEX idx_tasks_priority   ON tasks (priority);
CREATE INDEX idx_tasks_due_date   ON tasks (due_date);
CREATE INDEX idx_projects_status  ON projects (status);
CREATE INDEX idx_activity_created ON activity_logs (created_at DESC);
CREATE INDEX idx_notif_user_read  ON notifications (user_id, read);
CREATE INDEX idx_projects_active  ON projects (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_active     ON tasks (id)    WHERE deleted_at IS NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Down Migration

DROP TRIGGER IF EXISTS trg_tasks_updated ON tasks;
DROP TRIGGER IF EXISTS trg_projects_updated ON projects;
DROP FUNCTION IF EXISTS set_updated_at();
DROP TABLE IF EXISTS app_settings;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS project_members;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS task_status;
DROP TYPE IF EXISTS task_priority;
DROP TYPE IF EXISTS project_status;
DROP TYPE IF EXISTS user_role;
