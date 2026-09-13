import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { searchPlaces, getPlaceDetails, downloadAndSavePlacePhoto } from '../services/googleMapsService';
import { AuthRequest } from '../middleware/auth';
import { getUserPermissions } from '../middleware/authorization';

export const searchCompanies = async (req: AuthRequest, res: Response) => {
    try {
        const { query, type, limit, minRating, maxRating, minReviews, openNow, radius, location, status, mustHavePhone, matchTermInName } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        const limitNum = limit ? parseInt(limit as string) : 20;
        const shouldFilterPhone = mustHavePhone === undefined ? true : mustHavePhone === 'true';

        const results = await searchPlaces(query as string, {
            type: type as string,
            limit: limitNum,
            minRating: minRating ? parseFloat(minRating as string) : undefined,
            maxRating: maxRating ? parseFloat(maxRating as string) : undefined,
            minReviews: minReviews ? parseInt(minReviews as string) : undefined,
            openNow: openNow === 'true',
            mustHavePhone: shouldFilterPhone,
            matchTermInName: matchTermInName === 'true',
            radius: radius ? parseInt(radius as string) : undefined,
            location: location as string
        });

        // LOG COST
        try {
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
    } catch (error: any) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message || 'Erro ao buscar empresas no Google Maps' });
    }
};

export const importCompany = async (req: AuthRequest, res: Response) => {
    try {
        const { placeId, folderId, customData, placeData } = req.body;

        if (!placeId) {
            return res.status(400).json({ error: 'Place ID is required' });
        }

        // Check if already exists first to avoid unnecessary API costs
        const existing = await prisma.company.findFirst({
            where: { googlePlaceId: placeId }
        });
        if (existing) {
            return res.status(409).json({ error: 'Esta empresa já foi importada anteriormente.' });
        }

        // Use placeData if provided from search to avoid extra Place Details API billing
        let details = placeData;
        let didCallDetailsApi = false;

        if (!details || !details.formatted_phone_number) {
            details = await getPlaceDetails(placeId);
            didCallDetailsApi = true;
        }

        if (!details) {
            return res.status(404).json({ error: 'Empresa não encontrada no Google Maps' });
        }

        // VALIDATION: Reject closed / non-operational companies
        if (details.business_status && details.business_status !== 'OPERATIONAL') {
            return res.status(400).json({
                error: 'Esta empresa está fechada (temporariamente ou permanentemente) e não pode ser importada como lead.'
            });
        }

        // VALIDATION: Reject companies without phone number
        const phone = details.formatted_phone_number || details.phone;
        if (!phone || String(phone).trim().length === 0) {
            return res.status(400).json({
                error: 'Esta empresa não possui número de telefone cadastrado e foi descartada.'
            });
        }

        // LOG COST FOR DETAILS only if we actually performed the API call
        if (didCallDetailsApi) {
            try {
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
        }

        // Download and store photo locally
        const photoReference = details.photos?.[0]?.photo_reference || details.photo_reference;
        let photoUrl: string | null = null;
        if (photoReference) {
            photoUrl = await downloadAndSavePlacePhoto(photoReference, details.name);
        }

        const lat = details.geometry?.location?.lat ?? details.location?.lat ?? null;
        const lng = details.geometry?.location?.lng ?? details.location?.lng ?? null;

        const newCompany = await prisma.company.create({
            data: {
                googlePlaceId: placeId,
                name: details.name,
                address: details.formatted_address || details.address || 'Endereço não informado',
                phone: phone,
                website: details.website || null,
                latitude: lat,
                longitude: lng,
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
};

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

export const bulkAssignCompanies = async (req: AuthRequest, res: Response) => {
    try {
        const { companyIds, userId: newUserId } = req.body;
        const assignedById = req.user?.userId;

        if (!Array.isArray(companyIds) || !newUserId || !assignedById) {
            return res.status(400).json({ error: 'companyIds and userId are required' });
        }

        // Registrar no historico
        const companies = await prisma.company.findMany({
            where: { id: { in: companyIds } },
            select: { id: true, responsibleId: true }
        });

        const historyRecords = companies.map(company => ({
            companyId: company.id,
            previousUserId: company.responsibleId,
            newUserId,
            assignedById
        }));

        await prisma.$transaction([
            prisma.company.updateMany({
                where: { id: { in: companyIds } },
                data: { responsibleId: newUserId }
            }),
            prisma.leadAssignmentHistory.createMany({
                data: historyRecords
            })
        ]);

        res.status(200).json({ message: `${companyIds.length} leads assigned successfully` });
    } catch (error) {
        console.error('Bulk assign error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const bulkMoveCompanies = async (req: AuthRequest, res: Response) => {
    try {
        const { companyIds, stageId } = req.body;

        if (!Array.isArray(companyIds) || !stageId) {
            return res.status(400).json({ error: 'companyIds and stageId are required' });
        }

        await prisma.company.updateMany({
            where: { id: { in: companyIds } },
            data: { stageId }
        });

        res.status(200).json({ message: `${companyIds.length} leads moved successfully` });
    } catch (error) {
        console.error('Bulk move error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const bulkDeleteCompanies = async (req: AuthRequest, res: Response) => {
    try {
        const { companyIds } = req.body;

        if (!Array.isArray(companyIds)) {
            return res.status(400).json({ error: 'companyIds must be an array' });
        }

        await prisma.company.deleteMany({
            where: { id: { in: companyIds } }
        });

        res.status(200).json({ message: `${companyIds.length} leads deleted successfully` });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
