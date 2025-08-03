import { useState, useEffect } from 'react';
import { useApiQuery, api, auth } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
 
 
type ApiUser = {
  username?: string;
  email?: string;
  displayName?: string; // preferred key
  name?: string;        // fallback when backend sends `name`
  avatarUrl?: string;
  bio?: string;
};
 
import { Link } from 'react-router-dom';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  ArrowLeft,
  Settings,
  Grid3X3,
  Bookmark,
  Heart,
  Camera,
  ChevronLeft
} from 'lucide-react';
import { SocialPost } from '@/components/SocialPost';
 
// These fields remain as mock data per instructions
const MOCK_USER_META = {
  follower_count: 12500,
  following_count: 234,
  posts_count: 89,
  verified: true
};
 
 
const followersList = [
  { id: '2', username: 'janedoe', display_name: 'Jane Doe', avatar_url: 'https://randomuser.me/api/portraits/women/1.jpg' },
  { id: '3', username: 'alexsmith', display_name: 'Alex Smith', avatar_url: 'https://randomuser.me/api/portraits/men/2.jpg' },
];
 
const followingList = [
  { id: '4', username: 'michael', display_name: 'Michael Johnson', avatar_url: 'https://randomuser.me/api/portraits/men/3.jpg' },
  { id: '5', username: 'emily', display_name: 'Emily Davis', avatar_url: 'https://randomuser.me/api/portraits/women/4.jpg' },
];
 
 
type TabValue = 'posts' | 'liked' | 'saved';
type ListTab = 'followers' | 'following';
 
const Profile = () => {
  const [activeTab, setActiveTab] = useState<TabValue>('posts');
  const [connectionsTab, setConnectionsTab] = useState<ListTab>('followers');
  const [showConnections, setShowConnections] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading: isPostsLoading, error: postsError } = useApiQuery<{ posts: any[] }>(
    ['user-posts'],
    '/feed/mine'
  );
 
  // Profile state
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
 
 
  const userPosts = (data?.posts ?? []).map(post => ({
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
 
 
 
  // Fetch user profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const profileData = await api.get<ApiUser>('/profile');
        setApiUser(profileData);
      } catch (err) {
        setError(err as Error);
        // Handle 401 errors specifically
        if ((err as any).status === 401) {
          auth.logout(); // Use auth.logout() which clears tokens and redirects
          return;
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);
 
  // Compose userData from API and mock meta
  const userData = {
    id: '1',
    username: apiUser?.username || ' ',
    display_name: apiUser?.displayName ?? (apiUser as any)?.name ?? ' ',
    bio: apiUser?.bio || ' ',
    avatar_url: apiUser?.avatarUrl || ' ',
    ...MOCK_USER_META
  };
 
  const displayedList =
    connectionsTab === 'followers' ? followersList : followingList;
 
  const filteredList = displayedList.filter((user) =>
    user.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
 
  if (isLoading || isPostsLoading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '28rem', margin: '0 auto' }}>
        {/* Skeleton for avatar */}
        <Skeleton className="w-20 h-20 rounded-full mb-4" />
 
        {/* Skeleton for name */}
        <Skeleton className="h-6 w-48 mb-2" />
 
        {/* Skeleton for bio */}
        <Skeleton className="h-4 w-full mb-6" />
 
        {/* Skeleton list for posts */}
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-md" />
          ))}
        </div>
      </div>
    );
  }
 
  if (error) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>Failed to load profile.</div>;
  }
 
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'hsl(var(--background))' }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(hsl(var(--background)), 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid hsl(var(--border))'
      }}>
        <div style={{
          maxWidth: '28rem',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem'
        }}>
          {showConnections ? (
            <button
              onClick={() => setShowConnections(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: 'hsl(var(--foreground))'
              }}
            >
              <ChevronLeft style={{ width: '1.5rem', height: '1.5rem' }} />
              <span>Back</span>
            </button>
          ) : (
            <Link to="/feed">
              <ArrowLeft style={{ width: '1.5rem', height: '1.5rem', color: 'hsl(var(--foreground))' }} />
            </Link>
          )}
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 'bold',
            fontSize: '1.25rem',
            color: 'hsl(var(--foreground))'
          }}>
            @{userData.username}
          </h1>
          <Link to="/settings">
            <Settings style={{ width: '1.5rem', height: '1.5rem', color: 'hsl(var(--foreground))' }} />
          </Link>
        </div>
      </header>
 
      <main style={{ maxWidth: '28rem', margin: '0 auto' }}>
        {showConnections ? (
          <>
            <Tabs value={connectionsTab} onValueChange={(v) => setConnectionsTab(v as ListTab)} style={{ padding: '1rem 1rem 0' }}>
              <TabsList style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                width: '100%',
                marginBottom: '1rem'
              }}>
                <TabsTrigger value="followers">Followers</TabsTrigger>
                <TabsTrigger value="following">Following</TabsTrigger>
              </TabsList>
 
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <input
                  type="text"
                  placeholder="Search users"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.375rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    color: 'hsl(var(--foreground))',
                    backgroundColor: 'hsl(var(--background))'
                  }}
                />
              </div>
 
              <TabsContent value="followers">
                <ul style={{ display: 'grid', gap: '1rem' }}>
                  {filteredList.length > 0 ? (
                    filteredList.map((user) => (
                      <li key={user.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <img
                          src={user.avatar_url}
                          alt={user.display_name}
                          style={{
                            width: '3rem',
                            height: '3rem',
                            borderRadius: '9999px',
                            border: '1px solid hsl(var(--border))'
                          }}
                        />
                        <div>
                          <p style={{ fontWeight: '600' }}>{user.display_name}</p>
                          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>@{user.username}</p>
                        </div>
                      </li>
                    ))
                  ) : (
                    <p style={{
                      color: 'hsl(var(--muted-foreground))',
                      textAlign: 'center'
                    }}>
                      No users found.
                    </p>
                  )}
                </ul>
              </TabsContent>
 
              <TabsContent value="following">
                <ul style={{ display: 'grid', gap: '1rem' }}>
                  {filteredList.length > 0 ? (
                    filteredList.map((user) => (
                      <li key={user.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <img
                          src={user.avatar_url}
                          alt={user.display_name}
                          style={{
                            width: '3rem',
                            height: '3rem',
                            borderRadius: '9999px',
                            border: '1px solid hsl(var(--border))'
                          }}
                        />
                        <div>
                          <p style={{ fontWeight: '600' }}>{user.display_name}</p>
                          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>@{user.username}</p>
                        </div>
                      </li>
                    ))
                  ) : (
                    <p style={{
                      color: 'hsl(var(--muted-foreground))',
                      textAlign: 'center'
                    }}>
                      No users found.
                    </p>
                  )}
                </ul>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <>
            <section style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={userData.avatar_url}
                    alt="avatar"
                    style={{
                      width: '5rem',
                      height: '5rem',
                      borderRadius: '9999px',
                      border: '2px solid hsl(var(--primary))'
                    }}
                  />
                  <button
                    aria-label="Change avatar"
                    style={{
                      position: 'absolute',
                      bottom: '-0.25rem',
                      right: '-0.25rem',
                      width: '2rem',
                      height: '2rem',
                      backgroundColor: 'hsl(var(--primary))',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Camera style={{ width: '1rem', height: '1rem', color: 'white' }} />
                  </button>
                </div>
                <div style={{ flex: 1, display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{userData.posts_count}</div>
                      <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>Posts</div>
                    </div>
                    <button
                      onClick={() => {
                        setConnectionsTab('followers');
                        setShowConnections(true);
                      }}
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>
                        {userData.follower_count.toLocaleString()}
                      </div>
                      <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>Followers</div>
                    </button>
                    <button
                      onClick={() => {
                        setConnectionsTab('following');
                        setShowConnections(true);
                      }}
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{userData.following_count}</div>
                      <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>Following</div>
                    </button>
                  </div>
                </div>
              </div>
 
              <div>
                <h2 style={{
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {userData.display_name}
                </h2>
                <p style={{ color: 'hsl(var(--muted-foreground))' }}>{userData.bio}</p>
              </div>
            </section>
 
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} style={{ width: '100%' }}>
              <TabsList style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                borderTop: '1px solid hsl(var(--border))',
                margin: "0 3%"
              }}>
                <TabsTrigger value="posts">
                  <Grid3X3 style={{ width: '1rem', height: '1rem' }} /> Posts
                </TabsTrigger>
                <TabsTrigger value="liked">
                  <Heart style={{ width: '1rem', height: '1rem' }} /> Liked
                </TabsTrigger>
                <TabsTrigger value="saved">
                  <Bookmark style={{ width: '1rem', height: '1rem' }} /> Saved
                </TabsTrigger>
              </TabsList>
 
              <TabsContent value="posts">
                <div style={{ padding: '1rem', display: 'grid', gap: '1.5rem' }}>
                  {userPosts.map(post => (
                    <SocialPost key={post.id} post={post} />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="liked">
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <Heart style={{
                    width: '3rem',
                    height: '3rem',
                    color: 'hsl(var(--muted-foreground))',
                    margin: '0 auto 1rem'
                  }} />
                  <h3 style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>No liked posts yet</h3>
                  <p style={{ color: 'hsl(var(--muted-foreground))' }}>Posts you like will appear here</p>
                </div>
              </TabsContent>
              <TabsContent value="saved">
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <Bookmark style={{
                    width: '3rem',
                    height: '3rem',
                    color: 'hsl(var(--muted-foreground))',
                    margin: '0 auto 1rem'
                  }} />
                  <h3 style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>No saved posts yet</h3>
                  <p style={{ color: 'hsl(var(--muted-foreground))' }}>Save posts to view them later</p>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};
 
export default Profile;