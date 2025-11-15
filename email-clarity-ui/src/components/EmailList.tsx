import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getAccountEmail } from "@/components/AccountSelector";

interface Email {
  id: string;
  sender: string;
  subject: string;
  date: string;
  category: string;
  preview: string;
  accountId?: string;
}

interface EmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onEmailSelect: (id: string) => void;
  isLoading?: boolean;
}

const categoryColors: Record<string, string> = {
  interested: "bg-success/10 text-success hover:bg-success/20",
  "not-interested": "bg-destructive/10 text-destructive hover:bg-destructive/20",
  meetings: "bg-info/10 text-info hover:bg-info/20",
  "out-of-office": "bg-warning/10 text-warning hover:bg-warning/20",
  spam: "bg-muted text-muted-foreground hover:bg-muted",
  inbox: "bg-primary/10 text-primary hover:bg-primary/20",
};

export function EmailList({ emails, selectedEmailId, onEmailSelect, isLoading }: EmailListProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Loading emails...</p>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden p-8 text-center">
        <p className="text-muted-foreground">No emails found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[250px]">Sender</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead className="w-[140px]">Category</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {emails.map((email) => (
            <TableRow
              key={email.id}
              className={cn(
                "cursor-pointer transition-colors",
                selectedEmailId === email.id && "bg-muted"
              )}
              onClick={() => onEmailSelect(email.id)}
            >
              <TableCell className="font-medium">{email.sender}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium text-foreground">{email.subject}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">{email.preview}</div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{email.date}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={cn("capitalize", categoryColors[email.category])}>
                    {email.category.replace("-", " ")}
                  </Badge>
                  {email.accountId && (
                    <Badge variant="outline" className="text-xs">
                      {getAccountEmail(email.accountId) || email.accountId}
                    </Badge>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
