import { useState, useEffect, useCallback } from 'react';
import type { Task } from '../types/task';
import api from '../services/api';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTasks();
      setTasks(data || []);
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (title: string) => {
    try {
      setError(null);
      const newTask = await api.createTask(title);
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (err) {
      setError('Failed to create task');
      throw err;
    }
  }, []);

  const updateTask = useCallback(
    async (id: number, title?: string, status?: string) => {
      try {
        setError(null);
        const updatedTask = await api.updateTask(id, title, status);
        setTasks(prev =>
          prev.map(task => (task.id === id ? updatedTask : task)),
        );
        return updatedTask;
      } catch (err) {
        setError('Failed to update task');
        throw err;
      }
    },
    [],
  );

  const deleteTask = useCallback(async (id: number) => {
    try {
      setError(null);
      await api.deleteTask(id);
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      setError('Failed to delete task');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks: fetchTasks,
  };
}
