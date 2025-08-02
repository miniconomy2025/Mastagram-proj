import { useState, useEffect } from 'react';
import { useApiQuery, api, auth } from '@/lib/api';
import {
  ArrowLeft,
  Settings,
  Grid3X3,
  Bookmark,
  Heart,
  Camera,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { SocialPost } from '@/components/SocialPost';
import './Profile.css';

const MOCK_USER_META = {
  posts_count: 89,
  verified: true
};

type ApiUser = {
  username?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
};

interface UserProfileResponse {
  id: string;
  handle: string;
  name: string;
  bio: string;
  createdAt: string;
  followers: number;
  following: number;
}

interface UserListItem {
  id: string;
  handle: string;
  name: string;
}

interface UserListResponse {
  items: UserListItem[];
  total: number;
}

const useUserProfile = (username: string | undefined) => {
  return useApiQuery<UserProfileResponse>(
    ['userProfile', username],
    username ? `/federation/users/@test@mastodon.social` : '',
    {
      enabled: !!username,
    }
  );
};

const useUserFollowers = (username: string | undefined) => {
  return useApiQuery<UserListResponse>(
    ['userFollowers', username],
    username ? `/federation/users/@test@mastodon.social/followers` : '',
    {
      enabled: !!username,
    }
  );
};

const useUserFollowing = (username: string | undefined) => {
  return useApiQuery<UserListResponse>(
    ['userFollowing', username],
    username ? `/federation/users/@test@mastodon.social/following` : '',
    {
      enabled: !!username,
    }
  );
};

type TabValue = 'posts' | 'liked' | 'saved';
type ListTab = 'followers' | 'following';

const Profile = () => {
  const { username: routeUsername } = useParams<{ username?: string }>();
  const [activeTab, setActiveTab] = useState<TabValue>('posts');
  const [connectionsTab, setConnectionsTab] = useState<ListTab>('followers');
  const [showConnections, setShowConnections] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // This fetch is for the logged-in user's posts, not a public profile.
  const { data: postsData, isLoading: isPostsLoading, error: postsError } = useApiQuery<{ posts: any[] }>(
    ['user-posts'],
    '/feed/mine'
  );

  // This fetch is for the currently logged-in user's profile data
  // The username is derived from the auth token
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const profileData = await api.get<ApiUser>('/profile');
        setApiUser(profileData);
      } catch (err) {
        setError(err as Error);
        if ((err as any).status === 401) {
          auth.logout();
          return;
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const profileUsername = routeUsername || apiUser?.email?.split('@')[0];
  const federatedHandle = profileUsername ? `${profileUsername}@mastodon.social` : undefined;

  const federatedProfileQuery = useUserProfile(federatedHandle);
  const followersQuery = useUserFollowers(federatedHandle);
  const followingQuery = useUserFollowing(federatedHandle);

  const userPosts = (postsData?.posts ?? []).map(post => ({
    id: post._id,
    user_id: post.userId,
    username: apiUser?.username || 'unknown',
    caption: post.caption,
    hashtags: post.hashtags,
    media: post.media.map((m: any, index: number) => ({
      id: `${post._id}-${index}`,
      url: m.url,
      type: m.mediaType,
    })),
    likes_count: post.likes_count ?? 0,
    comments_count: post.comments_count ?? 0,
    created_at: post.createdAt,
  }));

  const userData = {
    id: '1',
    username: apiUser?.username || ' ',
    display_name: apiUser?.displayName || ' ',
    bio: apiUser?.bio || ' ',
    avatar_url: apiUser?.avatarUrl || ' ',
    following: federatedProfileQuery.data?.following ?? 0,
    followers: federatedProfileQuery.data?.followers ?? 0,
    posts_count: postsData?.posts.length ?? 0,
    verified: true
  };

  const mappedFollowers = (followersQuery.data?.items ?? []).map(user => ({
    id: user.id,
    username: user.handle,
    display_name: user.name,
    avatar_url: `https://www.gravatar.com/avatar/${user.handle}?d=identicon`
  }));

  const mappedFollowing = (followingQuery.data?.items ?? []).map(user => ({
    id: user.id,
    username: user.handle,
    display_name: user.name,
    avatar_url: `https://www.gravatar.com/avatar/${user.handle}?d=identicon`
  }));

  const displayedList = connectionsTab === 'followers' ? mappedFollowers : mappedFollowing;
  const filteredList = displayedList.filter((user) =>
    user.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isProfileDataLoading = isLoading || federatedProfileQuery.isLoading;
  const isConnectionsLoading = followersQuery.isLoading || followingQuery.isLoading;

  if (isProfileDataLoading || isPostsLoading) {
    return (
      <div className="skeleton-container">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-name"></div>
        <div className="skeleton-bio"></div>
        <div className="skeleton-posts">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-post-item"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || federatedProfileQuery.isError) {
    return <div className="empty-state">Failed to load profile.</div>;
  }

  return (
    <div className="profile-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          {showConnections ? (
            <button
              onClick={() => setShowConnections(false)}
              className="back-button"
            >
              <ChevronLeft style={{ width: '1.5rem', height: '1.5rem' }} />
              <span>Back</span>
            </button>
          ) : (
            <Link to="/feed">
              <ArrowLeft style={{ width: '1.5rem', height: '1.5rem', color: 'hsl(var(--foreground))' }} />
            </Link>
          )}
          <h1 className="header-title">
            {userData.username}
          </h1>
          <Link to="/settings">
            <Settings style={{ width: '1.5rem', height: '1.5rem', color: 'hsl(var(--foreground))' }} />
          </Link>
        </div>
      </header>

      <main className="main-content">
        {showConnections ? (
          <>
            <div className="connections-tabs">
              <div className="connections-tabs-list">
                <button
                  className={`connections-tabs-trigger ${connectionsTab === 'followers' ? 'active' : ''}`}
                  onClick={() => setConnectionsTab('followers')}
                >
                  Followers
                </button>
                <button
                  className={`connections-tabs-trigger ${connectionsTab === 'following' ? 'active' : ''}`}
                  onClick={() => setConnectionsTab('following')}
                >
                  Following
                </button>
              </div>

              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Search users"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div>
                {isConnectionsLoading ? (
                  <div className="loader-wrapper">
                    <Loader2 className="loader" />
                  </div>
                ) : (
                  <ul className="user-list">
                    {filteredList.length > 0 ? (
                      filteredList.map((user) => (
                        <li key={user.id} className="user-list-item">
                          <img
                            src={user.avatar_url}
                            alt={user.display_name}
                            className="user-list-avatar"
                          />
                          <div className="user-list-info">
                            <p className="user-list-name">{user.display_name}</p>
                            <p className="user-list-handle">{user.username}</p>
                          </div>
                        </li>
                      ))
                    ) : (
                      <p className="empty-state">
                        No users found.
                      </p>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <section className="profile-section">
              <div className="profile-header">
                <div className="avatar-wrapper">
                  <img
                    src={userData.avatar_url}
                    alt="avatar"
                    className="avatar-image"
                  />
                  <button
                    aria-label="Change avatar"
                    className="change-avatar-button"
                  >
                    <Camera style={{ width: '1rem', height: '1rem', color: 'white' }} />
                  </button>
                </div>
                <div className="profile-stats">
                  <div className="stats-list">
                    <div className="stat-item">
                      <div className="stat-value">{userData.posts_count}</div>
                      <div className="stat-label">Posts</div>
                    </div>
                    <button
                      onClick={() => {
                        setConnectionsTab('followers');
                        setShowConnections(true);
                      }}
                      className="stat-item"
                    >
                      <div className="stat-value">
                        {userData.followers}
                      </div>
                      <div className="stat-label">Followers</div>
                    </button>
                    <button
                      onClick={() => {
                        setConnectionsTab('following');
                        setShowConnections(true);
                      }}
                      className="stat-item"
                    >
                      <div className="stat-value">{userData.following}</div>
                      <div className="stat-label">Following</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="profile-info">
                <h2>{userData.display_name}</h2>
                <p>{userData.bio}</p>
              </div>
            </section>

            <div className="tabs-container">
              <div className="tabs-list">
                <button
                  className={`tab-trigger ${activeTab === 'posts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('posts')}
                >
                  <Grid3X3 style={{ width: '1rem', height: '1rem' }} /> Posts
                </button>
                <button
                  className={`tab-trigger ${activeTab === 'liked' ? 'active' : ''}`}
                  onClick={() => setActiveTab('liked')}
                >
                  <Heart style={{ width: '1rem', height: '1rem' }} /> Liked
                </button>
                <button
                  className={`tab-trigger ${activeTab === 'saved' ? 'active' : ''}`}
                  onClick={() => setActiveTab('saved')}
                >
                  <Bookmark style={{ width: '1rem', height: '1rem' }} /> Saved
                </button>
              </div>

              {activeTab === 'posts' && (
                <div className="tabs-content">
                  {userPosts.map(post => (
                    <SocialPost key={post.id} post={post} />
                  ))}
                </div>
              )}
              {activeTab === 'liked' && (
                <div className="empty-state">
                  <Heart className="empty-icon" />
                  <h3>No liked posts yet</h3>
                  <p>Posts you like will appear here</p>
                </div>
              )}
              {activeTab === 'saved' && (
                <div className="empty-state">
                  <Bookmark className="empty-icon" />
                  <h3>No saved posts yet</h3>
                  <p>Save posts to view them later</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Profile;