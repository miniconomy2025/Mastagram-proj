import { useState, useEffect } from 'react';
import { api } from '@/lib/api';


type ApiUser = {
  username?: string;
  email?: string;
  displayName?: string;
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

const userPosts = [
  {
    id: '1',
    user_id: '1',
    username: 'king👑',
    caption: 'Beautiful sunset from my rooftop 🌅',
    hashtags: ['sunset', 'photography', 'golden'],
    media_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    media_type: 'image',
    likes_count: 2534,
    comments_count: 127,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    user_id: '1',
    username: 'king👑',
    caption: 'Coffee and code - perfect morning combo ☕💻',
    hashtags: ['coffee', 'developer', 'morning'],
    media_url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400',
    media_type: 'image',
    likes_count: 1876,
    comments_count: 89,
    created_at: '2024-01-14T08:30:00Z'
  }
];

type TabValue = 'posts' | 'liked' | 'saved';
type ListTab = 'followers' | 'following';

const Profile = () => {
  const [activeTab, setActiveTab] = useState<TabValue>('posts');
  const [connectionsTab, setConnectionsTab] = useState<ListTab>('followers');
  const [showConnections, setShowConnections] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Profile state
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Compose userData from API and mock meta
  const userData = {
    id: '1',
    username: apiUser?.username || 'king👑',
    display_name: apiUser?.displayName || 'Alfred Malope',
    bio: apiUser?.bio || '👨‍💻 Software Engineer | 🚀 Building scalable systems | ☕ Coffee enthusiast | 📷 Capturing moments',
    avatar_url: apiUser?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    ...MOCK_USER_META
  };

  const displayedList =
    connectionsTab === 'followers' ? followersList : followingList;

  const filteredList = displayedList.filter((user) =>
    user.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;
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
                  {userData.verified && (
                    <span style={{ marginLeft: '0.5rem', color: 'hsl(var(--primary))' }} title="Verified">✓</span>
                  )}
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