export interface Task {
  id: number;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at?: string;
  updated_at?: string;
}

export interface CreateTaskInput {
  title: string;
  status?: Task['status'];
}

export interface UpdateTaskInput {
  title?: string;
  status?: Task['status'];
}

export interface Comment {
  id: number;
  content: string;
  task_id: number;
  created_at: string;
  updated_at: string;
}
