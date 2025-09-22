import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Calculates the distance between two points on Earth using the Haversine formula.
 * @param lat1 Latitude of the first point.
 * @param lon1 Longitude of the first point.
 * @param lat2 Latitude of the second point.
 * @param lon2 Longitude of the second point.
 * @returns The distance in kilometers.
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generates an array of keywords from a given text string for search purposes.
 * This creates substrings to allow for "starts-with" type queries in Firestore.
 * @param text The input string to generate keywords from.
 * @returns An array of unique, lowercase keywords.
 */
export function generateKeywords(text: string): string[] {
    if (!text) return [];
    
    const cleanedText = text.toLowerCase().replace(/[.,!?;:"'()]/g, '');
    const words = cleanedText.split(/\s+/).filter(Boolean);
    
    const keywords = new Set<string>();
    
    words.forEach(word => {
        if (word.length > 2) {
            for (let i = 3; i <= word.length; i++) {
                keywords.add(word.substring(0, i));
            }
        }
    });

    // Add the full words as well for exact matches
    words.forEach(word => keywords.add(word));

    return Array.from(keywords);
}
