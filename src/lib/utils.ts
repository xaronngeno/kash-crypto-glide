
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Define KASH theme colors
export const kashColors = {
  green: '#16A34A', // Main brand green color
  lightGray: '#F3F4F6', // Light gray for hover states
  textGray: '#6B7280', // Text gray for secondary text
  error: '#EF4444', // Error red
  searchBg: '#F9FAFB', // Background for search elements
}
