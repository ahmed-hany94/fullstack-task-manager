ALTER TABLE tasks 
ADD COLUMN user_id INTEGER DEFAULT 1;

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
