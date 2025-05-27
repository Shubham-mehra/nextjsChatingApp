// src/utils/timeAgo.ts

export function timeAgo(date: any) {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds} sec${seconds > 1 ? 's' : ''} ago`;
  
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  
    // For older than 7 days, just show date in a simple format
    return new Date(date).toLocaleDateString();
  }
  