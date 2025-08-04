import { useState, useEffect, useRef, useCallback } from 'react';
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
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import { FederatedPost } from '@/types/federation';

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
}

interface UserListResponse {
  items: UserListItem[];
  total: number;
  next?: string;
}

const useUserProfile = (handle: string | undefined) => {
  return useApiQuery<UserProfileResponse>(
    ['userProfile', handle],
    handle ? `/federation/users/${handle}` : '',
    { enabled: !!handle }
  );
};

const useUserPosts = (handle: string | undefined) => {
  return useApiQuery<FederatedPost>(
    ['userPosts', handle],
    handle ? `/federation/users/${handle}/posts` : '',
    { enabled: !!handle }
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
      let endpoint: string;

      if (url) {
        endpoint = `/federation/users/${handle}/${type}?page=${encodeURIComponent(url)}`;
      } else {
        endpoint = `/federation/users/${handle}/${type}`;
      }

      const res = await api.get<UserListResponse>(endpoint);

      if (!url) {
        setList(res.items);
      } else {
        setList(prev => [...prev, ...res.items]);
      }

      setNextUrl(res.next ?? null);
      setHasMore(!!res.next);
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

  return {
    list,
    loading,
    hasMore,
    loadMore,
  };
};

type TabValue = 'posts' | 'liked' | 'saved';
type ListTab = 'followers' | 'following';

const Profile = () => {
  const { username: routeUsername } = useParams<{ username?: string }>();
  const [activeTab, setActiveTab] = useState<TabValue>('posts');
  const [connectionsTab, setConnectionsTab] = useState<ListTab>('followers');
  const [showConnections, setShowConnections] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const connectionsContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [isLoadingApiUser, setIsLoadingApiUser] = useState(true);
  const [errorApiUser, setErrorApiUser] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingApiUser(true);
        const profileData = await api.get<ApiUser>('/profile');
        setApiUser(profileData);
      } catch (err) {
        setErrorApiUser(err as Error);
        if ((err as any).status === 401) {
          auth.logout();
          return;
        }
      } finally {
        setIsLoadingApiUser(false);
      }
    };
    fetchProfile();
  }, []);

  const isViewingOwnProfile = !routeUsername;
  let federatedHandle;
  if (isViewingOwnProfile) {
    const localUsername = apiUser?.email?.split('@')[0];
    federatedHandle = localUsername ? `@${localUsername}@mastodon.social` : undefined;
  } else {
    federatedHandle = `@${routeUsername}`;
  }

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

  const userPosts: FederatedPost[] = userPostsQuery.data?.items ?? [];

  const userData = {
    id: federatedProfileQuery.data?.id || '1',
    username: federatedProfileQuery.data?.handle || '',
    display_name: federatedProfileQuery.data?.name || '',
    bio: parse(DOMPurify.sanitize(federatedProfileQuery.data?.bio ))|| '',
    avatar_url: federatedProfileQuery.data?.avatarUrl ,
    following: federatedProfileQuery.data?.following ?? 0,
    followers: federatedProfileQuery.data?.followers ?? 0,
    posts_count: userPostsQuery.data?.count ?? 0,
    verified: true
  };

  const mappedList = (connectionsTab === 'followers' ? followers : following).map(user => ({
    id: user.id,
    username: user.handle,
    display_name: user.name,
    avatar_url: `https://www.gravatar.com/avatar/${user.handle}?d=identicon`
  }));

  const isConnectionsLoading = connectionsTab === 'followers' ? isFollowersLoading : isFollowingLoading;
  const hasMoreConnections = connectionsTab === 'followers' ? hasMoreFollowers : hasMoreFollowing;
  const loadMoreConnections = connectionsTab === 'followers' ? loadMoreFollowers : loadMoreFollowing;

  const filteredList = mappedList.filter(user =>
    user.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!showConnections || !hasMoreConnections || isConnectionsLoading) return;

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    };

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        loadMoreConnections();
      }
    };

    observerRef.current = new IntersectionObserver(handleObserver, options);

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [showConnections, connectionsTab, isConnectionsLoading, hasMoreConnections, loadMoreConnections]);

  const isProfileDataLoading = isLoadingApiUser || federatedProfileQuery.isLoading || userPostsQuery.isLoading;

  if (isProfileDataLoading) {
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

  if (errorApiUser || federatedProfileQuery.isError || userPostsQuery.isError) {
    return <div className="empty-state">Failed to load profile.</div>;
  }

  return (
    <div className="profile-container">
      <header className="header">
        <div className="header-content">
          {showConnections ? (
            <button onClick={() => setShowConnections(false)} className="back-button">
              <ChevronLeft style={{ width: '1.5rem', height: '1.5rem' }} />
              <span>Back</span>
            </button>
          ) : isViewingOwnProfile ? (
            <Link to="/">
              <ArrowLeft style={{ width: '1.5rem', height: '1.5rem', color: 'hsl(var(--foreground))' }} />
            </Link>
          ) : (
            <Link to="/profile">
              <ChevronLeft style={{ width: '1.5rem', height: '1.5rem' }} />
              <span>My Profile</span>
            </Link>
          )}
          <h1 className="header-title">{userData.username}</h1>
          <Link to="/settings">
            <Settings style={{ width: '1.5rem', height: '1.5rem', color: 'hsl(var(--foreground))' }} />
          </Link>
        </div>
      </header>

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
                    onClick={() => {
                      setShowConnections(false);
                    }}
                  >
                    <li className="user-list-item">
                      <img src={user.avatar_url} alt={user.display_name} className="user-list-avatar" />
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

            <div ref={sentinelRef} style={{ height: '1px', width: '100%' }} />

            {isConnectionsLoading && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
                minHeight: '60px'
              }}>
                <Loader2 style={{
                  width: '24px',
                  height: '24px',
                  animation: 'spin 1s linear infinite'
                }} />
              </div>
            )}

            {!hasMoreConnections && mappedList.length > 0 && (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#666'
              }}>
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
                  <div className="profile-post-avatar">{userData.display_name.charAt(0).toUpperCase()}</div>
                )}
                  <button aria-label="Change avatar" className="change-avatar-button">
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
                      <div className="stat-value">{userData.followers}</div>
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
                {userData.posts_count? (
                  userPosts
                    .filter(post => post !== null) 
                    .map(post => (
                      <SocialPost key={post.id} post={post} />
                    ))
                ) : (
                  <div className="empty-state">
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
    </div>
  );
};

export default Profile;
