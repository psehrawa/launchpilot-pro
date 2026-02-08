// Smart Email Scheduling
// Sends emails at optimal times based on recipient timezone

export interface ScheduleOptions {
  email: string;
  timezone?: string;
  preferredHours?: { start: number; end: number };
  avoidWeekends?: boolean;
}

// Map email domain to likely timezone
const domainTimezones: Record<string, string> = {
  // Country TLDs
  ".uk": "Europe/London",
  ".de": "Europe/Berlin",
  ".fr": "Europe/Paris",
  ".au": "Australia/Sydney",
  ".jp": "Asia/Tokyo",
  ".in": "Asia/Kolkata",
  ".br": "America/Sao_Paulo",
  ".ca": "America/Toronto",
  ".mx": "America/Mexico_City",
  
  // Common US companies
  "google.com": "America/Los_Angeles",
  "facebook.com": "America/Los_Angeles",
  "meta.com": "America/Los_Angeles",
  "apple.com": "America/Los_Angeles",
  "microsoft.com": "America/Los_Angeles",
  "amazon.com": "America/Los_Angeles",
  "stripe.com": "America/Los_Angeles",
  "salesforce.com": "America/Los_Angeles",
  "twitter.com": "America/Los_Angeles",
  "linkedin.com": "America/Los_Angeles",
  "netflix.com": "America/Los_Angeles",
  
  // NYC companies
  "jpmorgan.com": "America/New_York",
  "goldmansachs.com": "America/New_York",
  "bloomberg.com": "America/New_York",
};

// Best sending times by day (in recipient's local time)
const optimalHours = {
  weekday: [
    { hour: 9, weight: 10 },  // 9 AM - best
    { hour: 10, weight: 9 },
    { hour: 8, weight: 7 },
    { hour: 11, weight: 6 },
    { hour: 14, weight: 5 },  // 2 PM - post lunch
    { hour: 15, weight: 4 },
    { hour: 16, weight: 3 },
  ],
  weekend: [
    { hour: 10, weight: 5 },
    { hour: 11, weight: 4 },
    { hour: 9, weight: 3 },
  ],
};

export function guessTimezone(email: string): string {
  const domain = email.split("@")[1]?.toLowerCase();
  
  if (!domain) return "America/New_York"; // Default
  
  // Check exact domain match
  if (domainTimezones[domain]) {
    return domainTimezones[domain];
  }
  
  // Check TLD
  for (const [tld, tz] of Object.entries(domainTimezones)) {
    if (tld.startsWith(".") && domain.endsWith(tld)) {
      return tz;
    }
  }
  
  // Default to US East Coast (most B2B)
  return "America/New_York";
}

export function getOptimalSendTime(options: ScheduleOptions): Date {
  const {
    email,
    timezone = guessTimezone(email),
    preferredHours = { start: 8, end: 17 },
    avoidWeekends = true,
  } = options;

  const now = new Date();
  
  // Get current time in recipient's timezone
  const recipientNow = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const recipientHour = recipientNow.getHours();
  const recipientDay = recipientNow.getDay(); // 0 = Sunday
  
  // Find next optimal slot
  let targetDate = new Date(now);
  let daysToAdd = 0;
  
  // Skip to next weekday if needed
  if (avoidWeekends) {
    if (recipientDay === 0) daysToAdd = 1; // Sunday -> Monday
    if (recipientDay === 6) daysToAdd = 2; // Saturday -> Monday
  }
  
  // If it's too late today, move to tomorrow
  if (recipientHour >= preferredHours.end) {
    daysToAdd = Math.max(daysToAdd, 1);
  }
  
  // Add days and adjust for weekends
  targetDate.setDate(targetDate.getDate() + daysToAdd);
  
  const targetDay = targetDate.getDay();
  if (avoidWeekends && (targetDay === 0 || targetDay === 6)) {
    targetDate.setDate(targetDate.getDate() + (targetDay === 0 ? 1 : 2));
  }
  
  // Pick optimal hour
  const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
  const hours = isWeekend ? optimalHours.weekend : optimalHours.weekday;
  
  // Weight-based random selection
  const totalWeight = hours.reduce((sum, h) => sum + h.weight, 0);
  let random = Math.random() * totalWeight;
  let selectedHour = hours[0].hour;
  
  for (const h of hours) {
    random -= h.weight;
    if (random <= 0) {
      selectedHour = h.hour;
      break;
    }
  }
  
  // Clamp to preferred hours
  selectedHour = Math.max(preferredHours.start, Math.min(preferredHours.end - 1, selectedHour));
  
  // Set the time
  targetDate.setHours(selectedHour, Math.floor(Math.random() * 30), 0, 0);
  
  // Convert back from recipient timezone to UTC
  // This is a simplified conversion - in production use a proper library
  const utcDate = new Date(targetDate.toLocaleString("en-US", { timeZone: "UTC" }));
  
  return targetDate;
}

export function formatScheduleTime(date: Date, timezone: string): string {
  return date.toLocaleString("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export interface BatchSchedule {
  email: string;
  scheduledFor: Date;
  timezone: string;
  localTime: string;
}

export function scheduleBatch(emails: string[], options?: Partial<ScheduleOptions>): BatchSchedule[] {
  const scheduled: BatchSchedule[] = [];
  const baseTime = new Date();
  
  // Spread emails over time to avoid spam triggers
  const delayMinutes = 2; // 2 minutes between each email
  
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    const timezone = options?.timezone || guessTimezone(email);
    
    const optimalTime = getOptimalSendTime({ email, timezone, ...options });
    
    // Add staggered delay
    optimalTime.setMinutes(optimalTime.getMinutes() + (i * delayMinutes));
    
    scheduled.push({
      email,
      scheduledFor: optimalTime,
      timezone,
      localTime: formatScheduleTime(optimalTime, timezone),
    });
  }
  
  return scheduled;
}
