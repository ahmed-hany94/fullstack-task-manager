import { useEffect } from 'react';
import { LoadingSpinner } from './components/LoadingSpinner';
import { TaskCard } from './components/TaskCard';
import { TaskForm } from './components/TaskForm';
import config from './config';
import { useTasks } from './hooks/useTasks';
import webSocketService from './services/websocket';

function App() {
  const {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks,
  } = useTasks();

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  if (config.enableDebugMode) {
    console.log('App running with config:', config);
  }

  useEffect(() => {
    webSocketService.connect();

    return () => {
      webSocketService.disconnect();
    };
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h1 style={{ margin: '0 0 8px 0', color: '#333' }}>
            📝 Task Manager
          </h1>
          <p style={{ margin: 0, color: '#666' }}>
            Manage your tasks efficiently
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}
            >
              {stats.total}
            </div>
            <div style={{ color: '#666' }}>Total Tasks</div>
          </div>
          <div
            style={{
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFC107' }}
            >
              {stats.pending}
            </div>
            <div style={{ color: '#666' }}>Pending</div>
          </div>
          <div
            style={{
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}
            >
              {stats.completed}
            </div>
            <div style={{ color: '#666' }}>Completed</div>
          </div>
        </div>

        <TaskForm onCreateTask={createTask} />

        {error && (
          <div
            style={{
              backgroundColor: '#ffebee',
              color: '#c62828',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            ⚠️ {error}
            <button
              onClick={refreshTasks}
              style={{
                marginLeft: '12px',
                padding: '4px 12px',
                backgroundColor: '#c62828',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : tasks.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '8px',
              color: '#999',
            }}
          >
            ✨ No tasks yet. Create your first task above!
          </div>
        ) : (
          <div>
            <h3 style={{ marginBottom: '16px', color: '#555' }}>
              Your Tasks ({tasks.length})
            </h3>
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={updateTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
