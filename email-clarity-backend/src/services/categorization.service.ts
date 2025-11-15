import { EmailCategory } from '../types/email';

/**
 * Robust email classification function
 * Classifies emails based on subject, body, and sender
 */
export function classifyEmail(subject: string, body: string, from: string): EmailCategory {
  // Normalize inputs
  const normalizedSubject = (subject || '').toLowerCase().trim();
  const normalizedBody = (body || '').toLowerCase().trim();
  const normalizedFrom = (from || '').toLowerCase().trim();
  const combinedText = `${normalizedSubject} ${normalizedBody}`;

  // 1. Check for SPAM indicators first (highest priority)
  // Transactional emails, notifications, OTP, newsletter, promo, or from no-reply@
  const spamIndicators = [
    'no-reply@',
    'noreply@',
    'donotreply@',
    'notifications@',
    'notification@',
    'noreply',
    'no-reply',
    'unsubscribe',
    'newsletter',
    'promo',
    'promotion',
    'discount',
    'sale',
    'deal',
    'offer',
    'otp',
    'verification code',
    'security alert',
    'password reset',
    'account verification',
    'transactional',
    'receipt',
    'invoice',
    'order confirmation',
    'shipping confirmation',
    'delivery notification',
    'auto-reply',
    'automatic reply',
    'out of office',
    'away until',
    'vacation',
    'ooo',
    'out of the office',
  ];

  // Check if from address is spam-like
  const isSpamFrom = spamIndicators.some(indicator => normalizedFrom.includes(indicator));
  
  // Check if subject/body contains spam keywords (but not out-of-office, which we handle separately)
  const spamKeywords = spamIndicators.filter(k => 
    !['out of office', 'away until', 'vacation', 'ooo', 'out of the office'].includes(k)
  );
  const hasSpamKeywords = spamKeywords.some(keyword => 
    combinedText.includes(keyword)
  );

  // 2. Check for OUT OF OFFICE (before spam check, as it's more specific)
  const oooIndicators = [
    'out of office',
    'out of the office',
    'ooo',
    'away until',
    'away from',
    'vacation',
    'on leave',
    'will be back',
    'returning on',
    'out until',
    'unavailable until',
  ];
  
  const isOutOfOffice = oooIndicators.some(indicator => 
    normalizedSubject.includes(indicator) || normalizedBody.includes(indicator)
  );

  if (isOutOfOffice) {
    return 'out-of-office';
  }

  // 3. Check for NOT INTERESTED (before interested, to avoid false positives)
  const notInterestedIndicators = [
    'not interested',
    'not a good fit',
    'no thanks',
    'no thank you',
    'not for me',
    'not right now',
    'not at this time',
    'unsubscribe',
    'remove me',
    'stop emailing',
    'stop sending',
    'do not contact',
    'remove from list',
    'opt out',
    'opt-out',
  ];

  const isNotInterested = notInterestedIndicators.some(indicator => 
    combinedText.includes(indicator)
  );

  if (isNotInterested) {
    return 'not-interested';
  }

  // 4. Check for INTERESTED
  const interestedIndicators = [
    'interested',
    'sounds good',
    'yes',
    'let\'s connect',
    'send details',
    'send more',
    'tell me more',
    'i\'m interested',
    'i am interested',
    'would like to',
    'would love to',
    'please send',
    'please share',
    'looking forward',
    'excited to',
    'definitely interested',
    'very interested',
  ];

  const isInterested = interestedIndicators.some(indicator => 
    combinedText.includes(indicator)
  );

  if (isInterested) {
    return 'interested';
  }

  // 5. Check for MEETINGS
  const meetingIndicators = [
    'meeting',
    'schedule',
    'zoom',
    'google meet',
    'teams meeting',
    'microsoft teams',
    'calendar',
    '.ics',
    'calendar invite',
    'calendar invitation',
    'meet at',
    'meet on',
    'meet with',
    'call at',
    'call on',
    'call scheduled',
    'scheduled call',
    'appointment',
    'book a',
    'book an',
    'set up a meeting',
    'set up a call',
    'setup meeting',
    'setup call',
  ];

  const isMeeting = meetingIndicators.some(indicator => 
    combinedText.includes(indicator)
  );

  if (isMeeting) {
    return 'meetings';
  }

  // 6. Check for SPAM (after all other checks)
  if (isSpamFrom || hasSpamKeywords) {
    return 'spam';
  }

  // 7. Default to INBOX
  return 'inbox';
}

/**
 * Legacy function name for backward compatibility
 * @deprecated Use classifyEmail() instead
 */
export function categorizeEmail(bodyText: string, subject: string): EmailCategory {
  return classifyEmail(subject, bodyText, '');
}

