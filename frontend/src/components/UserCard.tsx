import { useState } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { Link } from 'react-router-dom';
import './UserCard.css';
import { User } from '@/types/federation';
import { useSocialActions } from '@/hooks/use-social-actions';

interface UserCardProps {
  user: User;
}

export const UserCard = ({ user }: UserCardProps) => {
  const { followUser, unfollowUser } = useSocialActions();

  const [isCurrentlyFollowing, setIsCurrentlyFollowing] = useState(user.followedByMe);

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isCurrentlyFollowing) {
      await unfollowUser(user.id, user.username);
      setIsCurrentlyFollowing(false);
    } else {
      await followUser(user.id, user.username);
      setIsCurrentlyFollowing(true);
    }
  };

  return (
    <Link to={`/profile/${user.username.replace('@', '')}`} className="user-card-link">
      <div className="user-card">
        <div className="user-card-header">
          <div className="avatar-wrapper">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="avatar-img"
              />
            ) : (
              <div className="profile-post-avatar">
                {user.display_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="user-info">
            <div className="user-info-header">
              <div className="user-names">
                <h3 className="display-name">{user.display_name}</h3>
                <p className="username">
                  @{user.username.startsWith("@") && user.username.indexOf("@", 1) !== -1
                    ? user.username.slice(1).split("@")[0]
                    : user.username}
                </p>
              </div>
              
              <button
                onClick={handleFollow}
                className={`follow-button ${isCurrentlyFollowing ? 'following' : ''}`}
              >
                {isCurrentlyFollowing ? (
                  <>
                    <UserMinus className="follow-icon" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="follow-icon" />
                    Follow
                  </>
                )}
              </button>
            </div>

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
    </Link>
  );
};