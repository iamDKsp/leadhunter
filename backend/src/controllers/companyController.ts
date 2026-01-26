import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { searchPlaces, getPlaceDetails } from '../services/googleMapsService';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const searchCompanies = async (req: AuthRequest, res: Response) => {
    try {
        const { query, type } = req.query;
        console.log(`🔎 SEARCH REQUEST: query="${query}", type="${type}"`);

        if (!query) {
            console.log("❌ Missing query parameter");
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        const results = await searchPlaces(query as string, type as string);

        // LOG COST
        try {
            // Text Search cost approx $0.032 per request (or approx R$ 0.20) - estimating R$ 0.20
            // If we used Place Details it would be more.
            // Keeping it simple: R$ 0.20 per search
            const COST_PER_SEARCH = 0.20;

            await prisma.costLog.create({
                data: {
                    userId: req.user?.userId, // Assuming auth middleware adds user to req
                    query: query as string,
                    endpoint: 'textsearch',
                    cost: COST_PER_SEARCH
                }
            });
        } catch (costError) {
            console.error("Failed to log cost:", costError);
            // Don't modify main flow
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
                folderId: folderId || null
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
        const companies = await prisma.company.findMany({
            include: { folder: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(companies);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const createCompany = async (req: AuthRequest, res: Response) => {
    try {
        const company = await prisma.company.create({
            data: req.body
        });
        res.status(201).json(company);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const updateCompany = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const company = await prisma.company.update({
            where: { id },
            data: req.body
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
