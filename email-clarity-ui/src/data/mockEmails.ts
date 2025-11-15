export interface Email {
  id: string;
  sender: string;
  subject: string;
  date: string;
  category: string;
  preview: string;
  body?: string;
}

export const mockEmails: Email[] = [
  {
    id: "1",
    sender: "john.smith@techcorp.com",
    subject: "Re: Partnership Opportunity",
    date: "2024-01-15",
    category: "interested",
    preview: "Thank you for reaching out. We're very interested in learning more about this opportunity...",
    body: "Thank you for reaching out. We're very interested in learning more about this opportunity and how we can collaborate. Our team has reviewed your proposal and we'd like to schedule a call next week to discuss further.\n\nWould Tuesday or Wednesday work for your schedule?\n\nBest regards,\nJohn Smith\nCTO, TechCorp Inc."
  },
  {
    id: "2",
    sender: "sarah.jones@startupco.io",
    subject: "Product Demo Request",
    date: "2024-01-15",
    category: "meetings",
    preview: "Hi, I'd like to schedule a demo of your platform. Are you available this week?",
    body: "Hi,\n\nI'd like to schedule a demo of your platform. Are you available this week?\n\nWe're looking for a solution that can help us manage our sales pipeline more effectively, and your product seems like a great fit.\n\nLooking forward to connecting!\n\nSarah Jones\nHead of Sales, StartupCo"
  },
  {
    id: "3",
    sender: "mike.brown@enterprise.com",
    subject: "Not a good fit",
    date: "2024-01-14",
    category: "not-interested",
    preview: "Thanks for your email, but we're currently working with another provider...",
    body: "Thanks for your email, but we're currently working with another provider and are not looking to make any changes at this time.\n\nWish you the best of luck!\n\nMike Brown"
  },
  {
    id: "4",
    sender: "lisa.wang@global.com",
    subject: "Out of Office: Annual Leave",
    date: "2024-01-14",
    category: "out-of-office",
    preview: "I am currently out of the office and will return on January 22nd...",
    body: "I am currently out of the office and will return on January 22nd.\n\nFor urgent matters, please contact my colleague James at james@global.com.\n\nBest regards,\nLisa Wang"
  },
  {
    id: "5",
    sender: "david.lee@solutions.net",
    subject: "Pricing Information Request",
    date: "2024-01-13",
    category: "interested",
    preview: "Could you please send me detailed pricing for your enterprise plan?",
    body: "Could you please send me detailed pricing for your enterprise plan?\n\nWe're a team of 50 people and looking to onboard in Q1.\n\nThanks,\nDavid Lee\nVP of Operations"
  },
  {
    id: "6",
    sender: "emily.chen@bigcorp.com",
    subject: "Follow-up: Last Week's Meeting",
    date: "2024-01-13",
    category: "meetings",
    preview: "Following up on our discussion last week about the implementation timeline...",
    body: "Following up on our discussion last week about the implementation timeline.\n\nOur team is ready to move forward with the next phase. Can we schedule a kickoff call?\n\nBest,\nEmily Chen\nProject Manager"
  },
  {
    id: "7",
    sender: "spam@marketing.xyz",
    subject: "Get Rich Quick!!!",
    date: "2024-01-12",
    category: "spam",
    preview: "Click here to make $10,000 in one week!!!",
    body: "Click here to make $10,000 in one week!!!\n\nThis is a limited time offer..."
  },
  {
    id: "8",
    sender: "alex.rodriguez@newventure.co",
    subject: "Thanks, but no thanks",
    date: "2024-01-12",
    category: "not-interested",
    preview: "We appreciate your outreach, but we're not looking for this type of solution right now...",
    body: "We appreciate your outreach, but we're not looking for this type of solution right now.\n\nPerhaps we can reconnect in 6 months?\n\nAlex Rodriguez"
  },
  {
    id: "9",
    sender: "jessica.taylor@innovate.com",
    subject: "Demo scheduled for Thursday",
    date: "2024-01-11",
    category: "meetings",
    preview: "Confirming our demo call scheduled for Thursday at 2 PM EST...",
    body: "Confirming our demo call scheduled for Thursday at 2 PM EST.\n\nI've sent you the calendar invite with the Zoom link.\n\nLooking forward to it!\n\nJessica Taylor\nAccount Executive"
  },
  {
    id: "10",
    sender: "robert.kim@consulting.org",
    subject: "Interested in exploring further",
    date: "2024-01-11",
    category: "interested",
    preview: "Your solution looks promising. Can we set up a call to discuss our requirements?",
    body: "Your solution looks promising. Can we set up a call to discuss our requirements?\n\nWe have a few specific use cases we'd like to explore.\n\nBest regards,\nRobert Kim\nSenior Consultant"
  }
];
