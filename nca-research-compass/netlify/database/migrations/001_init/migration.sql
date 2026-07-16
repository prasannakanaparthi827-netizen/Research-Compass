-- NCA Research Compass initial schema

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  college TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE problem_statements (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  statement TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'custom', -- 'library' or 'custom'
  current_stage INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress' or 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- One row per research stage per project, storing the generated + edited content
CREATE TABLE project_stages (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL,
  stage_key TEXT NOT NULL,
  content TEXT,
  generated BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, stage_number)
);

CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_stages_project ON project_stages(project_id);
