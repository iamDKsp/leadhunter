import { describe, it, expect } from "vitest";
import { formatStageLeadsForWhatsApp, getLeadGoogleMapsUrl } from "@/utils/leadExport";
import { Lead } from "@/types/lead";

describe("leadExport", () => {
  const sampleLeads: Lead[] = [
    {
      id: "1",
      name: "Dallas Construtora",
      phone: "(14) 98816-8089",
      address: "R. Florentino Alexandrino de Oliveira - Jardim Europa, Bauru - SP",
      googlePlaceId: "ChIJ12345PlaceId",
      email: "contato@dallas.com",
      type: "outros",
      activityBranch: "servicos",
      size: "pequeno",
      location: "Bauru - SP",
      website: "",
      successChance: 50,
      tips: "",
      contacted: false,
      tags: [],
      folderId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: "",
      status: "ACTIVE",
    },
    {
      id: "2",
      name: "Patá Beer",
      phone: "(14) 99187-7154",
      address: "R. Cel. Antônio de Ávila Rebouças, 494 - Jardim Estoril",
      email: "",
      type: "restaurante",
      activityBranch: "comercio",
      size: "pequeno",
      location: "Bauru - SP",
      website: "",
      successChance: 50,
      tips: "",
      contacted: false,
      tags: [],
      folderId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: "",
      status: "ACTIVE",
    }
  ];

  it("should generate proper Google Maps URL with place_id and fallback search", () => {
    expect(getLeadGoogleMapsUrl(sampleLeads[0])).toBe("https://www.google.com/maps/place/?q=place_id:ChIJ12345PlaceId");
    expect(getLeadGoogleMapsUrl(sampleLeads[1])).toContain("https://www.google.com/maps/search/?api=1&query=");
  });

  it("should format stage leads with clear WhatsApp structure and dividers", () => {
    const formatted = formatStageLeadsForWhatsApp("Abordagem", sampleLeads);
    
    expect(formatted).toContain("*📋 Leads - Abordagem (2 leads)*");
    expect(formatted).toContain("*Nome:* Dallas Construtora");
    expect(formatted).toContain("*Telefone:* (14) 98816-8089");
    expect(formatted).toContain("*Endereço:* R. Florentino Alexandrino de Oliveira - Jardim Europa, Bauru - SP");
    expect(formatted).toContain("*Google Maps:* https://www.google.com/maps/place/?q=place_id:ChIJ12345PlaceId");
    expect(formatted).toContain("---");
    expect(formatted).toContain("*Nome:* Patá Beer");
    expect(formatted).toContain("*Telefone:* (14) 99187-7154");
  });
});
