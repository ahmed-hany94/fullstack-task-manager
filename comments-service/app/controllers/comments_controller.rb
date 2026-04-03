# frozen_string_literal: true

class CommentsController < ApplicationController
  # GET /tasks/:task_id/comments - List all comments for a task
  def index
    comments = Comment.where(task_id: params[:task_id])
    render json: comments
  end

  # GET /comments/:id - Show a single comment
  def show
    comment = Comment.find(params[:id])
    render json: comment
  end

  # POST /comments - Create a new comment
  def create
    comment = Comment.new(comment_params)
    if comment.save
      # Broadcast the new comment to all subscribers of this task
      # CommentChannel.broadcast_to(
      #   "task_#{comment.task_id}",
      #   {
      #     type: 'NEW_COMMENT',
      #     comment: comment.as_json(only: %i[id content task_id created_at])
      #   }
      # )
      ActionCable.server.broadcast(
        "task_#{comment.task_id}", # This matches exactly what channel is streaming
        {
          type: 'NEW_COMMENT',
          comment: comment.as_json(only: %i[id content task_id created_at])
        }
      )
      render json: comment, status: :created
    else
      render json: { errors: comment.errors.full_messages }, status: :unprocessable_content
    end
  end

  # PATCH/PUT /comments/:id - Update a comment
  def update
    comment = Comment.find(params[:id])
    if comment.update(comment_params)
      # Broadcast update
      # CommentChannel.broadcast_to(
      #   "task_#{comment.task_id}",
      #   {
      #     type: 'UPDATE_COMMENT',
      #     comment: comment.as_json(only: %i[id content task_id updated_at])
      #   }
      # )
      ActionCable.server.broadcast(
        "task_#{comment.task_id}",
        {
          type: 'UPDATE_COMMENT',
          comment: comment.as_json(only: %i[id content task_id updated_at])
        }
      )
      render json: comment
    else
      render json: { errors: comment.errors.full_messages }, status: :unprocessable_content
    end
  end

  # DELETE /comments/:id - Delete a comment
  def destroy
    comment = Comment.find(params[:id])
    task_id = comment.task_id

    comment.destroy!

    # Broadcast deletion
    # CommentChannel.broadcast_to(
    #   "task_#{task_id}",
    #   {
    #     type: 'DELETE_COMMENT',
    #     comment_id: params[:id].to_i
    #   }
    # )
    ActionCable.server.broadcast(
      "task_#{task_id}",
      {
        type: 'DELETE_COMMENT',
        comment_id: params[:id].to_i
      }
    )

    head :no_content
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Comment not found' }, status: :not_found
  rescue ActiveRecord::RecordNotDestroyed
    render json: { errors: comment.errors.full_messages }, status: :unprocessable_content
  end

  private

  def comment_params
    params.require(:comment).permit(:content, :task_id)
  end
end
