import { useState, useEffect, useRef } from 'react';
import { SearchHeader } from '@/components/SearchHeader';
import { SocialPost } from '@/components/SocialPost';
import { UserCard } from '@/components/UserCard';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp } from 'lucide-react';

interface User {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  follower_count: number;
  following_count: number;
  created_at: string;
}

interface Post {
  id: string;
  user_id: string;
  username: string;
  caption: string;
  hashtags: string[];
  media_url: string;
  media_type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

const PAGE_SIZE = 10;

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<(User | Post)[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const abortController = useRef<AbortController | null>(null);

  // Fetch search results when query or page changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTotal(0);
      setError(null);
      setPage(1);
      return;
    }

    setLoading(true);
    setError(null);

    // Abort previous fetch if any
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    fetch(`http://localhost:4000/api/search?q=${encodeURIComponent(query)}&page=${page}&size=${PAGE_SIZE}`, {
      signal: abortController.current.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Error: ${res.statusText}`);
        const data = await res.json();
        console.log('Search results:', data);
        if (page === 1) {
          setResults(data.results);
        } else {
          setResults((prev) => [...prev, ...data.results]);
        }
        setTotal(data.total);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      });

  }, [query, page]);

  // Reset to first page when query changes
  useEffect(() => {
    setPage(1);
  }, [query]);

  const loadMore = () => {
    if (results.length < total && !loading) {
      setPage((p) => p + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader query={query} onQueryChange={setQuery} />

      <main className="max-w-md mx-auto px-4 pb-8">
        {error && (
          <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
            <p className="text-destructive text-center font-medium">{error}</p>
          </div>
        )}

        {loading && results.length === 0 && (
          <div className="mt-8 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground">Searching for content...</p>
          </div>
        )}

        {!loading && results.length === 0 && query.trim() && (
          <div className="mt-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-foreground">No results found</h3>
            <p className="text-muted-foreground">Try searching for something else</p>
          </div>
        )}

        {!query.trim() && (
          <div className="mt-6 text-center space-y-6">
            <div className="space-y-2">
              {/* <h2 className="font-heading font-bold text-xl text-foreground">
                Welcome to MastoInstaTok
              </h2> */}
              <p className="text-muted-foreground">
                Discover amazing posts and connect with creators
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {['#trending', '#viral', '#creative', '#inspiration'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="p-3 bg-gradient-secondary rounded-xl border border-border hover:border-primary transition-colors group"
                >
                  <span className="text-primary font-medium group-hover:text-accent transition-colors">
                    {tag}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6 mt-6">
          {results.map((item) => {
            if ('caption' in item) {
              const post = item as Post;
              return <SocialPost key={post.id} post={post} />;
            } else {
              const user = item as User;
              return <UserCard key={user.id} user={user} />;
            }
          })}
        </div>

        {results.length < total && !loading && (
          <div className="mt-8 text-center">
            <Button
              onClick={loadMore}
              variant="social"
              size="lg"
              className="w-full"
            >
              Load More Content
            </Button>
          </div>
        )}

        {loading && results.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}
      </main>
    </div>
  );
};

export default Search;