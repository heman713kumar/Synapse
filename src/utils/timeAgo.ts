// src/utils/timeAgo.ts

/**
 * Converts an ISO date string or Date object into a human-readable "time ago" string.
 * Handles potential invalid date inputs gracefully.
 *
 * @param dateInput The date string (ISO format preferred) or Date object.
 * @returns A string like "5 minutes ago", "2 hours ago", "3 days ago", or "just now" / "unknown date" for errors.
 */
export const timeAgo = (dateInput: string | Date | undefined | null): string => {
    if (!dateInput) return "unknown date";

    try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        // Check if the date object is valid
        if (isNaN(date.getTime())) {
            console.warn("Invalid date passed to timeAgo:", dateInput);
            return "unknown date";
        }

        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

        // Handle future dates or very small negative differences gracefully
        if (seconds < 0 && Math.abs(seconds) < 5) return "just now";
        if (seconds < 0) return "in the future"; // Or handle as needed
        if (seconds < 60) return `${seconds} seconds ago`;

        let interval = seconds / 31536000; // years
        if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " year ago" : " years ago");

        interval = seconds / 2592000; // months
        if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " month ago" : " months ago");

        interval = seconds / 86400; // days
        if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " day ago" : " days ago");

        interval = seconds / 3600; // hours
        if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " hour ago" : " hours ago");

        interval = seconds / 60; // minutes
        if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " minute ago" : " minutes ago");

        return "just now"; // Fallback for < 60 seconds handled earlier, but good to have

    } catch (e) {
        console.error("Error formatting date in timeAgo:", dateInput, e);
        return "unknown date";
    }
};