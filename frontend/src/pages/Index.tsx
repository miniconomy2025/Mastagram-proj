import { useState, useEffect, useRef, useCallback } from 'react';
import { SocialPost } from '@/components/SocialPost';
import { Loader2, Home, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  altText?: string;
}

interface Post {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  avatar?: string;
  caption: string;
  hashtags: string[];
  media?: MediaItem[]; // Optional
  likes_count: number;
  comments_count: number;
  created_at: string;
}

const Index = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const observer = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const mockPostsData: Post[] = [
    {
      id: '1',
      user_id: 'user1',
      username: 'alex_j',
      display_name: 'Alex Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
      caption: 'Sunset vibes 🌅 #weekendmood',
      hashtags: ['sunset', 'beach', 'weekendmood'],
      media: [
        {
          id: 'm1',
          url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
          type: 'image',
        },
        {
          id: 'm2',
          url: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
          type: 'video',
        },
        {
          id: 'm3',
          url: 'https://images.unsplash.com/photo-1510784722466-f2aa9c52fff6?w=800',
          type: 'image',
        }
      ],
      likes_count: 1243,
      comments_count: 182,
      created_at: '2024-07-01T18:00:00Z',
    },
    {
      id: '2',
      user_id: 'user2',
      username: 'jane_doe',
      display_name: 'Jane Doe',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
      caption: 'Just my thoughts today... #motivation #inspiration',
      hashtags: ['motivation', 'inspiration', 'thoughts'],
      media: [
        {
          id: 'm4',
          url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
          type: 'image',
        }
      ],
      likes_count: 543,
      comments_count: 67,
      created_at: '2024-07-02T08:30:00Z',
    },
    {
      id: '3',
      user_id: 'user3',
      username: 'chef_kai',
      display_name: 'Kai Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kai',
      caption: 'New ramen recipe drop! 🍜 Who wants the recipe? #foodie #homecooking',
      hashtags: ['food', 'recipe', 'ramen', 'foodie', 'homecooking'],
      media: [
        {
          id: 'm5',
          url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800',
          type: 'image',
        },
        {
          id: 'm6',
          url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
          type: 'image',
        }
      ],
      likes_count: 2894,
      comments_count: 423,
      created_at: '2024-07-03T12:00:00Z',
    },
    {
      id: '4',
      user_id: 'user4',
      username: 'tech_nerd',
      display_name: 'Leo Martin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=leo',
      caption: 'AI will change everything. Working on some exciting projects! 🤖 #tech #ai #future',
      hashtags: ['tech', 'ai', 'future', 'innovation'],
      media: [
        {
          id: 'm7',
          url: 'https://images.unsplash.com/photo-1581092795360-7b1c69e82b94?w=800',
          type: 'image',
        },
        {
          id: 'm8',
          url: 'https://samplelib.com/lib/preview/mp4/sample-15s.mp4',
          type: 'video',
        },
        {
          id: 'm9',
          url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800',
          type: 'image',
        }
      ],
      likes_count: 3112,
      comments_count: 587,
      created_at: '2024-07-04T15:45:00Z',
    },
    {
      id: '5',
      user_id: 'user5',
      username: 'wanderlust_lina',
      display_name: 'Lina M.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lina',
      caption: 'Road trip across South Africa 🇿🇦 Day 3: Cape Town views! #travel #adventure #roadtrip',
      hashtags: ['travel', 'roadtrip', 'adventure', 'capetown'],
      media: [
        {
          id: 'm10',
          url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
          type: 'image',
        },
        {
          id: 'm11',
          url: 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4',
          type: 'video',
        },
        {
          id: 'm12',
          url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
          type: 'image',
        },
        {
          id: 'm13',
          url: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800',
          type: 'image',
        }
      ],
      likes_count: 5230,
      comments_count: 892,
      created_at: '2024-07-05T10:00:00Z',
    },
    {
      id: '6',
      user_id: 'user6',
      username: 'code_with_sam',
      display_name: 'Sam Patel',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sam',
      caption: 'Today I finally cracked that bug after 3 days! 🐛💥 #coding #webdev #programming',
      hashtags: ['coding', 'developerlife', 'webdev', 'programming'],
      media: [
        {
          id: 'm14',
          url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
          type: 'image',
        }
      ],
      likes_count: 987,
      comments_count: 156,
      created_at: '2024-07-06T14:22:00Z',
    },
    {
      id: '7',
      user_id: 'user7',
      username: 'nature_lover',
      display_name: 'Tumi Khumalo',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tumi',
      caption: 'Early morning hike with the crew 🌄 #nature #hiking #weekend',
      hashtags: ['hiking', 'nature', 'weekend', 'outdoors'],
      media: [
        {
          id: 'm15',
          url: 'https://images.unsplash.com/photo-1518684079-0e4283d2efb8?w=800',
          type: 'image',
        },
        {
          id: 'm16',
          url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
          type: 'image',
        }
      ],
      likes_count: 1854,
      comments_count: 223,
      created_at: '2024-07-07T06:45:00Z',
    },
    {
      id: '8',
      user_id: 'user8',
      username: 'fitness_guru',
      display_name: 'Jamie Wilson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jamie',
      caption: 'New personal best today! 225lb bench press 💪 #fitness #gym #progress',
      hashtags: ['fitness', 'gym', 'progress', 'workout'],
      media: [
        {
          id: 'm17',
          url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
          type: 'image',
        },
        {
          id: 'm18',
          url: 'https://samplelib.com/lib/preview/mp4/sample-20s.mp4',
          type: 'video',
        }
      ],
      likes_count: 3421,
      comments_count: 498,
      created_at: '2024-07-08T19:15:00Z',
    },
    {
      id: '9',
      user_id: 'user9',
      username: 'art_by_mia',
      display_name: 'Mia Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mia',
      caption: 'Finished my latest piece - "Ocean Dreams" 🌊 #art #painting #creative',
      hashtags: ['art', 'painting', 'creative', 'artist'],
      media: [
        {
          id: 'm19',
          url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
          type: 'image',
        },
        {
          id: 'm20',
          url: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800',
          type: 'image',
        },
        {
          id: 'm21',
          url: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800',
          type: 'image',
        }
      ],
      likes_count: 2897,
      comments_count: 412,
      created_at: '2024-07-09T14:30:00Z',
    },
    {
      id: '10',
      user_id: 'user10',
      username: 'music_producer',
      display_name: 'DJ Kev',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kev',
      caption: 'New track dropping next week! Here\'s a teaser 🎧 #music #producer #edm',
      hashtags: ['music', 'producer', 'edm', 'djmix'],
      media: [
        {
          id: 'm22',
          url: 'https://samplelib.com/lib/preview/mp4/sample-30s.mp4',
          type: 'video',
        }
      ],
      likes_count: 5872,
      comments_count: 1023,
      created_at: '2024-07-10T11:20:00Z',
    }
  ];


  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      try {
        const startIndex = (page - 1) * 3;
        const endIndex = startIndex + 3;
        const paginatedPosts = mockPostsData.slice(startIndex, endIndex);

        if (page === 1) {
          setPosts(paginatedPosts);
        } else {
          setPosts((prev) => [...prev, ...paginatedPosts]);
        }

        setHasMore(endIndex < mockPostsData.length);
        setIsLoading(false);
      } catch (error) {
        setError('Failed to load posts. Please try again.');
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [page, refreshTrigger]);

  const lastPostRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-primary rounded-xl">
                <Home className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-xl text-foreground">Feed</h1>
                <p className="text-muted-foreground text-sm">Discover trending content</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/search">
                <Button variant="ghost" size="icon">
                  <Search className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 pb-8">
        {error && (
          <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
            <p className="text-destructive text-center font-medium">{error}</p>
          </div>
        )}

        {isLoading && posts.length === 0 && (
          <div className="mt-8 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading your feed...</p>
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="mt-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Home className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-foreground">No posts yet</h3>
            <p className="text-muted-foreground">Check back later for new content!</p>
          </div>
        )}

        <div className="space-y-6 mt-6">
          {posts.map((post, index) => {
            if (posts.length === index + 1) {
              return (
                <div ref={lastPostRef} key={post.id}>
                  <SocialPost post={post} />
                </div>
              );
            } else {
              return <SocialPost key={post.id} post={post} />;
            }
          })}
        </div>

        {isLoading && posts.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
