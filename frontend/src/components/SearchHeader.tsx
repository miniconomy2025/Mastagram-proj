import { Search } from 'lucide-react';
import { ChangeEvent } from 'react';
import './SearchHeader.css';

interface SearchHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  isLoading: boolean;
}

export const SearchHeader = ({ query, onQueryChange, isLoading }: SearchHeaderProps) => {
  return (
    <div className="search-header">
      <div className="search-container">
        <div className="search-wrapper">
          <div className="search-icon">
            <Search size={20} stroke="hsl(var(--muted-foreground))" />
          </div>

          <input
            type="search"
            placeholder="Search users..."
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onQueryChange(e.target.value)
            }
            className="search-input"
          />

          {query && (
            <div className="search-indicator">
              {isLoading ? (
                <div className="spinner"></div> 
              ) : (
                <div className="search-pulse"></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};