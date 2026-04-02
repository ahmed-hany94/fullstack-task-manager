import axios, { AxiosError, type AxiosInstance } from 'axios';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    this.api = axios.create({
      baseURL: apiUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        console.error('API Error:', error.message);
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Data:', error.response.data);
        }
        return Promise.reject(error);
      },
    );
  }

  async getTasks() {
    const response = await this.api.get('/tasks');
    return response.data;
  }

  async getTask(id: number) {
    const response = await this.api.get(`/tasks/${id}`);
    return response.data;
  }

  async createTask(title: string, status: string = 'pending') {
    const response = await this.api.post('/tasks', { title, status });
    return response.data;
  }

  async updateTask(id: number, title?: string, status?: string) {
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (status !== undefined) updateData.status = status;

    const response = await this.api.put(`/tasks/${id}`, updateData);
    return response.data;
  }

  async deleteTask(id: number) {
    await this.api.delete(`/tasks/${id}`);
  }
}

export default new ApiService();
