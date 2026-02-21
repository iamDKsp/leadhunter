import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { searchPlaces, getPlaceDetails, getPlacePhotoUrl } from '../services/googleMapsService';
import { AuthRequest } from '../middleware/auth';
import { getUserPermissions } from '../middleware/authorization';

export const searchCompanies = async (req: AuthRequest, res: Response) => {
    try {
        const { query, type, limit, minRating, maxRating, minReviews, openNow, radius, location, status } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        const limitNum = limit ? parseInt(limit as string) : 20;

        const results = await searchPlaces(query as string, {
            type: type as string,
            limit: limitNum,
            minRating: minRating ? parseFloat(minRating as string) : undefined,
            maxRating: maxRating ? parseFloat(maxRating as string) : undefined,
            minReviews: minReviews ? parseInt(minReviews as string) : undefined,
            openNow: openNow === 'true',
            radius: radius ? parseInt(radius as string) : undefined,
            location: location as string
        });

        // LOG COST
        try {
            const pages = Math.ceil(results.length / 20); // Logging based on returned results usually 1 page if < 20
            // Ideally we log based on attempted pages, but result count is a fair proxy for "successful" search volume
            const COST_PER_SEARCH = 0.20 * Math.ceil(limitNum / 20); // Estimated based on limit requested

            await prisma.costLog.create({
                data: {
                    userId: req.user?.userId,
                    query: `${query}`,
                    endpoint: 'textsearch',
                    cost: COST_PER_SEARCH
                }
            });
        } catch (costError) {
            console.error("Failed to log cost:", costError);
        }

        // Check for duplicates
        const placeIds = results.map(r => r.place_id);
        const existingCompanies = await prisma.company.findMany({
            where: { googlePlaceId: { in: placeIds } },
            select: { googlePlaceId: true }
        });

        const existingSet = new Set(existingCompanies.map(c => c.googlePlaceId));

        const enrichedResults = results.map(r => ({
            ...r,
            saved: existingSet.has(r.place_id)
        }));

        res.json(enrichedResults);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const importCompany = async (req: AuthRequest, res: Response) => {
    try {
        const { placeId, folderId, customData } = req.body;

        if (!placeId) {
            return res.status(400).json({ error: 'Place ID is required' });
        }

        const details = await getPlaceDetails(placeId);
        if (!details) {
            return res.status(404).json({ error: 'Place not found' });
        }

        // LOG COST FOR DETAILS
        try {
            // Place Details (Contact) cost approx $0.017 (or approx R$ 0.10) - estimating R$ 0.15 for safety
            const COST_PER_DETAILS = 0.15;

            await prisma.costLog.create({
                data: {
                    userId: req.user?.userId,
                    query: `Import: ${details.name}`,
                    endpoint: 'placedetails',
                    cost: COST_PER_DETAILS
                }
            });
        } catch (costError) {
            console.error("Failed to log import cost:", costError);
        }

        // Extract photo URL from Place Details response
        const photoReference = details.photos?.[0]?.photo_reference;
        const photoUrl = getPlacePhotoUrl(photoReference);

        const newCompany = await prisma.company.create({
            data: {
                googlePlaceId: placeId,
                name: details.name,
                address: details.formatted_address,
                phone: details.formatted_phone_number,
                website: details.website,
                latitude: details.geometry.location.lat,
                longitude: details.geometry.location.lng,
                type: customData?.type || 'unknown',
                activityBranch: customData?.activityBranch || 'unknown',
                size: customData?.size || 'unknown',
                successChance: customData?.successChance ? parseFloat(customData.successChance) : null,
                tips: customData?.tips,
                folderId: folderId || null,
                photoUrl: photoUrl,
                status: 'TRIAGE'
            }
        });

        res.status(201).json(newCompany);

    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const getCompanies = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const permissions = await getUserPermissions(userId);
        const { status } = req.query;
        const where: any = {};



        if (status) {
            where.status = status;
        }

        // Filter logic:
        // 1. Super Admin or Admin -> Sees all (usually, assuming Admin has canViewAllLeads true by default or bypass)
        // 2. canViewAllLeads -> Sees all
        // 3. canViewOwnLeads -> Sees only assigned
        // 4. Neither -> Sees none

        if (permissions?.role !== 'SUPER_ADMIN' && permissions?.role !== 'ADMIN' && !permissions?.canViewAllLeads) {
            if (permissions?.canViewOwnLeads) {
                where.responsibleId = userId;
            } else {
                // If user cannot view all AND cannot view own, return empty
                return res.json([]);
            }
        }

        const companies = await prisma.company.findMany({
            where,
            include: {
                folder: true,
                responsible: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const safeCompanies = companies.map(c => ({
            ...c,
            tags: c.tags ? c.tags.split(',') : []
        }));

        res.json(safeCompanies);
    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const createCompany = async (req: AuthRequest, res: Response) => {
    try {
        const data = { ...req.body };
        if (Array.isArray(data.tags)) {
            data.tags = data.tags.join(',');
        }
        const company = await prisma.company.create({
            data
        });
        res.status(201).json(company);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const updateCompany = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const data = { ...req.body };
        if (Array.isArray(data.tags)) {
            data.tags = data.tags.join(',');
        }
        const company = await prisma.company.update({
            where: { id },
            data
        });
        res.json(company);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const deleteCompany = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.company.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}
