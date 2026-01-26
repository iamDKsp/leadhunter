import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

interface Location {
    lat: number;
    lng: number;
}

interface PlaceResult {
    name: string;
    address: string;
    location: Location;
    place_id: string;
    rating?: number;
    types?: string[];
}

export const searchPlaces = async (query: string, type?: string): Promise<PlaceResult[]> => {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps API Key is missing');
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
        const params: any = {
            query,
            key: GOOGLE_MAPS_API_KEY,
        };

        if (type) {
            params.type = type;
        }

        const response = await axios.get(url, { params });

        if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
            console.error('Google Maps API Error:', response.data);
            throw new Error(`Google Maps API error: ${response.data.status}`);
        }

        return response.data.results.map((place: any) => ({
            name: place.name,
            address: place.formatted_address,
            location: place.geometry.location,
            place_id: place.place_id,
            rating: place.rating,
            types: place.types,
        }));
    } catch (error) {
        console.error('Error searching places:', error);
        return [];
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
            fields: 'name,formatted_address,geometry,formatted_phone_number,website,opening_hours,rating,user_ratings_total',
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
