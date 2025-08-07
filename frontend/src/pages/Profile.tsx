import { useState, useEffect, useRef, useCallback } from 'react';
import { useApiQuery, api, auth } from '@/lib/api';
import {
  ArrowLeft,
  Settings,
  Grid3X3,
  Bookmark,
  Heart,
  ChevronLeft,
  Loader2,
  UserMinus,
  UserPlus
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { SocialPost } from '@/components/SocialPost';
import './Profile.css';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import { FederatedPost } from '@/types/federation';
import { useSocialActions } from '@/hooks/use-social-actions';

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
  avatarUrl: string;
}

interface UserListItem {
  id: string;
  handle: string;
  name: string;
  avatar?: string;
}

interface UserListResponse {
  items: UserListItem[];
  total: number;
  next?: string;
}

type TabValue = 'posts' | 'liked' | 'saved';
type ListTab = 'followers' | 'following';

const useUserProfile = (handle: string | undefined) => {
  return useApiQuery<UserProfileResponse>(
    ['userProfile', handle],
    handle ? `/federation/users/${handle}` : '',
    { enabled: !!handle }
  );
};

const useUserPosts = (handle: string | undefined) => {
  return useApiQuery<{ items: FederatedPost[]; count: number }>(
    ['userPosts', handle],
    handle ? `/federation/users/${handle}/posts` : '',
    {
      enabled: !!handle,
    }
  );
};

const usePaginatedConnections = (
  handle: string | undefined,
  type: 'followers' | 'following'
) => {
  const [list, setList] = useState<UserListItem[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchList = useCallback(async (url?: string) => {
    if (!handle || loading) return;

    try {
      setLoading(true);
      const endpoint = url
        ? `/federation/users/${handle}/${type}?page=${encodeURIComponent(url)}`
        : `/federation/users/${handle}/${type}`;

      const { items, next } = await api.get<UserListResponse>(endpoint);

      setList(prev => url ? [...prev, ...items] : items);
      setNextUrl(next ?? null);
      setHasMore(!!next);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  }, [handle, type, loading]);

  const loadMore = useCallback(() => {
    if (nextUrl && !loading && hasMore) {
      fetchList(nextUrl);
    }
  }, [nextUrl, loading, hasMore, fetchList]);

  useEffect(() => {
    setList([]);
    setNextUrl(null);
    setHasMore(true);
    fetchList();
  }, [handle]);

  return { list, loading, hasMore, loadMore };
};

const useProfileData = () => {
  const { username: routeUsername } = useParams<{ username?: string }>();
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [isLoadingApiUser, setIsLoadingApiUser] = useState(true);
  const [errorApiUser, setErrorApiUser] = useState<Error | null>(null);

  console.log()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingApiUser(true);
        const profileData = await api.get<ApiUser>('/profile');
        setApiUser(profileData);
      } catch (err) {
        setErrorApiUser(err as Error);
        if ((err as any).status === 401) auth.logout();
      } finally {
        setIsLoadingApiUser(false);
      }
    };
    fetchProfile();
  }, []);

  const isViewingOwnProfile = !routeUsername;
  const federatedHandle = isViewingOwnProfile
    ? apiUser?.username ? `@${apiUser.username}@todo-secure-list.xyz` : undefined
    : `@${routeUsername}`;

  return {
    apiUser,
    isLoadingApiUser,
    errorApiUser,
    isViewingOwnProfile,
    federatedHandle
  };
};

const Profile = () => {
  const {
    apiUser,
    isLoadingApiUser,
    errorApiUser,
    isViewingOwnProfile,
    federatedHandle
  } = useProfileData();

  const [activeTab, setActiveTab] = useState<TabValue>('posts');
  const [connectionsTab, setConnectionsTab] = useState<ListTab>('followers');
  const [showConnections, setShowConnections] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Use the social actions hook and a state for the follow button
  const { followUser, unfollowUser, isFollowing } = useSocialActions();
  const [isCurrentlyFollowing, setIsCurrentlyFollowing] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  const federatedProfileQuery = useUserProfile(federatedHandle);
  const userPostsQuery = useUserPosts(federatedHandle);
  const {
    list: followers,
    loading: isFollowersLoading,
    hasMore: hasMoreFollowers,
    loadMore: loadMoreFollowers
  } = usePaginatedConnections(federatedHandle, 'followers');
  const {
    list: following,
    loading: isFollowingLoading,
    hasMore: hasMoreFollowing,
    loadMore: loadMoreFollowing
  } = usePaginatedConnections(federatedHandle, 'following');

  // Set the initial follow state when the profile data loads
  useEffect(() => {
    if (federatedProfileQuery.data) {
      setIsCurrentlyFollowing(isFollowing(federatedProfileQuery.data.id));
    }
  }, [federatedProfileQuery.data, isFollowing]);

  // Handler function for the follow button
  const handleFollow = useCallback(async () => {
    const profileData = federatedProfileQuery.data;
    if (!profileData) return;

    if (isCurrentlyFollowing) {
      await unfollowUser(profileData.id, profileData.handle);
    } else {
      await followUser(profileData.id, profileData.handle);
    }
  }, [isCurrentlyFollowing, federatedProfileQuery.data, followUser, unfollowUser]);

  const userPosts = userPostsQuery.data?.items ?? [];
  const userData = {
    id: federatedProfileQuery.data?.id || '1',
    username: federatedProfileQuery.data?.handle || '',
    display_name: federatedProfileQuery.data?.name || '',
    bio: parse(DOMPurify.sanitize(federatedProfileQuery.data?.bio || '')) || '',
    avatar_url: federatedProfileQuery.data?.avatarUrl,
    following: federatedProfileQuery.data?.following ?? 0,
    followers: federatedProfileQuery.data?.followers ?? 0,
    posts_count: userPostsQuery.data?.count ?? 0,
    verified: true
  };

  const mappedList = (connectionsTab === 'followers' ? followers : following).filter(user => user !== null && user !== undefined)
  .map(user => ({

    id: user.id,
    username: user.handle,
    display_name: user.name,
    avatar_url: user?.avatar || `https://www.gravatar.com/avatar/${user.handle}?d=identicon`
  }));

  const filteredList = mappedList.filter(user =>
    user.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isConnectionsLoading = connectionsTab === 'followers'
    ? isFollowersLoading
    : isFollowingLoading;
  const hasMoreConnections = connectionsTab === 'followers'
    ? hasMoreFollowers
    : hasMoreFollowing;
  const loadMoreConnections = connectionsTab === 'followers'
    ? loadMoreFollowers
    : loadMoreFollowing;

  useEffect(() => {
    if (!showConnections || !hasMoreConnections || isConnectionsLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && loadMoreConnections(),
      { root: null, rootMargin: '100px', threshold: 0.1 }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [showConnections, connectionsTab, isConnectionsLoading, hasMoreConnections, loadMoreConnections]);

  const showSkeleton = isLoadingApiUser || federatedProfileQuery.isLoading;
  const showProfileError = errorApiUser || federatedProfileQuery.isError;

  if (showProfileError) {
    return <div className="empty-state">Failed to load profile.</div>;
  }

  return (
    <div className="profile-container">
      <header className="header">
        <div className="header-content">
          {showConnections ? (
            <button onClick={() => setShowConnections(false)} className="back-button">
              <ChevronLeft size={24} />
              <span>Back</span>
            </button>
          ) : isViewingOwnProfile ? (
            <Link to="/">
              <ArrowLeft size={24} className="text-foreground" />
            </Link>
          ) : (
            <Link to="/profile" className="flex items-center gap-1">
              <ChevronLeft size={24} />
            </Link>
          )}
          <h1 className="header-title">{userData.username}</h1>
          <Link to="/settings">
            <Settings size={24} className="text-foreground" />
          </Link>
        </div>
      </header>

      {showSkeleton ? (
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
      ) : (
        <main className="main-content">
          {showConnections ? (
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

              <ul className="user-list">
                {filteredList.length > 0 ? (
                  filteredList.map(user => (
                    <Link
                      to={`/profile/${user.username.replace('@', '')}`}
                      key={user.id}
                      className="user-list-link"
                      onClick={() => setShowConnections(false)}
                    >
                      <li className="user-list-item">
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
                    </Link>
                  ))
                ) : (
                  !isConnectionsLoading && <p className="empty-state">No users found.</p>
                )}
              </ul>

              <div ref={sentinelRef} className="sentinel" />

              {isConnectionsLoading && (
                <div className="loading-indicator">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              )}

              {!hasMoreConnections && mappedList.length > 0 && (
                <div className="end-of-list">
                  No more users to show
                </div>
              )}
            </div>
          ) : (
            <>
              <section className="profile-section">
                <div className="profile-header">
                  <div className="avatar-wrapper">
                    {userData.avatar_url ? (
                      <img
                        src={userData.avatar_url}
                        alt={userData.display_name}
                        className="profile-post-avatar"
                      />
                    ) : (
                      <div className="profile-post-avatar">
                        {userData.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
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
                        <div className="stat-value">{userData.followers.toLocaleString()}</div>
                        <div className="stat-label">Followers</div>
                      </button>
                      <button
                        onClick={() => {
                          setConnectionsTab('following');
                          setShowConnections(true);
                        }}
                        className="stat-item"
                      >
                        <div className="stat-value">{userData.following.toLocaleString()}</div>
                        <div className="stat-label">Following</div>
                      </button>
                    </div>
                    {!isViewingOwnProfile && (
                      <div className="profile-header-actions">
                        <button
                          // Use the new handleFollow function here
                          onClick={handleFollow}
                          className={`profile-follow-btn ${isCurrentlyFollowing ? 'following' : ''}`}
                        >
                          {isCurrentlyFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                          {isCurrentlyFollowing ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="profile-info">
                  <h2>{userData.display_name}</h2>
                  {userData.bio}
                </div>
              </section>

              <div className="tabs-container">
                <div className="tabs-list">
                  <button
                    className={`tab-trigger ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('posts')}
                  >
                    <Grid3X3 size={16} /> Posts
                  </button>
                  <button
                    className={`tab-trigger ${activeTab === 'liked' ? 'active' : ''}`}
                    onClick={() => setActiveTab('liked')}
                  >
                    <Heart size={16} /> Liked
                  </button>
                  <button
                    className={`tab-trigger ${activeTab === 'saved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('saved')}
                  >
                    <Bookmark size={16} /> Saved
                  </button>
                </div>

                {activeTab === 'posts' && (
                  <div className="tabs-content">
                    {userPostsQuery.isLoading ? (
                      <div className="loading-indicator">
                        <Loader2 className="loading-spinner" />
                        <p className="loading-text">Loading your feed...</p>
                      </div>

                    ) : userPostsQuery.isError ? (
                      <div className="error-container">
                        <p className="error-message">Couldn't load posts</p>
                        <button
                          className="retry-button"
                          onClick={() => userPostsQuery.refetch()}
                          disabled={userPostsQuery.isLoading}
                        >
                          {userPostsQuery.isLoading && (
                            <Loader2 className="spinner" />
                          )}
                          Retry
                        </button>
                      </div>

                    ) : userData.posts_count > 0 ? (
                      userPosts
                        .filter(Boolean)
                        .map(post => <SocialPost key={post.id} post={post} />)
                    ) : (
                      <div className="empty-state">
                        <Grid3X3 className="empty-icon" />
                        <h3>No posts yet</h3>
                        <p>This user has not posted anything.</p>
                      </div>
                    )}
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
      )}
    </div>
  );
};

export default Profile;