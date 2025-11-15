import { useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { SearchBar } from "@/components/SearchBar";
import { StatsCards } from "@/components/StatsCards";
import { EmailList } from "@/components/EmailList";
import { EmailViewer } from "@/components/EmailViewer";
import { AccountSelector } from "@/components/AccountSelector";
import { fetchAllEmails, fetchEmailById, searchEmails, Email } from "@/api/emails";
import { useQuery } from "@tanstack/react-query";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("inbox");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [accountId, setAccountId] = useState<string | undefined>(undefined);

  // Fetch all emails - always pass accountId if set, and category if not inbox
  const { data: allEmails = [], isLoading: isLoadingEmails, error: emailsError, refetch: refetchEmails } = useQuery({
    queryKey: ["emails", activeCategory, accountId],
    queryFn: () => {
      const filters: { category?: string; accountId?: string } = {};
      // Always set category if not inbox
      if (activeCategory !== "inbox") {
        filters.category = activeCategory;
      }
      // Always pass accountId if it's set
      if (accountId) {
        filters.accountId = accountId;
      }
      return fetchAllEmails(filters);
    },
    enabled: !isSearchMode,
    retry: 2,
    retryDelay: 1000,
  });

  // Search emails - pass accountId directly (undefined for "All Accounts")
  const { data: searchResults = [], isLoading: isSearching, error: searchError } = useQuery({
    queryKey: ["search", searchQuery.trim(), accountId],
    queryFn: () => {
      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery) {
        return Promise.resolve([]);
      }
      return searchEmails(trimmedQuery, accountId);
    },
    enabled: isSearchMode && !!searchQuery.trim(),
    retry: 1,
    retryDelay: 500,
  });

  // Find the email from the list to get accountId
  const getEmailAccountId = (emailId: string | null): string | undefined => {
    if (!emailId) return undefined;
    const email = [...allEmails, ...searchResults].find(e => e.id === emailId);
    return email?.accountId;
  };

  // Fetch selected email
  const { data: selectedEmail, isLoading: isLoadingEmail } = useQuery({
    queryKey: ["email", selectedEmailId],
    queryFn: async () => {
      if (!selectedEmailId) return null;
      const accountId = getEmailAccountId(selectedEmailId);
      
      if (accountId) {
        return await fetchEmailById(selectedEmailId, accountId);
      }
      
      // Fallback: try both accounts if accountId not available
      try {
        return await fetchEmailById(selectedEmailId, "account1");
      } catch {
        try {
          return await fetchEmailById(selectedEmailId, "account2");
        } catch {
          throw new Error("Email not found");
        }
      }
    },
    enabled: !!selectedEmailId,
  });

  // Determine which emails to display
  // Backend already filters by category and accountId, so we just use the results directly
  const filteredEmails = isSearchMode ? searchResults : allEmails;

  const handleSearch = (query: string) => {
    const trimmedQuery = query.trim();
    setSearchQuery(query);
    setIsSearchMode(!!trimmedQuery);
    if (trimmedQuery) {
      setSelectedEmailId(null);
    } else {
      // Clear search mode when query is empty
      setIsSearchMode(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setIsSearchMode(false);
    setSearchQuery("");
    setSelectedEmailId(null);
    // Query will automatically refetch due to queryKey change
  };

  const handleAccountChange = (newAccountId: string | undefined) => {
    setAccountId(newAccountId);
    setSelectedEmailId(null); // Clear selected email when account changes
    // Query will automatically refetch due to queryKey change
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar 
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        accountId={accountId}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-4 border-b border-border bg-card">
          <div className="flex-1">
            <SearchBar 
              onSearch={handleSearch}
              searchQuery={searchQuery}
            />
          </div>
          <AccountSelector 
            value={accountId}
            onChange={handleAccountChange}
          />
        </div>
        
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <StatsCards accountId={accountId} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground capitalize">
                    {isSearchMode ? "Search Results" : activeCategory.replace("-", " ")}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {isSearchMode 
                      ? (isSearching ? "Searching..." : `${filteredEmails.length} results`)
                      : (isLoadingEmails ? "Loading..." : `${filteredEmails.length} emails`)
                    }
                  </span>
                </div>
                {(emailsError || searchError) && (
                  <div className="text-destructive text-sm p-4 bg-destructive/10 rounded">
                    <p className="font-semibold">Error {isSearchMode ? "searching" : "loading"} emails</p>
                    <p>{(emailsError || searchError) instanceof Error ? (emailsError || searchError)?.message : "Unknown error"}</p>
                    <p className="text-xs mt-2">Make sure the backend is running on http://localhost:4000</p>
                  </div>
                )}
                <EmailList 
                  emails={filteredEmails}
                  selectedEmailId={selectedEmailId}
                  onEmailSelect={setSelectedEmailId}
                  isLoading={isSearchMode ? isSearching : isLoadingEmails}
                />
              </div>
              
              <div>
                <EmailViewer 
                  email={selectedEmail || null} 
                  isLoading={isLoadingEmail}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
