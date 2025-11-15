import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Calendar, Reply, Forward, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

interface Email {
  id: string;
  sender: string;
  subject: string;
  date: string;
  category: string;
  preview: string;
  body?: string;
  bodyHtml?: string;
}

interface EmailViewerProps {
  email: Email | null;
  isLoading?: boolean;
}

const categoryColors: Record<string, string> = {
  interested: "bg-success/10 text-success",
  "not-interested": "bg-destructive/10 text-destructive",
  meetings: "bg-info/10 text-info",
  "out-of-office": "bg-warning/10 text-warning",
  spam: "bg-muted text-muted-foreground",
  inbox: "bg-primary/10 text-primary",
};

export function EmailViewer({ email, isLoading }: EmailViewerProps) {
  if (isLoading) {
    return (
      <Card className="border-border h-full flex items-center justify-center">
        <CardContent className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading email...</p>
        </CardContent>
      </Card>
    );
  }

  if (!email) {
    return (
      <Card className="border-border h-full flex items-center justify-center">
        <CardContent className="text-center p-8">
          <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Select an email to view</p>
          <p className="text-sm text-muted-foreground mt-2">Click on any email from the list to view its details</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border h-full flex flex-col">
      <CardHeader className="border-b border-border pb-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">{email.subject}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{email.sender}</span>
                <span>•</span>
                <span>{email.date}</span>
              </div>
            </div>
            <Badge variant="secondary" className={cn("capitalize", categoryColors[email.category])}>
              {email.category.replace("-", " ")}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-2">
              <Reply className="h-4 w-4" />
              Reply
            </Button>
            <Button size="sm" variant="outline" className="gap-2">
              <Forward className="h-4 w-4" />
              Forward
            </Button>
            <Button size="sm" variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Schedule
            </Button>
            <Button size="sm" variant="outline" className="gap-2">
              <Archive className="h-4 w-4" />
              Archive
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-6 overflow-auto">
        <div className="prose prose-sm max-w-none">
          {(() => {
            // Helper function to clean and render HTML content
            const getEmailContent = (): { isHtml: boolean; content: string } => {
              // Prefer bodyHtml if available
              let htmlContent = email.bodyHtml || email.body || email.preview;
              
              if (!htmlContent) {
                return { isHtml: false, content: email.preview || "No content available" };
              }

              // Check if content is HTML
              const isHtml = htmlContent.includes('<') && htmlContent.includes('>');
              
              if (!isHtml) {
                // Plain text - return as is
                return { isHtml: false, content: htmlContent };
              }

              // Clean HTML: Remove broken CSS, scripts, and style tags
              try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlContent, "text/html");
                
                // Remove script and style tags
                const scripts = doc.querySelectorAll('script, style, noscript');
                scripts.forEach(el => el.remove());
                
                // Remove inline styles but keep structure
                const allElements = doc.querySelectorAll('*');
                allElements.forEach(el => {
                  // Remove style attributes
                  el.removeAttribute('style');
                  // Remove class attributes that might have broken CSS
                  const classes = el.className;
                  if (classes && typeof classes === 'string') {
                    // Keep only safe classes, remove Gmail-specific broken classes
                    const safeClasses = classes.split(' ').filter(cls => 
                      !cls.includes('gmail') && 
                      !cls.includes('yahoo') && 
                      !cls.startsWith('mso') &&
                      cls.length < 50 // Avoid very long class names
                    );
                    if (safeClasses.length > 0) {
                      el.className = safeClasses.join(' ');
                    } else {
                      el.removeAttribute('class');
                    }
                  }
                });

                // Get cleaned HTML
                let cleanedHtml = doc.body.innerHTML;
                
                // Additional cleanup: Remove Gmail-specific broken attributes
                cleanedHtml = cleanedHtml
                  .replace(/style="[^"]*"/gi, '') // Remove all style attributes
                  .replace(/class="[^"]*gmail[^"]*"/gi, '') // Remove Gmail classes
                  .replace(/class="[^"]*mso[^"]*"/gi, '') // Remove MSO classes
                  .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
                  .replace(/data-[^=]*="[^"]*"/gi, ''); // Remove data attributes

                return { isHtml: true, content: cleanedHtml };
              } catch (error) {
                console.error("Error processing HTML:", error);
                // Fallback: extract text only
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlContent, "text/html");
                const textContent = doc.body.textContent || doc.body.innerText || htmlContent;
                return { isHtml: false, content: textContent };
              }
            };

            const { isHtml, content } = getEmailContent();

            if (isHtml) {
              return (
                <div 
                  className="email-body-html"
                  dangerouslySetInnerHTML={{ __html: content }}
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: 'inherit',
                  }}
                />
              );
            }

            return (
              <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                {content}
              </div>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
