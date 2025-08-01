import { UserPlus, Users } from 'lucide-react';
import './UserCard.css';

interface User {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  follower_count: number;
  following_count: number;
  created_at: string;
}

interface UserCardProps {
  user: User;
}

export const UserCard = ({ user }: UserCardProps) => {
  return (
    <div className="user-card">
      <div className="user-card-header">
        <div className="avatar-wrapper">
          <img
            src={user.avatar_url}
            alt={user.username}
            className="avatar-img"
          />
          <div className="avatar-icon">
            <Users className="icon-inner" />
          </div>
        </div>

        <div className="user-info">
          <div className="user-info-header">
            <div className="user-names">
              <h3 className="display-name">{user.display_name}</h3>
              <p className="username">@{user.username}</p>
            </div>
            <button className="follow-button">
              <UserPlus className="follow-icon" />
              Follow
            </button>
          </div>

          {user.bio && <p className="user-bio">{user.bio}</p>}

          <div className="follow-stats">
            <div className="stat">
              <span className="stat-count">{user.follower_count.toLocaleString()}</span>
              <span className="stat-label">followers</span>
            </div>
            <div className="stat">
              <span className="stat-count">{user.following_count.toLocaleString()}</span>
              <span className="stat-label">following</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
