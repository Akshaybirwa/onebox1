import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Activity, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  searchQuery: string;
}

export function SearchBar({ onSearch, searchQuery: externalQuery }: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(externalQuery);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local query with external query
  useEffect(() => {
    setLocalQuery(externalQuery);
  }, [externalQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Clear any pending debounced search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    onSearch(localQuery);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If empty, search immediately
    if (!value.trim()) {
      onSearch("");
      return;
    }

    // Debounce search for 500ms after user stops typing
    debounceTimerRef.current = setTimeout(() => {
      onSearch(value);
    }, 500);
  };

  const handleClear = () => {
    setLocalQuery("");
    // Clear any pending debounced search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    onSearch("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-4">
      <form onSubmit={handleSubmit} className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search emails using Elasticsearch..."
          className="pl-10 pr-10 h-11 bg-background"
          value={localQuery}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            // Trigger search on Enter key
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        {localQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-success/10">
          <Activity className="h-4 w-4 text-success animate-pulse" />
          <span className="text-sm font-medium text-success">IMAP Sync: Connected</span>
        </div>
        <Button variant="outline">Filter</Button>
      </div>
    </div>
  );
}
