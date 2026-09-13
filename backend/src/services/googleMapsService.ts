import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
    photo_reference?: string;
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
    matchTermInName?: boolean;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Busca empresas exclusivamente via Places API (New) - places.googleapis.com/v1/places:searchText
 * Retorna os telefones diretamente em lote, sem requisições adicionais de detalhes.
 */
export const searchPlaces = async (query: string, options: SearchOptions = {}): Promise<PlaceResult[]> => {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps API Key is missing');
    }

    const limit = options.limit || 20;
    let allResults: PlaceResult[] = [];
    let pageToken: string | undefined = undefined;
    let pageCount = 0;
    // O Google Places Text Search permite até 3 páginas (60 resultados no total).
    const MAX_PAGES = Math.min(Math.ceil(limit / 20) + 1, 3);

    const url = 'https://places.googleapis.com/v1/places:searchText';
    const fieldMask = [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.location',
        'places.nationalPhoneNumber',
        'places.internationalPhoneNumber',
        'places.businessStatus',
        'places.websiteUri',
        'places.rating',
        'places.userRatingCount',
        'places.regularOpeningHours',
        'places.photos',
        'places.types',
        'nextPageToken'
    ].join(',');

    try {
        do {
            const body: any = {
                textQuery: query,
                languageCode: 'pt-BR',
                pageSize: 20
            };

            if (pageToken) {
                body.pageToken = pageToken;
                await sleep(1500);
            }

            if (options.openNow) {
                body.openNow = true;
            }

            if (options.minRating) {
                body.minRating = options.minRating;
            }

            // Location biasing
            if (options.location && options.radius) {
                const parts = options.location.split(',');
                if (parts.length === 2) {
                    const lat = parseFloat(parts[0]);
                    const lng = parseFloat(parts[1]);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        body.locationBias = {
                            circle: {
                                center: { latitude: lat, longitude: lng },
                                radius: options.radius
                            }
                        };
                    }
                }
            }

            console.log(`[GoogleMaps] Chamando Places API (New): "${query}" (Página ${pageCount + 1}/${MAX_PAGES})`);
            const response = await axios.post(url, body, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                    'X-Goog-FieldMask': fieldMask
                },
                timeout: 15000
            });

            const places = response.data.places || [];
            const mapped: PlaceResult[] = places.map((p: any) => ({
                place_id: p.id,
                name: p.displayName?.text || '',
                address: p.formattedAddress || '',
                location: {
                    lat: p.location?.latitude || 0,
                    lng: p.location?.longitude || 0
                },
                rating: p.rating,
                user_ratings_total: p.userRatingCount,
                types: p.types,
                formatted_phone_number: p.nationalPhoneNumber || p.internationalPhoneNumber,
                website: p.websiteUri,
                business_status: p.businessStatus || 'OPERATIONAL',
                opening_hours: p.regularOpeningHours?.openNow !== undefined ? { open_now: p.regularOpeningHours.openNow } : undefined,
                photo_reference: p.photos?.[0]?.name
            }));

            allResults = [...allResults, ...mapped];
            pageToken = response.data.nextPageToken;
            pageCount++;
            console.log(`[GoogleMaps] Página ${pageCount} retornou ${places.length} locais. Tem nextPageToken? ${!!pageToken} (Total acumulado: ${allResults.length})`);

        } while (pageToken && allResults.length < limit && pageCount < MAX_PAGES);

    } catch (error: any) {
        const errorData = error.response?.data?.error;
        console.error('[GoogleMaps] Erro na Places API (New):', errorData || error.message);
        throw new Error(errorData?.message || error.message || 'Erro ao consultar Google Places API (New)');
    }

    // Filtros estritos aplicados no backend
    let filtered = allResults;

    // 1. OBRIGATÓRIO: Apenas empresas abertas / em atividade (descarta 100% de falidas e fechadas permanentemente)
    filtered = filtered.filter(p => !p.business_status || p.business_status === 'OPERATIONAL');

    // 2. OBRIGATÓRIO SE mustHavePhone (padrão true): Apenas empresas que possuem telefone válido
    if (options.mustHavePhone !== false) {
        filtered = filtered.filter(p => !!p.formatted_phone_number && p.formatted_phone_number.trim().length > 0);
    }

    // 3. Aberto agora (se marcado pelo usuário)
    if (options.openNow) {
        filtered = filtered.filter(p => p.opening_hours?.open_now === true);
    }

    // 4. Rating (Min/Max)
    if (options.minRating) {
        filtered = filtered.filter(p => (p.rating || 0) >= (options.minRating || 0));
    }
    if (options.maxRating) {
        filtered = filtered.filter(p => (p.rating || 0) <= (options.maxRating || 5));
    }

    // 5. Review Count
    if (options.minReviews) {
        filtered = filtered.filter(p => (p.user_ratings_total || 0) >= (options.minReviews || 0));
    }

    // 6. Nome deve conter o termo pesquisado (se ativado pelo usuário)
    if (options.matchTermInName && query.trim()) {
        const baseTerm = query.split(/ em /i)[0].trim().toLowerCase();
        if (baseTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(baseTerm));
        }
    }

    return filtered.slice(0, limit);
};

/**
 * Detalhes do Local exclusivamente via Places API (New) - places.googleapis.com/v1/places/{placeId}
 */
export const getPlaceDetails = async (placeId: string): Promise<any> => {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps API Key is missing');
    }

    try {
        const url = `https://places.googleapis.com/v1/places/${placeId}`;
        const fieldMask = 'id,displayName,formattedAddress,location,nationalPhoneNumber,internationalPhoneNumber,websiteUri,businessStatus,rating,userRatingCount,regularOpeningHours,photos';

        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': fieldMask
            },
            timeout: 15000
        });

        const p = response.data;
        return {
            place_id: p.id,
            name: p.displayName?.text || '',
            formatted_address: p.formattedAddress || '',
            formatted_phone_number: p.nationalPhoneNumber || p.internationalPhoneNumber || null,
            website: p.websiteUri || null,
            business_status: p.businessStatus || 'OPERATIONAL',
            rating: p.rating,
            user_ratings_total: p.userRatingCount,
            geometry: {
                location: {
                    lat: p.location?.latitude || 0,
                    lng: p.location?.longitude || 0
                }
            },
            photos: (p.photos || []).map((photo: any) => ({
                photo_reference: photo.name
            }))
        };
    } catch (error: any) {
        console.error('Error getting place details (New API):', error.response?.data || error.message);
        return null;
    }
};

/**
 * Download de foto via Places API (New) e armazenamento local
 */
export const downloadAndSavePlacePhoto = async (
    photoReference: string | undefined,
    filenamePrefix: string = 'company',
    maxWidth: number = 400
): Promise<string | null> => {
    if (!photoReference || !GOOGLE_MAPS_API_KEY) {
        return null;
    }

    try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'companies');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const safePrefix = filenamePrefix
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .substring(0, 30);
        const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const fileName = `${safePrefix}_${uniqueSuffix}.jpg`;
        const filePath = path.join(uploadDir, fileName);

        let googlePhotoUrl: string;
        if (photoReference.startsWith('places/')) {
            googlePhotoUrl = `https://places.googleapis.com/v1/${photoReference}/media?maxHeightPx=${maxWidth}&maxWidthPx=${maxWidth}&key=${GOOGLE_MAPS_API_KEY}`;
        } else {
            googlePhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
        }

        const response = await axios.get(googlePhotoUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
                'User-Agent': 'LeadHunter/1.0'
            }
        });

        if (response.status === 200 && response.data) {
            const contentType = response.headers['content-type'] || '';
            if (contentType.startsWith('image/')) {
                await fs.promises.writeFile(filePath, Buffer.from(response.data));
                console.log(`[GoogleMaps] Photo downloaded and saved: /uploads/companies/${fileName}`);
                return `/uploads/companies/${fileName}`;
            }
        }

        return null;
    } catch (error: any) {
        const status = error.response?.status;
        if (status === 403) {
            console.warn(`[GoogleMaps] Photo download skipped: 403 Forbidden (quota exceeded or key restricted)`);
        } else {
            console.warn(`[GoogleMaps] Photo download skipped: ${error.message || 'Unknown error'}`);
        }
        return null;
    }
};

/**
 * Generate a Google Places Photo URL from a photo reference
 * @deprecated Use downloadAndSavePlacePhoto to save photos locally and protect API key.
 */
export const getPlacePhotoUrl = (photoReference: string | undefined, maxWidth: number = 400): string | null => {
    return null;
};
