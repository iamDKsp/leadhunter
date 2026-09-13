import { useState } from 'react';
import { companies } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Plus, MapPin, Star, Globe, Filter, Navigation, X, Phone, CheckCircle2 } from 'lucide-react';
import { Lead } from '@/types/lead';
import { GeographicFilter } from './geo/GeographicFilter';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';

interface GoogleMapsSearchProps {
    onLeadAdded: (lead: Lead) => void;
}

export function GoogleMapsSearch({ onLeadAdded }: GoogleMapsSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isImporting, setIsImporting] = useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(true);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Filter States
    const [limit, setLimit] = useState("20");
    const [minRating, setMinRating] = useState("");
    const [maxRating, setMaxRating] = useState("");
    const [minReviews, setMinReviews] = useState("");
    const [openNow, setOpenNow] = useState(false);
    const [mustHavePhone, setMustHavePhone] = useState(true);
    const [matchTermInName, setMatchTermInName] = useState(false);
    const [hideSaved, setHideSaved] = useState(false);
    const [radius, setRadius] = useState("");
    const [isLocating, setIsLocating] = useState(false);
    const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);

    const handleNearbySearch = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocalização não é suportada pelo seu navegador.');
            return;
        }

        setIsLocating(true);
        triggerHaptic('light');

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    const resp = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
                        { headers: { 'Accept-Language': 'pt-BR' } }
                    );
                    const data = await resp.json();
                    const address = data.address || {};
                    const city = address.city || address.town || address.village || address.municipality || 'Minha Região';
                    const suburb = address.suburb || address.neighbourhood || '';
                    const state = address.state || '';
                    const label = suburb ? `${suburb}, ${city}` : (state ? `${city}, ${state}` : city);

                    setGpsLocation({ lat: latitude, lng: longitude, label });
                    setSelectedLocation(label);
                    triggerHaptic('success');
                    toast.success(`📍 Localização detectada: ${label}`);
                } catch {
                    const label = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
                    setGpsLocation({ lat: latitude, lng: longitude, label });
                    setSelectedLocation(label);
                    triggerHaptic('success');
                    toast.success('📍 Localização GPS obtida!');
                } finally {
                    setIsLocating(false);
                }
            },
            (err) => {
                setIsLocating(false);
                triggerHaptic('error');
                if (err.code === 1) {
                    toast.error('Permissão negada. Ative o GPS no navegador do celular.');
                } else {
                    toast.error('Não foi possível obter a sua localização.');
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const clearGps = () => {
        setGpsLocation(null);
        setSelectedLocation(null);
        triggerHaptic('light');
    };

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setResults([]);
        try {
            const searchQuery = selectedLocation ? `${query} em ${selectedLocation}` : query;
            const locationParam = gpsLocation ? `${gpsLocation.lat},${gpsLocation.lng}` : (selectedLocation || undefined);

            const data = await companies.search(searchQuery, {
                limit: parseInt(limit),
                minRating: minRating ? parseFloat(minRating) : undefined,
                maxRating: maxRating ? parseFloat(maxRating) : undefined,
                minReviews: minReviews ? parseInt(minReviews) : undefined,
                openNow: openNow,
                mustHavePhone: mustHavePhone,
                matchTermInName: matchTermInName,
                hideSaved: hideSaved,
                radius: radius ? parseInt(radius) : (gpsLocation ? 5000 : undefined),
                location: locationParam,
            });

            console.log("Search results:", data);
            setResults(data);
            if (data.length === 0) {
                toast.info('Nenhuma empresa encontrada com os filtros selecionados.');
            }
        } catch (error) {
            toast.error('Erro ao buscar empresas. Tente novamente.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to determine company type and branch
    const determineCompanyInfo = (place: any) => {
        const types = (place.types || []).map((t: string) => t.toLowerCase());
        const name = (place.name || '').toLowerCase();

        let type: 'lavacar' | 'barbearia' | 'restaurante' | 'concertinas' | 'salao' | 'outros' = 'outros';
        let activityBranch: 'servicos' | 'comercio' | 'industria' | 'tecnologia' | 'saude' = 'servicos';

        // Helper for keyword checking
        const has = (keywords: string[]) => keywords.some(k => name.includes(k) || types.includes(k));

        if (has(['car_wash', 'lava', 'automotiva', 'estética automotiva', 'detail'])) {
            type = 'lavacar';
            activityBranch = 'servicos';
        } else if (has(['hair_care', 'barber_shop', 'barbershop', 'barbearia', 'barber', 'cabelo', 'cortezzy', 'cabeleireiro'])) {
            type = 'barbearia';
            activityBranch = 'servicos';
        } else if (has(['beauty_salon', 'spa', 'salão', 'salao', 'beleza', 'estética', 'manicure', 'unhas', 'hair', 'nail'])) {
            type = 'salao';
            activityBranch = 'servicos';
        } else if (has(['restaurant', 'food', 'meal_takeaway', 'meal_delivery', 'restaurante', 'lanchonete', 'bar', 'bistro', 'gastronomia', 'açaí', 'acai', 'pizza', 'hamburgueria'])) {
            type = 'restaurante';
            activityBranch = 'comercio';
        } else if (has(['concertina', 'cerca', 'segurança', 'security', 'alarme'])) {
            type = 'concertinas';
            activityBranch = 'servicos';
        }

        return { type, activityBranch };
    };

    // Handle Import
    const handleImport = async (place: any) => {
        setIsImporting(place.place_id);
        try {
            const { type, activityBranch } = determineCompanyInfo(place);

            // Basic default data for imported company
            const customData = {
                type,
                activityBranch,
                size: 'pequeno',
                successChance: 50, // Default value
                tips: 'Importado do Google Maps',
            };

            const newLead = await companies.import(place.place_id, undefined, customData, place);
            onLeadAdded(newLead); // Notify parent component

            // Update local state to show as saved
            setResults(prev => prev.map(p => p.place_id === place.place_id ? { ...p, saved: true } : p));

            toast.success(`${place.name} importado como ${type.toUpperCase()}!`);
        } catch (error: any) {
            if (error.response?.status === 409) {
                toast.warning('Esta empresa já foi importada anteriormente.');
                setResults(prev => prev.map(p => p.place_id === place.place_id ? { ...p, saved: true } : p));
            } else {
                toast.error('Erro ao importar empresa.');
                console.error(error);
            }
        } finally {
            setIsImporting(null);
        }
    };

    return (
        <div className="space-y-6">

            <Card className="p-4 sm:p-6">
                <div className="space-y-4">
                    <form onSubmit={handleSearch} className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Input
                                placeholder="Ex: Barbearias, Mecânicas, Restaurantes..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="flex-1"
                            />
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                        "flex-1 sm:flex-initial transition-colors",
                                        gpsLocation && "border-primary bg-primary/10 text-primary font-medium"
                                    )}
                                    onClick={handleNearbySearch}
                                    disabled={isLocating}
                                    title="Buscar empresas perto de onde você está agora"
                                >
                                    {isLocating ? (
                                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-primary" />
                                    ) : (
                                        <Navigation className={cn("w-4 h-4 mr-1.5", gpsLocation ? "text-primary fill-current" : "text-blue-500")} />
                                    )}
                                    Perto de Mim
                                </Button>
                                <Button type="button" variant="outline" className="flex-1 sm:flex-initial" onClick={() => setIsFilterOpen(!isFilterOpen)}>
                                    <MapPin className="w-4 h-4 mr-1.5" />
                                    Mapa
                                </Button>
                                <Button type="button" variant="outline" className="flex-1 sm:flex-initial" onClick={() => setShowAdvanced(!showAdvanced)}>
                                    <Filter className="w-4 h-4 mr-1.5" />
                                    Filtros
                                </Button>
                                <Button type="submit" disabled={isLoading} className="bg-primary text-white flex-1 sm:flex-initial">
                                    {isLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                                    Pesquisar
                                </Button>
                            </div>
                        </div>

                        {gpsLocation && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary font-medium w-fit animate-fade-in">
                                <Navigation className="w-3.5 h-3.5 fill-current animate-pulse" />
                                <span>GPS Ativo: {gpsLocation.label} (raio 5km)</span>
                                <button
                                    type="button"
                                    onClick={clearGps}
                                    className="hover:text-foreground ml-1 p-0.5"
                                    title="Remover localização GPS"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Geographic Filter */}
                        <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                            <CollapsibleContent>
                                <GeographicFilter onLocationSelect={setSelectedLocation} />
                            </CollapsibleContent>
                        </Collapsible>

                        {/* Advanced Filters */}
                        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                            <CollapsibleContent className="animate-in slide-in-from-top-2 duration-300">
                                <div className="mt-2 p-4 bg-muted/50 rounded-lg border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Quantidade</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={limit}
                                            onChange={(e) => setLimit(e.target.value)}
                                        >
                                            <option value="20">20 resultados</option>
                                            <option value="40">40 resultados</option>
                                            <option value="60">60 resultados</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Avaliação (Min - Max)</label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                max="5"
                                                step="0.1"
                                                placeholder="Min"
                                                value={minRating}
                                                onChange={(e) => setMinRating(e.target.value)}
                                                className="w-full"
                                            />
                                            <span className="text-muted-foreground">-</span>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="5"
                                                step="0.1"
                                                placeholder="Max"
                                                value={maxRating}
                                                onChange={(e) => setMaxRating(e.target.value)}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Min. Avaliações</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="Ex: 10"
                                            value={minReviews}
                                            onChange={(e) => setMinReviews(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Raio (Metros)</label>
                                        <Input
                                            type="number"
                                            placeholder="Ex: 5000"
                                            value={radius}
                                            onChange={(e) => setRadius(e.target.value)}
                                        />
                                    </div>

                                    <div className="col-span-full md:col-span-4 flex flex-wrap gap-4 pt-2">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="mustHavePhone"
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                checked={mustHavePhone}
                                                onChange={(e) => setMustHavePhone(e.target.checked)}
                                            />
                                            <label htmlFor="mustHavePhone" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                                                Apenas com Telefone
                                            </label>
                                            <Badge variant="secondary" className="text-[10px] h-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                Ativo
                                            </Badge>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="openNow"
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                checked={openNow}
                                                onChange={(e) => setOpenNow(e.target.checked)}
                                            />
                                            <label htmlFor="openNow" className="text-sm font-medium cursor-pointer">
                                                Apenas Abertos Agora
                                            </label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="matchTermInName"
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                checked={matchTermInName}
                                                onChange={(e) => setMatchTermInName(e.target.checked)}
                                            />
                                            <label htmlFor="matchTermInName" className="text-sm font-medium cursor-pointer" title="Só traz empresas que tenham o termo pesquisado no nome">
                                                Termo no Nome
                                            </label>
                                            <Badge variant="outline" className="text-[10px] h-4 text-blue-500 border-blue-500/30">
                                                Exato
                                            </Badge>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="hideSaved"
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                checked={hideSaved}
                                                onChange={(e) => setHideSaved(e.target.checked)}
                                            />
                                            <label htmlFor="hideSaved" className="text-sm font-medium cursor-pointer" title="Oculta empresas que você já importou anteriormente para o CRM">
                                                Ocultar já salvos
                                            </label>
                                        </div>

                                        <div className="flex items-center space-x-2 opacity-50 cursor-not-allowed" title="Em breve">
                                            <div className="h-4 w-4 rounded border border-gray-300 flex items-center justify-center"></div>
                                            <label className="text-sm font-medium text-gray-400">Com Site</label>
                                            <Badge variant="outline" className="text-[10px] h-4 text-gray-500">PRO</Badge>
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>

                        {selectedLocation && !isFilterOpen && (
                            <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded flex items-center">
                                <MapPin className="w-3 h-3 mr-2" />
                                Filtrando por: <span className="font-semibold ml-1">{selectedLocation}</span>
                            </div>
                        )}
                    </form>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((place) => (
                    <Card key={place.place_id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg font-bold">{place.name}</CardTitle>
                                    <CardDescription className="flex flex-col mt-1 gap-1">
                                        <span className="flex items-center"><MapPin className="h-3 w-3 mr-1 shrink-0" /> {place.address}</span>
                                        <a
                                            href={`https://www.google.com/maps/place/?q=place_id:${place.place_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline text-xs flex items-center"
                                        >
                                            <Globe className="h-3 w-3 mr-1 shrink-0" /> Ver no Google Maps
                                        </a>
                                    </CardDescription>
                                </div>
                                {place.rating && (
                                    <Badge variant="secondary" className="flex items-center shrink-0">
                                        <Star className="h-3 w-3 mr-1 text-yellow-500" />
                                        {place.rating}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-300">
                                {/* Telefone com destaque visual */}
                                {place.formatted_phone_number ? (
                                    <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1 rounded-md text-xs w-fit">
                                        <Phone className="w-3.5 h-3.5 shrink-0" />
                                        <span>{place.formatted_phone_number}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md w-fit">
                                        <Phone className="w-3.5 h-3.5 shrink-0" />
                                        <span>Sem telefone informado</span>
                                    </div>
                                )}

                                {/* Status de Funcionamento */}
                                <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                                    {place.business_status === 'OPERATIONAL' && (
                                        <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                                            <span className="w-2 h-2 rounded-full mr-1.5 bg-emerald-500" />
                                            Empresa Ativa
                                        </span>
                                    )}

                                    {place.opening_hours?.open_now !== undefined && (
                                        <div className="flex items-center">
                                            <span className={`w-2 h-2 rounded-full mr-1.5 ${place.opening_hours.open_now ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                            {place.opening_hours.open_now ? 'Aberto agora' : 'Fechado no momento'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                onClick={() => handleImport(place)}
                                disabled={isImporting === place.place_id || place.saved}
                                className="w-full"
                                variant={place.saved ? "secondary" : "outline"}
                            >
                                {isImporting === place.place_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : place.saved ? (
                                    <>
                                        <Star className="h-4 w-4 mr-2 fill-current" />
                                        Já Salvo
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Salvar como Lead
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {results.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-muted-foreground text-sm mt-4 text-center">
                    <span>{results.length} resultados encontrados</span>
                    {results.some(r => r.saved) && (
                        <span className="text-amber-500 font-medium">
                            ({results.filter(r => r.saved).length} já salvos no CRM)
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
