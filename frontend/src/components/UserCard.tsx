import { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import './UserCard.css';
import { User } from '@/types/federation';
import { useSocialActions } from '@/hooks/use-social-actions';
import './SocialPost.css';

interface UserCardProps {
  user: User;
}

export const UserCard = ({ user }: UserCardProps) => {
  const { followUser, unfollowUser, isFollowing } = useSocialActions();
  const [isCurrentlyFollowing, setIsCurrentlyFollowing] = useState(false);

  useEffect(() => {
    if (user && user.id) {
      setIsCurrentlyFollowing(isFollowing(user.id));
    }
  }, [user, isFollowing]);

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
    // The entire card is now a clickable Link
    <Link to={`/profile/${user.username.replace('@', '')}`} className="user-card-link">
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
                <p className="username">
                  @{user.username.startsWith("@") && user.username.indexOf("@", 1) !== -1
                    ? user.username.slice(1).split("@")[0]
                    : user.username}
                </p>
              </div>
              
              {/* The follow button is now interactive */}
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