import { API_BASE_URL } from "@/config/api";

export interface Email {
  id: string;
  sender: string;
  subject: string;
  date: string;
  category: string;
  preview: string;
  body?: string;
  bodyHtml?: string; // HTML body if available
  accountId?: string; // Account ID (account1 or account2)
}

export interface EmailStats {
  total: number;
  interested: number;
  notInterested: number;
  meetings: number;
  outOfOffice: number;
  spam: number;
}

/**
 * Fetch all emails with optional filters
 */
export async function fetchAllEmails(filters?: {
  category?: string;
  accountId?: string;
  folder?: string;
  limit?: number;
  skip?: number;
}): Promise<Email[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.accountId) params.append("accountId", filters.accountId);
    if (filters?.folder) params.append("folder", filters.folder);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.skip) params.append("skip", filters.skip.toString());

    const url = `${API_BASE_URL}/emails${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch emails (${response.status}): ${errorText || response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching emails:", error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error("Cannot connect to backend API. Make sure the server is running.");
    }
    throw error;
  }
}

/**
 * Fetch a single email by ID
 */
export async function fetchEmailById(id: string, accountId?: string): Promise<Email> {
  try {
    const params = new URLSearchParams();
    if (accountId) params.append("accountId", accountId);

    const url = `${API_BASE_URL}/emails/${id}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Email not found");
      }
      throw new Error(`Failed to fetch email: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching email:", error);
    throw error;
  }
}

/**
 * Search emails using Elasticsearch
 * @param query - Search query text
 * @param accountId - Optional account ID to filter by (account1, account2, or undefined for all accounts)
 */
export async function searchEmails(
  query: string,
  accountId?: string
): Promise<Email[]> {
  try {
    if (!query.trim()) {
      return [];
    }

    // Build URL with query and optional accountId
    const params = new URLSearchParams();
    params.append("query", query);
    if (accountId) {
      params.append("accountId", accountId);
    }

    const url = `${API_BASE_URL}/emails/search?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to search emails (${response.status}): ${errorText || response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error searching emails:", error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error("Cannot connect to backend API. Make sure the server is running.");
    }
    throw error;
  }
}

/**
 * Fetch emails by category with optional accountId
 */
export async function fetchEmailsByCategory(
  category: string,
  accountId?: string
): Promise<Email[]> {
  try {
    const params = new URLSearchParams();
    params.append("category", category);
    if (accountId) params.append("accountId", accountId);

    const url = `${API_BASE_URL}/emails?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch emails (${response.status}): ${errorText || response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching emails by category:", error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error("Cannot connect to backend API. Make sure the server is running.");
    }
    throw error;
  }
}

/**
 * Fetch email statistics
 */
export async function fetchStats(accountId?: string): Promise<EmailStats> {
  try {
    const params = new URLSearchParams();
    if (accountId) params.append("accountId", accountId);

    const url = `${API_BASE_URL}/emails/stats/summary${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch stats (${response.status}): ${errorText || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching stats:", error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error("Cannot connect to backend API. Make sure the server is running.");
    }
    throw error;
  }
}

