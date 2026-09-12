import { Lead } from '@/types/lead';

/**
 * Retorna a URL do Google Maps para o lead, priorizando o googlePlaceId
 * ou gerando uma busca pelo endereço/localização.
 */
export function getLeadGoogleMapsUrl(lead: Lead): string {
    if (lead.googlePlaceId) {
        return `https://www.google.com/maps/place/?q=place_id:${lead.googlePlaceId}`;
    }
    const query = lead.address?.trim() || lead.location?.trim() || lead.name?.trim();
    if (query) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    }
    return '';
}

/**
 * Formata um único lead estruturado para WhatsApp
 */
export function formatSingleLeadForWhatsApp(lead: Lead): string {
    const name = lead.name?.trim() || 'Sem nome';
    const phone = lead.phone?.trim() || 'Não informado';
    const address = lead.address?.trim() || lead.location?.trim() || 'Não informado';
    const mapsUrl = getLeadGoogleMapsUrl(lead);

    const lines = [
        `*Nome:* ${name}`,
        `*Telefone:* ${phone}`,
        `*Endereço:* ${address}`,
    ];

    if (mapsUrl) {
        lines.push(`*Google Maps:* ${mapsUrl}`);
    }

    return lines.join('\n');
}

/**
 * Formata toda a lista de leads de uma etapa estruturado para WhatsApp
 */
export function formatStageLeadsForWhatsApp(stageName: string, leads: Lead[]): string {
    const countText = leads.length === 1 ? '1 lead' : `${leads.length} leads`;
    const header = `*📋 Leads - ${stageName} (${countText})*\n\n`;
    const body = leads.map(formatSingleLeadForWhatsApp).join('\n\n---\n\n');
    return header + body;
}

/**
 * Copia texto para a área de transferência com suporte a fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (err) {
        console.warn('navigator.clipboard.writeText falhou, utilizando fallback...', err);
    }

    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
    } catch (err) {
        console.error('Falha ao copiar usando fallback:', err);
        return false;
    }
}
