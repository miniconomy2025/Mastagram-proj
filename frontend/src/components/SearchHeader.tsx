import { Search } from 'lucide-react';
import { ChangeEvent } from 'react';
import './SearchHeader.css';

interface SearchHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export const SearchHeader = ({ query, onQueryChange }: SearchHeaderProps) => {
  return (
    <div className="search-header">
      <div className="search-container">
        <div className="search-wrapper">
          <div className="search-icon">
            <Search size={20} stroke="hsl(var(--muted-foreground))" />
          </div>

          <input
            type="search"
            placeholder="Search posts and users..."
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onQueryChange(e.target.value)
            }
            className="search-input"
          />

          {query && (
            <div className="search-indicator">
              <div className="search-pulse"></div>
            </div>
          )}
        </div>

        {/*
        <div className="mastoinstatok-header">
          <h1 className="mastoinstatok-title">
            MastoInstaTok
          </h1>
          <p className="mastoinstatok-subtitle">
            Discover amazing content
          </p>
        </div>
        */}
      </div>
    </div>
  );
};
