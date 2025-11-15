import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface AccountSelectorProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

// Account mapping: accountId -> email address
const ACCOUNT_EMAILS: Record<string, string> = {
  account1: "akshaywizard998@gmail.com",
  account2: "akshaywizard997@gmail.com",
};

export function AccountSelector({ value, onChange }: AccountSelectorProps) {
  const handleValueChange = (newValue: string) => {
    // Convert empty string to undefined for "All Accounts"
    onChange(newValue === "all" ? undefined : newValue);
  };

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="account-selector" className="text-sm font-medium text-foreground">
        Account:
      </Label>
      <Select value={value || "all"} onValueChange={handleValueChange}>
        <SelectTrigger id="account-selector" className="w-[220px]">
          <SelectValue placeholder="Select account" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Accounts</SelectItem>
          <SelectItem value="account1">{ACCOUNT_EMAILS.account1}</SelectItem>
          <SelectItem value="account2">{ACCOUNT_EMAILS.account2}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// Export helper function to get email from accountId
export function getAccountEmail(accountId?: string): string | undefined {
  if (!accountId) return undefined;
  return ACCOUNT_EMAILS[accountId];
}

