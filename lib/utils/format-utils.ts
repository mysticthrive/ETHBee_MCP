/**
 * Utility functions for formatting data in the UI
 */

import { formatTimeInTimezone, getUserTimezone } from "@/lib/utils/timezone-utils"

/**
 * Formats a currency value with appropriate precision
 * @param value The number to format as currency
 * @param currency The currency symbol (default: $)
 * @returns Formatted currency string
 */
export function formatCurrency(value?: number | null, currency: string = '$'): string {
  if (value === undefined || value === null) return 'N/A';

  if (value === 0) return `${currency}0.00`;
  
  if (value < 0.0001) return `${currency}${value.toExponential(2)}`;
  if (value < 0.01) return `${currency}${value.toFixed(6)}`;
  if (value < 1) return `${currency}${value.toFixed(4)}`;
  if (value < 10) return `${currency}${value.toFixed(2)}`;
  if (value < 1000) return `${currency}${value.toFixed(2)}`;
  
  return `${currency}${value.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}

/**
 * Formats a date string in a user-friendly format
 * @param dateString ISO date string to format
 * @param includeTime Whether to include the time (default: true)
 * @param timezone The IANA timezone string (optional, defaults to detected timezone)
 * @returns Formatted date string
 */
export function formatDate(
  dateString?: string | null,
  includeTime: boolean = true,
  timezone?: string
): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    const tz = timezone || getUserTimezone();
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return formatTimeInTimezone(date, tz, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error';
  }
}

/**
 * Formats a date as a relative time (e.g., "2 hours ago")
 * @param dateString ISO date string to format
 * @param timezone The IANA timezone string (optional, defaults to detected timezone)
 * @returns Relative time string
 */
export function formatTimeAgo(
  dateString?: string | null,
  timezone?: string
): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    const now = new Date();
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    // Optionally, you could convert 'now' to the user's timezone, but for relative time, UTC is fine
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDay < 30) {
      return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
    } else {
      // For older dates, return the formatted date in the user's timezone
      return formatDate(dateString, false, timezone);
    }
  } catch (error) {
    console.error('Error formatting time ago:', error);
    return 'Error';
  }
}

/**
 * Formats a large number with appropriate suffixes (K, M, B, T)
 * @param num The number to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export function formatNumber(num: number, decimals: number = 2): string {
  if (num === undefined || num === null) return 'N/A';
  if (num === 0) return '0';

  const absNum = Math.abs(num);
  if (absNum < 1 && absNum > 0) {
    // For very small numbers, use fixed notation
    return num.toFixed(decimals);
  }

  const trillion = 1e12;
  const billion = 1e9;
  const million = 1e6;
  const thousand = 1e3;

  if (absNum >= trillion) return `${(num / trillion).toFixed(decimals)}T`;
  if (absNum >= billion) return `${(num / billion).toFixed(decimals)}B`;
  if (absNum >= million) return `${(num / million).toFixed(decimals)}M`;
  if (absNum >= thousand) return `${(num / thousand).toFixed(decimals)}K`;

  return num.toFixed(decimals);
}

export { formatTimeInTimezone, getUserTimezone } from "@/lib/utils/timezone-utils"
