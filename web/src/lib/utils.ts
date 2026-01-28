import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .substring(0, 100); // Limit slug length to 100 characters
}

export function calculateReadTime(content: string): number {
  if (!content || content.trim().length === 0) return 0;
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string): string {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return formatDate(date);
}

export function extractExcerpt(content: string, length: number = 150): string {
  const textContent = content.replace(/<[^>]*>/g, "");
  return textContent.length > length
    ? textContent.substring(0, length) + "..."
    : textContent;
}

export function shareToTwitter(title: string, url: string) {
  const text = encodeURIComponent(`Check out this post: ${title}`);
  const shareUrl = encodeURIComponent(url);
  window.open(
    `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`,
    "_blank"
  );
}

export function shareToWhatsApp(title: string, url: string) {
  const text = encodeURIComponent(`Check out this post: ${title} ${url}`);
  window.open(`https://wa.me/?text=${text}`, "_blank");
}

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}
