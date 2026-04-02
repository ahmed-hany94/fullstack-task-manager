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
      render json: comment, status: :created
    else
      render json: { errors: comment.errors.full_messages }, status: :unprocessable_content
    end
  end

  # PATCH/PUT /comments/:id - Update a comment
  def update
    comment = Comment.find(params[:id])
    if comment.update(comment_params)
      render json: comment
    else
      render json: { errors: comment.errors.full_messages }, status: :unprocessable_content
    end
  end

  # DELETE /comments/:id - Delete a comment
  def destroy
    comment = Comment.find(params[:id])
    comment.destroy!
    head :no_content
  end

  private

  def comment_params
    params.require(:comment).permit(:content, :task_id)
  end
end
