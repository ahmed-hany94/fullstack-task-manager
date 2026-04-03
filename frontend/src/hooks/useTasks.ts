import { useState, useEffect, useCallback } from 'react';
import type { Task } from '../types/task';
import api from '../services/api';
import { getComments } from '../services/commentApi';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Map<number, number>>(
    new Map(),
  );

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTasks();
      setTasks(data || []);

      const counts = new Map<number, number>();
      for (const task of data || []) {
        try {
          const res = await getComments(task.id);
          counts.set(task.id, res.data.length);
        } catch (err) {
          console.error(`Failed to fetch comments for task ${task.id}:`, err);
          counts.set(task.id, 0);
        }
      }
      setCommentCounts(counts);
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

  const updateCommentCount = useCallback((taskId: number, newCount: number) => {
    setCommentCounts(prev => new Map(prev).set(taskId, newCount));
  }, []);

  const refreshCommentCount = useCallback(async (taskId: number) => {
    try {
      const res = await getComments(taskId);
      setCommentCounts(prev => new Map(prev).set(taskId, res.data.length));
    } catch (err) {
      console.error('Failed to refresh comment count:', err);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    commentCounts,
    updateCommentCount,
    refreshCommentCount,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks: fetchTasks,
  };
}
