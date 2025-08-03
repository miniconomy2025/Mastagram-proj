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
        // Pagination: pass the full URL as a query parameter
        endpoint = `/federation/users/${handle}/${type}?page=${encodeURIComponent(url)}`;
      } else {
        // Initial load: use base endpoint
        endpoint = `/federation/users/${handle}/${type}`;
      }
     
      const res = await api.get<UserListResponse>(endpoint);
     
      if (!url) {
        // Initial load
        setList(res.items);
      } else {
        // Pagination load
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
 
  // Use a different query key for the current user's posts
  const { data: postsData, isLoading: isPostsLoading } = useApiQuery<{ posts: any[] }>(
    ['user-posts', 'mine'],
    '/feed/mine'
  );
 
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
 
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
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
 
  // --- Start of Changes ---
  // Determine which user's profile to show based on the URL
  const isViewingOwnProfile = !routeUsername;
  const currentUsername = isViewingOwnProfile
    ? apiUser?.email?.split('@')[0]
    : routeUsername;
 
  // Construct the federated handle dynamically
  const federatedHandle = currentUsername ? `@third3king@mastodon.social` : undefined;
 
  const federatedProfileQuery = useUserProfile(federatedHandle);
 
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
 
  // --- End of Changes ---
 
  const userPosts: FederatedPost[] = (postsData?.posts ?? []).map(post => ({
    id: post._id,
    content: post.caption,
    contentMediaType: 'text/html', // adjust if you're storing plain text or markdown
    attachment: post.media?.[0]
      ? {
          type: post.media[0].mediaType === 'video' ? 'video' : 'image',
          url: post.media[0].url,
          name: post.media[0].name || '',
        }
      : undefined,
    likesCount: post.likes_count ?? 0,
    repliesCount: post.comments_count ?? 0,
    createdAt: post.createdAt,
    author: {
      id: apiUser?.username || 'local-user',
      handle: `@${apiUser?.username}@mastagram.local`, // adjust if needed
      name: apiUser?.displayName || apiUser?.username || 'Unknown',
      avatar: apiUser?.avatarUrl || '',
    },
  }));
 
 
  // Map the federated profile data to the userData object
  const userData = {
    id: federatedProfileQuery.data?.id || '1',
    username: federatedProfileQuery.data?.handle || '',
    display_name: federatedProfileQuery.data?.name || '',
    bio: federatedProfileQuery.data?.bio || '',
    avatar_url: federatedProfileQuery.data?.avatarUrl || '',
    following: federatedProfileQuery.data?.following ?? 0,
    followers: federatedProfileQuery.data?.followers ?? 0,
    posts_count: postsData?.posts.length ?? 0,
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
 
  // Intersection Observer for infinite scroll
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
 
  const isProfileDataLoading = isLoading || federatedProfileQuery.isLoading;
 
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
 
  if (error || federatedProfileQuery.isError) {
    return <div className="empty-state">Failed to load profile.</div>;
  }
 
  return (
    <div className="profile-container">
      <header className="header">
        <div className="header-content">
          {/* --- Start of Changes (Header) --- */}
          {isViewingOwnProfile ? (
            <Link to="/profile">
              <ArrowLeft style={{ width: '1.5rem', height: '1.5rem', color: 'hsl(var(--foreground))' }} />
            </Link>
          ) : (
            <Link to="/profile">
              <ChevronLeft style={{ width: '1.5rem', height: '1.5rem' }} />
              <span>Back to my profile</span>
            </Link>
          )}
          <h1 className="header-title">{userData.username}</h1>
          <Link to="/settings">
            <Settings style={{ width: '1.5rem', height: '1.5rem', color: 'hsl(var(--foreground))' }} />
          </Link>
          {/* --- End of Changes (Header) --- */}
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
              {/* --- Start of Changes (User List) --- */}
              {filteredList.length > 0 ? (
                filteredList.map(user => (
                  <Link
                    to={`/profile/${user.username.replace('@', '')}`}
                    key={user.id}
                    className="user-list-link"
                    onClick={() => {
                        // Reset connections view when navigating to a new profile
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
              {/* --- End of Changes (User List) --- */}
            </ul>
           
            {/* Sentinel element for infinite scroll */}
            <div ref={sentinelRef} style={{ height: '1px', width: '100%' }} />
           
            {/* Loading spinner at the bottom */}
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
                  <img src={userData.avatar_url} alt="avatar" className="avatar-image" />
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