# frozen_string_literal: true

module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
      logger.add_tags 'ActionCable', current_user
    end

    private

    def find_verified_user
      GuestUser.new
    end
  end

  class GuestUser
    def to_s
      'Guest'
    end
  end
end
