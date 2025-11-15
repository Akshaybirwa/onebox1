export interface Email {
  id: string;
  from: string;
  to: string | string[];
  subject: string;
  bodyText: string;
  folder: string;
  date: Date;
  accountId: string;
  category: string;
  preview?: string;
}

export interface EmailDocument extends Email {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type EmailCategory = 
  | "interested" 
  | "not-interested" 
  | "meetings" 
  | "out-of-office" 
  | "spam" 
  | "inbox";

