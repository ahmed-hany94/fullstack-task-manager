import React, { useState } from 'react';

interface TaskFormProps {
  onCreateTask: (title: string) => Promise<void>;
}

export function TaskForm({ onCreateTask }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsCreating(true);
    try {
      await onCreateTask(title);
      setTitle('');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Enter a new task..."
          disabled={isCreating}
          style={{
            flex: 1,
            padding: '12px',
            fontSize: '16px',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            outline: 'none',
            transition: 'border-color 0.3s',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#4CAF50')}
          onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')}
        />
        <button
          type="submit"
          disabled={isCreating || !title.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background-color 0.3s',
          }}
        >
          {isCreating ? 'Adding...' : 'Add Task'}
        </button>
      </div>
    </form>
  );
}
