import axios from 'axios';
import type { Comment } from '../types/task';
import config from '../config';

const commentsApi = axios.create({
  baseURL: config.commentServiceUrl,
  timeout: config.timeout,
  headers: config.headers,
});

commentsApi.interceptors.response.use(
  response => response,
  error => {
    console.error('Comments API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    });
    return Promise.reject(error);
  },
);

export const getComments = async (
  taskId: number,
): Promise<{ data: Comment[] }> => {
  const response = await commentsApi.get(`/tasks/${taskId}/comments`);
  return response;
};

export const createComment = async (
  taskId: number,
  content: string,
): Promise<{ data: Comment }> => {
  console.log(config.commentServiceUrl);
  const response = await commentsApi.post('/comments', {
    content,
    task_id: taskId,
  });
  return response;
};

export const updateComment = async (
  id: number,
  content: string,
): Promise<{ data: Comment }> => {
  const response = await commentsApi.put(`/comments/${id}`, { content });
  return response;
};

export const deleteComment = async (id: number): Promise<void> => {
  await commentsApi.delete(`/comments/${id}`);
};
