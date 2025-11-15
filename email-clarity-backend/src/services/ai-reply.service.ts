import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY not found in environment variables. AI replies will not work.');
}

// Initialize Gemini AI client
let genAI: GoogleGenerativeAI | null = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

/**
 * Reply templates for different categories
 * These are the exact templates specified by the user
 */
const REPLY_TEMPLATES: Record<string, string> = {
  'interested': 'Thank you! Our team will reach out to you very soon. Please stay connected.',
  'not-interested': 'Thank you for your response! No worries, we won\'t disturb you further.',
  'out-of-office': 'Thank you for informing! We will follow up once you are back.'
};

/**
 * Generate AI reply using Google Gemini
 * Uses predefined templates for specific categories, or Gemini AI for other cases
 */
export async function generateAIReply(
  category: string,
  originalSubject: string,
  originalBody: string,
  senderEmail: string
): Promise<string> {
  // Categories that should not receive replies (as per requirements)
  if (category === 'spam' || category === 'meetings') {
    return '';
  }

  // Use predefined template for supported categories
  if (REPLY_TEMPLATES[category]) {
    console.log(`📝 Using template reply for category: ${category}`);
    return REPLY_TEMPLATES[category];
  }

  // For other categories (if any), optionally use Gemini to generate a reply
  // For now, return empty string (no reply for unknown categories)
  console.log(`ℹ️ No template or AI reply configured for category: ${category}`);
  return '';
}

/**
 * Get reply for a specific category (uses templates)
 */
export function getReplyForCategory(category: string): string {
  return REPLY_TEMPLATES[category] || '';
}

