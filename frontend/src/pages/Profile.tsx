// Simple Tabs component
const Tabs = ({ value, onValueChange, children, style }) => (
  <div style={style}>{children}</div>
);

const TabsList = ({ children, style }) => (
  <div style={style}>{children}</div>
);

const TabsTrigger = ({ value, children, ...props }) => {
  const { activeTab, setActiveTab } = props;
  return (
    <button
      onClick={() => setActiveTab?.(value)}
      style={{
        padding: '0.5rem 1rem',
        border: 'none',
        backgroundColor: activeTab === value ? 'hsl(var(--primary))' : 'transparent',
        color: activeTab === value ? 'white' : 'hsl(var(--foreground))',
        borderRadius: '0.375rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem'
      }}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, children, ...props }) => {
  const { activeTab } = props;
  return activeTab === value ? <div>{children}</div> : null;
};

// Simple SocialPost component
const SocialPost = ({ post }) => (
  <div style={{
    border: '1px solid hsl(var(--border))',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    backgroundColor: 'hsl(var(--background))'
  }}>
    <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <img 
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40" 
        alt={post.username}
        style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%' }}
      />
      <div>
        <p style={{ fontWeight: '600', margin: 0 }}>{post.username}</p>
        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem', margin: 0 }}>
          {new Date(post.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
    <img 
      src={post.media_url} 
      alt={post.caption}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    />
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
        <button style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
          <Heart style={{ width: '1.25rem', height: '1.25rem' }} />
          <span>{post.likes_count.toLocaleString()}</span>
        </button>
        <button style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
          <MessageCircle style={{ width: '1.25rem', height: '1.25rem' }} />
          <span>{post.comments_count}</span>
        </button>
      </div>
      <p style={{ margin: 0 }}>{post.caption}</p>
      {post.hashtags && post.hashtags.length > 0 && (
        <p style={{ color: 'hsl(var(--primary))', margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
          {post.hashtags.map(tag => `#${tag}`).join(' ')}
        </p>
      )}
    </div>
  </div>
);import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Settings,
  Grid3X3,
  Bookmark,
  Heart,
  Camera,
  ChevronLeft,
  X,
  ChevronRight,
  MessageCircle
} from 'lucide-react';

const userData = {
  id: '1',
  username: 'king👑',
  display_name: 'Alfred Malope',
  bio: '👨‍💻 Software Engineer | 🚀 Building scalable systems | ☕ Coffee enthusiast | 📷 Capturing moments',
  avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
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
    media_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
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
    media_url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
    media_type: 'image',
    likes_count: 1876,
    comments_count: 89,
    created_at: '2024-01-14T08:30:00Z'
  },
  {
    id: '3',
    user_id: '1',
    username: 'king👑',
    caption: 'Nature walk this morning 🌲',
    hashtags: ['nature', 'hiking', 'morning'],
    media_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    media_type: 'image',
    likes_count: 1234,
    comments_count: 56,
    created_at: '2024-01-13T07:15:00Z'
  },
  {
    id: '4',
    user_id: '1',
    username: 'king👑',
    caption: 'City lights at night ✨',
    hashtags: ['city', 'night', 'lights'],
    media_url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800',
    media_type: 'image',
    likes_count: 3456,
    comments_count: 189,
    created_at: '2024-01-12T20:30:00Z'
  },
  {
    id: '5',
    user_id: '1',
    username: 'king👑',
    caption: 'Beach vibes 🏖️',
    hashtags: ['beach', 'ocean', 'summer'],
    media_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    media_type: 'image',
    likes_count: 2890,
    comments_count: 145,
    created_at: '2024-01-11T16:45:00Z'
  },
  {
    id: '6',
    user_id: '1',
    username: 'king👑',
    caption: 'Mountain peak adventure 🏔️',
    hashtags: ['mountain', 'adventure', 'hiking'],
    media_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    media_type: 'image',
    likes_count: 1567,
    comments_count: 78,
    created_at: '2024-01-10T14:20:00Z'
  }
];

type TabValue = 'posts' | 'liked' | 'saved';
type ListTab = 'followers' | 'following';

const Profile = () => {
  const [activeTab, setActiveTab] = useState<TabValue>('posts');
  const [connectionsTab, setConnectionsTab] = useState<ListTab>('followers');
  const [showConnections, setShowConnections] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isMobile, setIsMobile] = useState(() => {
    return window.matchMedia('(pointer: coarse)').matches;
  });
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const displayedList = connectionsTab === 'followers' ? followersList : followingList;
  const filteredList = displayedList.filter((user) =>
    user.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openPost = (post) => {
    setSelectedPost(post);
  };

  const closePost = () => {
    setSelectedPost(null);
  };

  const navigatePost = (direction) => {
    if (!selectedPost) return;
    const currentIndex = userPosts.findIndex(p => p.id === selectedPost.id);
    let newIndex;
    if (direction === 'next') {
      newIndex = currentIndex < userPosts.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : userPosts.length - 1;
    }
    setSelectedPost(userPosts[newIndex]);
  };

  // Full screen post modal
  if (selectedPost) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <button
          onClick={closePost}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            border: 'none',
            borderRadius: '50%',
            width: '3rem',
            height: '3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 101
          }}
        >
          <X style={{ width: '1.5rem', height: '1.5rem' }} />
        </button>

        <button
          onClick={() => navigatePost('prev')}
          style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            border: 'none',
            borderRadius: '50%',
            width: '3rem',
            height: '3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 101
          }}
        >
          <ChevronLeft style={{ width: '1.5rem', height: '1.5rem' }} />
        </button>

        <button
          onClick={() => navigatePost('next')}
          style={{
            position: 'absolute',
            right: '1rem',
            top: '50%',
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            border: 'none',
            borderRadius: '50%',
            width: '3rem',
            height: '3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 101
          }}
        >
          <ChevronRight style={{ width: '1.5rem', height: '1.5rem' }} />
        </button>

        <div style={{
          maxWidth: isMobile ? '100%' : '80%',
          maxHeight: '90%',
          backgroundColor: 'hsl(var(--background))',
          borderRadius: isMobile ? '0' : '0.5rem',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <div style={{
            flex: isMobile ? 'none' : '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'black'
          }}>
            <img
              src={selectedPost.media_url}
              alt={selectedPost.caption}
              style={{
                maxWidth: '100%',
                maxHeight: isMobile ? '60vh' : '100%',
                objectFit: 'contain'
              }}
            />
          </div>
          <div style={{
            width: isMobile ? '100%' : '400px',
            padding: '1rem',
            overflowY: 'auto'
          }}>
            <SocialPost post={selectedPost} />
          </div>
        </div>
      </div>
    );
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
          maxWidth: isMobile ? '28rem' : '60rem',
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
                color: 'hsl(var(--foreground))',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft style={{ width: '1.5rem', height: '1.5rem' }} />
              <span>Back</span>
            </button>
          ) : (
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft style={{ width: '1.5rem', height: '1.5rem', color: 'hsl(var(--foreground))' }} />
            </button>
          )}
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 'bold',
            fontSize: '1.25rem',
            color: 'hsl(var(--foreground))'
          }}>
            @{userData.username}
          </h1>
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Settings style={{ width: '1.5rem', height: '1.5rem', color: 'hsl(var(--foreground))' }} />
          </button>
        </div>
      </header>

      <main style={{ maxWidth: isMobile ? '28rem' : '60rem', margin: '0 auto' }}>
        {showConnections ? (
          <>
            <Tabs value={connectionsTab} onValueChange={() => {}} style={{ padding: '1rem 1rem 0' }}>
              <TabsList style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                width: '100%',
                marginBottom: '1rem'
              }}>
                <TabsTrigger value="followers" activeTab={connectionsTab} setActiveTab={setConnectionsTab}>Followers</TabsTrigger>
                <TabsTrigger value="following" activeTab={connectionsTab} setActiveTab={setConnectionsTab}>Following</TabsTrigger>
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

              <TabsContent value="followers" activeTab={connectionsTab}>
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

              <TabsContent value="following" activeTab={connectionsTab}>
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
            <section style={{ 
              padding: '1.5rem', 
              display: 'grid', 
              gap: '1.5rem',
              maxWidth: isMobile ? '100%' : '600px',
              margin: '0 auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <img 
                    src={userData.avatar_url} 
                    alt="avatar" 
                    style={{ 
                      width: isMobile ? '5rem' : '9rem', 
                      height: isMobile ? '5rem' : '9rem', 
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
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Camera style={{ width: '1rem', height: '1rem', color: 'white' }} />
                  </button>
                </div>
                <div style={{ flex: 1, display: 'grid', gap: '1rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-around',
                    gap: isMobile ? '1rem' : '2rem'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{userData.posts_count}</div>
                      <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>Posts</div>
                    </div>
                    <button 
                      onClick={() => {
                        setConnectionsTab('followers');
                        setShowConnections(true);
                      }}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'center' }}
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
                      style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'center' }}
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

            <Tabs value={activeTab} onValueChange={() => {}} style={{ width: '100%' }}>
              <TabsList style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                borderTop: '1px solid hsl(var(--border))',
                maxWidth: isMobile ? '100%' : '600px',
                margin: isMobile ? "0 3%" : "0 auto"
              }}>
                <TabsTrigger value="posts" activeTab={activeTab} setActiveTab={setActiveTab}>
                  <Grid3X3 style={{ width: '1rem', height: '1rem' }} /> Posts
                </TabsTrigger>
                <TabsTrigger value="liked" activeTab={activeTab} setActiveTab={setActiveTab}>
                  <Heart style={{ width: '1rem', height: '1rem' }} /> Liked
                </TabsTrigger>
                <TabsTrigger value="saved" activeTab={activeTab} setActiveTab={setActiveTab}>
                  <Bookmark style={{ width: '1rem', height: '1rem' }} /> Saved
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" activeTab={activeTab}>
                {isMobile ? (
                  <div style={{ padding: '1rem', display: 'grid', gap: '1.5rem' }}>
                    {userPosts.map(post => (
                      <SocialPost key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    padding: '1rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(15rem, 1fr))',
                    gap: '1rem'
                  }}>
                    {userPosts.map(post => (
                      <div
                        key={post.id}
                        onClick={() => openPost(post)}
                        style={{
                          position: 'relative',
                          aspectRatio: '1',
                          cursor: 'pointer',
                          borderRadius: '0.375rem',
                          overflow: 'hidden',
                          border: '1px solid hsl(var(--border))'
                        }}
                      >
                        <img
                          src={post.media_url}
                          alt={post.caption}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.2s ease'
                          }}
                         
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                          color: 'white',
                          padding: '1rem',
                          fontSize: '0.875rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Heart style={{ width: '1rem', height: '1rem' }} />
                              {post.likes_count.toLocaleString()}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              💬 {post.comments_count}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="liked" activeTab={activeTab}>
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
              <TabsContent value="saved" activeTab={activeTab}>
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