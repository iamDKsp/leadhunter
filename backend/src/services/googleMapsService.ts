import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

interface Location {
    lat: number;
    lng: number;
}

export interface PlaceResult {
    name: string;
    address: string;
    location: Location;
    place_id: string;
    rating?: number;
    user_ratings_total?: number;
    types?: string[];
    formatted_phone_number?: string;
    website?: string;
    opening_hours?: {
        open_now: boolean;
    };
    business_status?: string;
}

export interface SearchOptions {
    type?: string;
    limit?: number;
    minRating?: number;
    maxRating?: number;
    minReviews?: number;
    openNow?: boolean;
    mustHavePhone?: boolean;
    mustHaveWebsite?: boolean;
    location?: string;
    radius?: number;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const searchPlaces = async (query: string, options: SearchOptions = {}): Promise<PlaceResult[]> => {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps API Key is missing');
    }

    let allResults: PlaceResult[] = [];
    let nextPageToken: string | undefined = undefined;
    const limit = options.limit || 20;

    // Safety: max 3 pages (60 results)
    let pageCount = 0;
    const MAX_PAGES = Math.ceil(limit / 20);

    try {
        do {
            const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
            const params: any = {
                query,
                key: GOOGLE_MAPS_API_KEY,
            };

            if (options.type) params.type = options.type;
            if (options.openNow) params.openNow = true;
            // Radius biasing
            if (options.location && options.radius) {
                params.location = options.location;
                params.radius = options.radius;
            }

            if (nextPageToken) {
                params.pagetoken = nextPageToken;
                await sleep(2000);
            }

            const response = await axios.get(url, { params });

            if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
                console.error('Google Maps API Error:', response.data);
                if (allResults.length > 0) break;
                throw new Error(`Google Maps API error: ${response.data.status}`);
            }

            const results = response.data.results.map((place: any) => ({
                name: place.name,
                address: place.formatted_address,
                location: place.geometry.location,
                place_id: place.place_id,
                rating: place.rating,
                user_ratings_total: place.user_ratings_total,
                types: place.types,
                opening_hours: place.opening_hours,
                // Text Search usually doesn't return phone/website
            }));

            allResults = [...allResults, ...results];
            nextPageToken = response.data.next_page_token;
            pageCount++;

        } while (nextPageToken && allResults.length < limit && pageCount < MAX_PAGES);

        // Apply Filters
        let filtered = allResults;

        // 1. Rating (Min/Max)
        if (options.minRating) {
            filtered = filtered.filter(p => (p.rating || 0) >= (options.minRating || 0));
        }
        if (options.maxRating) {
            filtered = filtered.filter(p => (p.rating || 0) <= (options.maxRating || 5));
        }

        // 2. Review Count
        if (options.minReviews) {
            filtered = filtered.filter(p => (p.user_ratings_total || 0) >= (options.minReviews || 0));
        }

        // 3. Phone/Website (Note: Text Search data limitations)
        // If we strictly enforce this, we might filter out valid leads simply because Text Search didn't return the field.
        // For now, we only filter if the data IS present and doesn't match, OR we assume we can't filter this without fetching details.
        // To be safe and "Free", we effectively skip these filters for now in this function, 
        // OR we'd need to fetch details for every result (expensive).
        // Let's rely on the Frontend to show visual indicators or user to import "enriched" leads.

        return filtered.slice(0, limit);

    } catch (error) {
        console.error('Error searching places:', error);
        return allResults;
    }
};

export const getPlaceDetails = async (placeId: string): Promise<any> => {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps API Key is missing');
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json`;
        const params = {
            place_id: placeId,
            fields: 'name,formatted_address,geometry,formatted_phone_number,website,opening_hours,rating,user_ratings_total,photos',
            key: GOOGLE_MAPS_API_KEY,
        };

        const response = await axios.get(url, { params });

        if (response.data.status !== 'OK') {
            throw new Error(`Google Maps API error: ${response.data.status}`);
        }

        return response.data.result;
    } catch (error) {
        console.error('Error getting place details:', error);
        return null;
    }
}

/**
 * Generate a Google Places Photo URL from a photo reference
 * @param photoReference - The photo_reference from Place Details API
 * @param maxWidth - Maximum width of the photo (default: 400)
 * @returns The photo URL or null if no reference
 */
export const getPlacePhotoUrl = (photoReference: string | undefined, maxWidth: number = 400): string | null => {
    if (!photoReference || !GOOGLE_MAPS_API_KEY) {
        return null;
    }

    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
}

