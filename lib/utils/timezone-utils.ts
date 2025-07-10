// Common timezone options for the UI
export const TIMEZONE_OPTIONS = [
  // North America
  { value: "America/New_York", label: "Eastern Time (ET)", region: "North America" },
  { value: "America/Chicago", label: "Central Time (CT)", region: "North America" },
  { value: "America/Denver", label: "Mountain Time (MT)", region: "North America" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)", region: "North America" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)", region: "North America" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)", region: "North America" },
  { value: "America/Toronto", label: "Toronto (ET)", region: "North America" },
  { value: "America/Vancouver", label: "Vancouver (PT)", region: "North America" },

  // Europe
  { value: "Europe/London", label: "London (GMT/BST)", region: "Europe" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)", region: "Europe" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)", region: "Europe" },
  { value: "Europe/Rome", label: "Rome (CET/CEST)", region: "Europe" },
  { value: "Europe/Madrid", label: "Madrid (CET/CEST)", region: "Europe" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET/CEST)", region: "Europe" },
  { value: "Europe/Zurich", label: "Zurich (CET/CEST)", region: "Europe" },
  { value: "Europe/Stockholm", label: "Stockholm (CET/CEST)", region: "Europe" },
  { value: "Europe/Moscow", label: "Moscow (MSK)", region: "Europe" },

  // Asia
  { value: "Asia/Tokyo", label: "Tokyo (JST)", region: "Asia" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)", region: "Asia" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)", region: "Asia" },
  { value: "Asia/Singapore", label: "Singapore (SGT)", region: "Asia" },
  { value: "Asia/Seoul", label: "Seoul (KST)", region: "Asia" },
  { value: "Asia/Kolkata", label: "Mumbai/Delhi (IST)", region: "Asia" },
  { value: "Asia/Dubai", label: "Dubai (GST)", region: "Asia" },
  { value: "Asia/Bangkok", label: "Bangkok (ICT)", region: "Asia" },
  { value: "Asia/Jakarta", label: "Jakarta (WIB)", region: "Asia" },

  // Australia & Oceania
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)", region: "Australia & Oceania" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST/AEDT)", region: "Australia & Oceania" },
  { value: "Australia/Perth", label: "Perth (AWST)", region: "Australia & Oceania" },
  { value: "Pacific/Auckland", label: "Auckland (NZST/NZDT)", region: "Australia & Oceania" },

  // South America
  { value: "America/Sao_Paulo", label: "São Paulo (BRT)", region: "South America" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (ART)", region: "South America" },
  { value: "America/Lima", label: "Lima (PET)", region: "South America" },
  { value: "America/Bogota", label: "Bogotá (COT)", region: "South America" },

  // Africa
  { value: "Africa/Cairo", label: "Cairo (EET)", region: "Africa" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST)", region: "Africa" },
  { value: "Africa/Lagos", label: "Lagos (WAT)", region: "Africa" },
  { value: "Africa/Nairobi", label: "Nairobi (EAT)", region: "Africa" },

  // UTC
  { value: "UTC", label: "UTC (Coordinated Universal Time)", region: "UTC" },
]

// Group timezones by region for better UI organization
export const TIMEZONE_GROUPS = TIMEZONE_OPTIONS.reduce(
  (groups, timezone) => {
    const region = timezone.region
    if (!groups[region]) {
      groups[region] = []
    }
    groups[region].push(timezone)
    return groups
  },
  {} as Record<string, typeof TIMEZONE_OPTIONS>,
)

// Get user's detected timezone
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (error) {
    console.warn("Could not detect user timezone:", error)
    return "UTC"
  }
}

// Format time in user's timezone
export function formatTimeInTimezone(date: Date, timezone: string, options?: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      ...options,
    }).format(date)
  } catch (error) {
    console.warn("Error formatting time in timezone:", error)
    return date.toISOString()
  }
}

// Get timezone offset string (e.g., "+05:30", "-08:00")
export function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date()
    const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000)
    const targetTime = new Date(utc.toLocaleString("en-US", { timeZone: timezone }))
    const diff = targetTime.getTime() - utc.getTime()
    const hours = Math.floor(Math.abs(diff) / (1000 * 60 * 60))
    const minutes = Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60))
    const sign = diff >= 0 ? "+" : "-"
    return `${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  } catch (error) {
    console.warn("Error getting timezone offset:", error)
    return "+00:00"
  }
}

// Validate timezone string
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch (error) {
    return false
  }
}

// Convert trading function time conditions from user timezone to UTC
export function convertTradingFunctionTimesToUTC(args: any, userTimezone: string): any {
  // Deep clone the args to avoid mutating the original
  const convertedArgs = JSON.parse(JSON.stringify(args))
  
  // If no conditions, return as is
  if (!convertedArgs.conditions || !Array.isArray(convertedArgs.conditions)) {
    return convertedArgs
  }

  // Process each condition
  convertedArgs.conditions = convertedArgs.conditions.map((condition: any) => {
    // Only process time conditions
    if (condition.condition_type !== 'time' || !condition.condition_details) {
      return condition
    }

    const timeDetails = condition.condition_details
    timeDetails.time_mode = timeDetails.time_mode.toLowerCase();

    // Handle direct time mode
    if (timeDetails.time_mode === 'direct') {
      if (timeDetails.start_time) {
        timeDetails.start_time = convertTimeToUTC(timeDetails.start_time, userTimezone)
      }
      if (timeDetails.end_time) {
        timeDetails.end_time = convertTimeToUTC(timeDetails.end_time, userTimezone)
      }
    }
    
    // Handle relative time mode
    if (timeDetails.time_mode === 'relative') {
      if (timeDetails.base_time) {
        timeDetails.base_time = convertTimeToUTC(timeDetails.base_time, userTimezone)
      }
    }

    return condition
  })

  return convertedArgs
}

// Helper function to convert local time string to UTC
function convertTimeToUTC(timeString: string, timezone: string): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(new Date(timeString));
  
  const dateParts: { [key: string]: string } = {};
  parts.forEach(({ type, value }) => {
    if (type !== 'literal') {
      dateParts[type] = value;
    }
  });
  
  const isoDateString = `${dateParts.year}-${dateParts.month}-${dateParts.day}T${dateParts.hour}:${dateParts.minute}:${dateParts.second}`;
  
  // Create a Date object from the ISO string (which is in local time)
  const localDate = new Date(isoDateString);
  
  // Convert local date to UTC
  return localDate.toISOString();
}
