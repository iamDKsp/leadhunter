import { useState } from 'react';
import { companies } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Plus, MapPin, Star, Phone, Globe } from 'lucide-react';
import { Lead } from '@/types/lead';

interface GoogleMapsSearchProps {
    onLeadAdded: (lead: Lead) => void;
}

export function GoogleMapsSearch({ onLeadAdded }: GoogleMapsSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isImporting, setIsImporting] = useState<string | null>(null);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setResults([]);
        try {
            const data = await companies.search(query);
            console.log("Search results:", data); // Debug log
            setResults(data);
            if (data.length === 0) {
                toast.info('Nenhuma empresa encontrada.');
            }
        } catch (error) {
            toast.error('Erro ao buscar empresas. Tente novamente.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Import
    const handleImport = async (place: any) => {
        setIsImporting(place.place_id);
        try {
            // Basic default data for imported company
            const customData = {
                type: 'outros',
                activityBranch: 'servicos',
                size: 'pequeno',
                successChance: 50, // Default value
                tips: 'Importado do Google Maps',
            };

            const newLead = await companies.import(place.place_id, undefined, customData);
            onLeadAdded(newLead); // Notify parent component

            // Update local state to show as saved
            setResults(prev => prev.map(p => p.place_id === place.place_id ? { ...p, saved: true } : p));

            toast.success(`${place.name} importado com sucesso!`);
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
            <Card className="p-6">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <Input
                        placeholder="Ex: Barbearias em São Paulo, Mecânica em Curitiba..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1"
                    />
                    <Button type="submit" disabled={isLoading} className="bg-primary text-white">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Pesquisar no Google
                    </Button>
                </form>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((place) => (
                    <Card key={place.place_id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg font-bold">{place.name}</CardTitle>
                                    <CardDescription className="flex flex-col mt-1 gap-1">
                                        <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {place.address}</span>
                                        <a
                                            href={`https://www.google.com/maps/place/?q=place_id:${place.place_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline text-xs flex items-center"
                                        >
                                            <Globe className="h-3 w-3 mr-1" /> Ver no Google Maps
                                        </a>
                                    </CardDescription>
                                </div>
                                {place.rating && (
                                    <Badge variant="secondary" className="flex items-center">
                                        <Star className="h-3 w-3 mr-1 text-yellow-500" />
                                        {place.rating}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 mb-4 text-sm text-gray-600">
                                {place.opening_hours?.open_now !== undefined && (
                                    <div className="flex items-center">
                                        <span className={`w-2 h-2 rounded-full mr-2 ${place.opening_hours.open_now ? 'bg-green-500' : 'bg-red-500'}`} />
                                        {place.opening_hours.open_now ? 'Aberto agora' : 'Fechado'}
                                    </div>
                                )}
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
                <p className="text-center text-muted-foreground text-sm mt-4">
                    {results.length} resultados encontrados
                </p>
            )}
        </div>
    );
}
