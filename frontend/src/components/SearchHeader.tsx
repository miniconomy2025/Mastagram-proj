import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export const SearchHeader = ({ query, onQueryChange }: SearchHeaderProps) => {
  return (
    <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-md mx-auto p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>

          <Input
            type="search"
            placeholder="Search posts and users..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="pl-10 pr-4 py-3 bg-input border-border text-foreground placeholder:text-muted-foreground rounded-2xl text-lg focus:ring-primary focus:border-primary transition-all duration-300"
          />

          {query && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse-glow"></div>
            </div>
          )}
        </div>

        <div className="text-center mt-4">
          <h1 className="font-heading font-bold text-2xl bg-gradient-primary bg-clip-text text-transparent">
            MastoInstaTok
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Discover amazing content
          </p>
        </div>
      </div>
    </div>
  );
};