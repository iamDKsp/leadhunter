/**
 * Utility functions for resolving media URLs safely and generating fallback avatars.
 */

export const getMediaUrl = (path?: string | null): string => {
    if (!path) return '';

    // Safety shield: never allow the browser to hit Google Maps Photo API directly
    // to prevent quota exhaustion, 403 errors, and unexpected billing charges.
    if (path.includes('maps.googleapis.com')) {
        return '';
    }

    // Direct absolute URL (e.g. external CDN or already full URL)
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // Relative path (e.g. /uploads/companies/xyz.jpg)
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const apiBase = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
        : (import.meta.env.PROD ? '' : 'http://localhost:3000');

    return `${apiBase}${normalizedPath}`;
};

/**
 * Returns 1 or 2 uppercase initials for a company name
 * e.g. "Auto Mecânica Bauru" -> "AM", "Vidrosan" -> "VI"
 */
export const getCompanyInitials = (name?: string): string => {
    if (!name || !name.trim()) return 'LH';

    const words = name.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
};

/**
 * Generates a stable pleasant background color for company avatar based on its name
 */
const AVATAR_COLORS = [
    'bg-blue-600/20 text-blue-400 border-blue-500/30',
    'bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
    'bg-purple-600/20 text-purple-400 border-purple-500/30',
    'bg-amber-600/20 text-amber-400 border-amber-500/30',
    'bg-cyan-600/20 text-cyan-400 border-cyan-500/30',
    'bg-rose-600/20 text-rose-400 border-rose-500/30',
    'bg-indigo-600/20 text-indigo-400 border-indigo-500/30',
    'bg-teal-600/20 text-teal-400 border-teal-500/30',
];

export const getCompanyAvatarColor = (name?: string): string => {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
};
