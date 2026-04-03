import { createConsumer } from '@rails/actioncable';
import type { Comment } from '../types/task';

type WebSocketMessage = {
  type: 'NEW_COMMENT' | 'UPDATE_COMMENT' | 'DELETE_COMMENT';
  comment?: Comment;
  comment_id?: number;
};

class WebSocketService {
  private consumer: any = null;
  private subscriptions: Map<number, any> = new Map();
  private callbacks: Map<number, (message: WebSocketMessage) => void> =
    new Map();

  connect() {
    if (this.consumer) return;

    this.consumer = createConsumer('ws://localhost:3001/cable');
    console.log('WebSocket connected');
  }

  subscribeToTask(
    taskId: number,
    onMessage: (message: WebSocketMessage) => void,
  ) {
    if (!this.consumer) {
      this.connect();
    }

    if (this.subscriptions.has(taskId)) {
      this.unsubscribeFromTask(taskId);
    }

    this.callbacks.set(taskId, onMessage);

    const subscription = this.consumer.subscriptions.create(
      { channel: 'CommentChannel', task_id: taskId },
      {
        connected: () => {
          console.log(`Connected to task ${taskId} comments channel`);
        },
        disconnected: () => {
          console.log(`Disconnected from task ${taskId} comments channel`);
        },
        received: (data: WebSocketMessage) => {
          const callback = this.callbacks.get(taskId);
          if (callback) {
            callback(data);
          }
        },
      },
    );

    this.subscriptions.set(taskId, subscription);
  }

  unsubscribeFromTask(taskId: number) {
    const subscription = this.subscriptions.get(taskId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(taskId);
      this.callbacks.delete(taskId);
    }
  }

  disconnect() {
    this.subscriptions.forEach((_, taskId) => {
      this.unsubscribeFromTask(taskId);
    });

    if (this.consumer) {
      this.consumer.disconnect();
      this.consumer = null;
    }
  }
}

export default new WebSocketService();
