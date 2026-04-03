import { useEffect, useState, useRef } from 'react';
import type { Task, Comment } from '../types/task';
import {
  getComments,
  createComment,
  deleteComment,
} from '../services/commentApi';
import webSocketService from '../services/websocket';

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
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  const isCommentsOpenRef = useRef(false);

  useEffect(() => {
    const fetchInitialCount = async () => {
      try {
        const res = await getComments(task.id);
        setCommentCount(res.data.length);
      } catch (error) {
        console.error('Failed to fetch comment count:', error);
      }
    };
    fetchInitialCount();
  }, [task.id]);

  useEffect(() => {
    if (showComments) {
      isCommentsOpenRef.current = true;
      const fetchComments = async () => {
        try {
          const res = await getComments(task.id);
          setComments(res.data);
          setCommentCount(res.data.length);
        } catch (error) {
          console.error('Failed to fetch comments:', error);
        }
      };
      fetchComments();
    } else {
      isCommentsOpenRef.current = false;
    }
  }, [showComments, task.id]);

  useEffect(() => {
    webSocketService.subscribeToTask(task.id, message => {
      console.log('WebSocket message received:', message);

      switch (message.type) {
        case 'NEW_COMMENT':
          setCommentCount(prev => prev + 1);

          if (isCommentsOpenRef.current && message.comment) {
            setComments(prev => {
              if (prev.some(c => c.id === message.comment!.id)) {
                return prev;
              }
              return [...prev, message.comment!];
            });
          }
          break;

        case 'DELETE_COMMENT':
          setCommentCount(prev => prev - 1);

          if (isCommentsOpenRef.current && message.comment_id) {
            setComments(prev => prev.filter(c => c.id !== message.comment_id));
          }
          break;

        case 'UPDATE_COMMENT':
          if (isCommentsOpenRef.current && message.comment) {
            setComments(prev =>
              prev.map(c =>
                c.id === message.comment!.id ? message.comment! : c,
              ),
            );
          }
          break;
      }
    });

    return () => {
      webSocketService.unsubscribeFromTask(task.id);
    };
  }, [task.id]);

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

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsAddingComment(true);
    try {
      const tempId = Date.now();
      const optimisticComment = {
        id: tempId,
        content: newComment,
        task_id: task.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isCommentsOpenRef.current) {
        setComments(prev => [...prev, optimisticComment]);
      }
      setCommentCount(prev => prev + 1);

      await createComment(task.id, newComment);
      setNewComment('');

    } catch (error) {
      console.error('Failed to add comment:', error);
      if (isCommentsOpenRef.current) {
        const res = await getComments(task.id);
        setComments(res.data);
      }
      const res = await getComments(task.id);
      setCommentCount(res.data.length);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Delete this comment?')) return;

    try {
      if (isCommentsOpenRef.current) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
      setCommentCount(prev => prev - 1);

      await deleteComment(commentId);

    } catch (error) {
      console.error('Failed to delete comment:', error);
      if (isCommentsOpenRef.current) {
        const res = await getComments(task.id);
        setComments(res.data);
      }
      const res = await getComments(task.id);
      setCommentCount(res.data.length);
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

            <button
              onClick={() => setShowComments(!showComments)}
              style={{
                marginLeft: 'auto',
                padding: '4px 12px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {showComments
                ? 'Hide Comments'
                : `Show Comments (${commentCount})`}
            </button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div
              style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid #e0e0e0',
              }}
            >
              <h4
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '14px',
                  color: '#666',
                }}
              >
                Comments
              </h4>

              {/* Comments List */}
              <div
                style={{
                  marginBottom: '12px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {comments.length === 0 ? (
                  <p
                    style={{
                      color: '#999',
                      fontSize: '12px',
                      textAlign: 'center',
                    }}
                  >
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map(comment => (
                    <div
                      key={comment.id}
                      style={{
                        backgroundColor: '#f9f9f9',
                        padding: '8px',
                        borderRadius: '4px',
                        marginBottom: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '14px', flex: 1 }}>
                        {comment.content}
                      </p>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        style={{
                          backgroundColor: '#ff4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          padding: '2px 8px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          marginLeft: '8px',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                  placeholder="Write a comment..."
                  disabled={isAddingComment}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleAddComment}
                  disabled={isAddingComment || !newComment.trim()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  {isAddingComment ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          )}
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
