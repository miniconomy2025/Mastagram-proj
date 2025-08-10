import { useState, useEffect, useRef } from 'react';
import { SearchHeader } from '@/components/SearchHeader';
import { SocialPost } from '@/components/SocialPost';
import { UserCard } from '@/components/UserCard';
import { Loader2, TrendingUp } from 'lucide-react';
import './Search.css';
import { FederatedPost, User } from '@/types/federation';

const PAGE_SIZE = 10;

const Search = () => {
  const [query, setQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'users' | 'hashtags'>('all');
  const [results, setResults] = useState<(User | FederatedPost)[]>([]);
  const [defaultUsers, setDefaultUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [defaultUsersLoading, setDefaultUsersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const abortController = useRef<AbortController | null>(null);

  const filterDuplicates = (items: (User)[]) => {
    const seen = new Set();
    return items.filter(item => {
      const duplicate = seen.has(item.id);
      seen.add(item.id);
      return !duplicate;
    });
  };

  useEffect(() => {
    const fetchDefaultUsers = async () => {
      try {
        setDefaultUsersLoading(true);
        const response = await fetch('https://todo-secure-list.xyz/api/federation/suggested-users?limit=10');
        if (!response.ok) throw new Error('Failed to fetch default users');
        
        const data = await response.json();
        const mappedUsers: User[] = data.map((user: any) => ({
          id: user.id,
          username: user.handle,
          display_name: user.name,
          bio: user.bio,
          avatar_url: user.avatarUrl,
          follower_count: user.followers,
          following_count: user.following,
          created_at: user.createdAt,
        }));
        
        setDefaultUsers(filterDuplicates(mappedUsers));
      } catch (err) {
        console.error('Error fetching default users:', err);
      } finally {
        setDefaultUsersLoading(false);
      }
    };

    fetchDefaultUsers();
  }, []);

  const fetchResults = (initial = false) => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    const cursorParam = nextCursor ? `&cursor=${nextCursor}` : '';
    const typeParam =
      searchFilter === 'users'
        ? '&type=user'
        : searchFilter === 'hashtags'
        ? '&type=post'
        : '';
    const url = `https://todo-secure-list.xyz/api/federation/search?q=${encodeURIComponent(
      query
    )}${typeParam}${cursorParam}&limit=${PAGE_SIZE}`;

    fetch(url, { signal: abortController.current.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Error: ${res.statusText}`);
        const data = await res.json();

        const mappedUsers: User[] = (data.users ?? []).map((user: any) => ({
          id: user.id,
          username: user.handle,
          display_name: user.name,
          bio: user.bio,
          avatar_url: user.avatarUrl,
          follower_count: user.followers,
          following_count: user.following,
          created_at: user.createdAt,
        }));

        const newResults: (User | FederatedPost)[] = [
          ...filterDuplicates(mappedUsers),
          ...(data.posts ?? []),
        ];

        setResults((prev) => (initial ? newResults : [...prev, ...newResults]));
        setNextCursor(data.next ?? null);
        setTotal(data.count ?? 0);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTotal(0);
      setNextCursor(null);
      setError(null);
      return;
    }

    setNextCursor(null);
    fetchResults(true);
  }, [query]);

  const loadMore = () => {
    if (!loading && nextCursor) {
      fetchResults();
    }
  };

  return (
    <div className="search-page-container">
      <SearchHeader
        query={query}
        onQueryChange={setQuery}
        isLoading={loading}
      />

      <main className="search-page-main">
        {error && (
          <div className="error-message">
            <p className="error-text">{error}</p>
          </div>
        )}

        {loading && results.length === 0 && (
          <div className="loading-container">
            <Loader2 className="loading-spinner" />
            <p className="loading-text">Searching for content...</p>
          </div>
        )}

        {!loading && results.length === 0 && query.trim() && (
          <div className="no-results">
            <div className="no-results-icon">
              <TrendingUp />
            </div>
            <h3 className="no-results-title">No results found</h3>
            <p className="no-results-text">Try searching for something else</p>
          </div>
        )}

        {!query.trim() && (
          <div className="welcome-section">
            <div className="default-users-section">
              <h3 className="default-users-title">Suggested Creators</h3>
              {defaultUsersLoading ? (
                <div className="loading-container">
                  <Loader2 className="loading-spinner" />
                </div>
              ) : (
                <div className="default-users-grid">
                  {defaultUsers.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="results-container">
          {results.map((item) =>
            'content' in item ? (
              <SocialPost key={item.id} post={item} />
            ) : (
              <UserCard key={item.id} user={item} />
            )
          )}
        </div>

        {nextCursor && !loading && (
          <div className="load-more-container">
            <button onClick={loadMore} className="load-more-button">
              Load More Content
            </button>
          </div>
        )}

        {loading && results.length > 0 && (
          <div className="loading-more">
            <Loader2 className="loading-more-spinner" />
          </div>
        )}
      </main>
    </div>
  );
};

export default Search;