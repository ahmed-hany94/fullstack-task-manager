import { useState } from 'react';
import type { Task } from '../types/task';

interface TaskCardProps {
  task: Task;
  onUpdate: (id: number, title?: string, status?: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const statusColors = {
  pending: '🟡',
  in_progress: '🔵',
  completed: '✅',
};

const statusOptions: Task['status'][] = ['pending', 'in_progress', 'completed'];

export function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: Task['status']) => {
    setIsUpdating(true);
    try {
      await onUpdate(task.id, undefined, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (editTitle.trim() === task.title) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate(task.id, editTitle);
      setIsEditing(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Delete task "${task.title}"?`)) {
      setIsUpdating(true);
      try {
        await onDelete(task.id);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <div
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        opacity: isUpdating ? 0.6 : 1,
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
        }}
      >
        <div style={{ flex: 1 }}>
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={handleUpdateTitle}
              onKeyPress={e => e.key === 'Enter' && handleUpdateTitle()}
              autoFocus
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '16px',
                border: '1px solid #4CAF50',
                borderRadius: '4px',
              }}
            />
          ) : (
            <h3
              style={{ margin: '0 0 8px 0', cursor: 'pointer' }}
              onClick={() => setIsEditing(true)}
            >
              {task.title}
            </h3>
          )}

          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              marginTop: '8px',
            }}
          >
            <span>Status:</span>
            <select
              value={task.status}
              onChange={e =>
                handleStatusChange(e.target.value as Task['status'])
              }
              disabled={isUpdating}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                cursor: 'pointer',
              }}
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {statusColors[status]} {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={isUpdating}
          style={{
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 12px',
            cursor: 'pointer',
            marginLeft: '12px',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
