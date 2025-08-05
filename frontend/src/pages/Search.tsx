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
    <div className="search-page-container">
      <SearchHeader 
        query={query} 
        onQueryChange={setQuery}
        // onFilterChange={setSearchFilter}
        // activeFilter={searchFilter}
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
            <div className="welcome-header">
              <h2 className="welcome-title">
                Welcome to Mastagram
              </h2>
              <p className="welcome-subtitle">
                Discover amazing posts and connect with creators
              </p>
            </div>
            
            <div className="hashtag-grid">
              {['#trending', '#viral', '#creative', '#inspiration'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="hashtag-button"
                >
                  <span className="hashtag-text">
                    {tag}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="results-container">
          {results.map((item) => {
            if ('content' in item) {
              const post = item as FederatedPost;
              return <SocialPost key={post.id} post={post} />;
            } else {
              const user = item as User;
              return <UserCard key={user.id} user={user} />;
            }
          })}
        </div>

        {results.length < total && !loading && (
          <div className="load-more-container">
            <button
              onClick={loadMore}
              className="load-more-button"
            >
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