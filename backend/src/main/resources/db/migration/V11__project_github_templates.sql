ALTER TABLE projects ADD COLUMN github_template_repo VARCHAR(255), ADD COLUMN github_repo_mode VARCHAR(20) NOT NULL DEFAULT 'TEMPLATE';
ALTER TABLE github_pull_requests ADD COLUMN commits_json TEXT NOT NULL DEFAULT '[]';
