# frozen_string_literal: true

class CommentChannel < ApplicationCable::Channel
  def subscribed
    # Subscribe to a stream for a specific task
    stream_from "task_#{params[:task_id]}" if params[:task_id]
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    stop_all_streams
  end
end
