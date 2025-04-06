import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString();
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatNumber(value: number | string | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return num.toFixed(decimals);
}

// Function to format dates to ISO format for inputs
export function toISODateString(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

// Function to truncate text with ellipsis
export function truncateText(text: string | null | undefined, maxLength = 30): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Function to generate default pagination state
export function getPaginationRange(
  totalItems: number,
  currentPage: number,
  itemsPerPage: number
): { start: number; end: number; totalPages: number } {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(start + itemsPerPage - 1, totalItems);
  return { start, end, totalPages };
}

// Create array of page numbers for pagination
export function getPaginationItems(
  currentPage: number,
  totalPages: number
): (number | 'ellipsis')[] {
  const maxVisiblePages = 5;
  let paginationItems: (number | 'ellipsis')[] = [];

  if (totalPages <= maxVisiblePages) {
    paginationItems = Array.from({ length: totalPages }, (_, i) => i + 1);
  } else {
    // Always show first page
    paginationItems.push(1);

    // Calculate range around current page
    const leftBound = Math.max(2, currentPage - 1);
    const rightBound = Math.min(totalPages - 1, currentPage + 1);

    // Add ellipsis if needed before the range
    if (leftBound > 2) {
      paginationItems.push('ellipsis');
    }

    // Add the range of pages
    for (let i = leftBound; i <= rightBound; i++) {
      paginationItems.push(i);
    }

    // Add ellipsis if needed after the range
    if (rightBound < totalPages - 1) {
      paginationItems.push('ellipsis');
    }

    // Always show last page
    paginationItems.push(totalPages);
  }

  return paginationItems;
}
