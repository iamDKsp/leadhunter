
import { useState } from "react";
import BrazilMap from "./BrazilMap";
import { CitySelector } from "./CitySelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { X, Map } from "lucide-react";

interface GeographicFilterProps {
    onLocationSelect: (location: string | null) => void;
}

export function GeographicFilter({ onLocationSelect }: GeographicFilterProps) {
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);

    const handleStateSelect = (stateSigla: string) => {
        // If clicking the same state, deselect it
        if (selectedState === stateSigla) {
            setSelectedState(null);
            setSelectedCity(null);
            onLocationSelect(null);
            return;
        }

        setSelectedState(stateSigla);
        setSelectedCity(null); // Reset city when state changes

        // We don't verify location just with state, we wait for city or user action? 
        // Requirement says "after selecting state, open new list for city".
        // Let's assume user wants to filter by State + City mainly, but maybe State only is useful too?
        // For now, let's notify parent only when user selects city or clear.
        // Actually, Google Maps might accept "State, Brazil" but "City, State, Brazil" is better.
        // Let's notify as soon as we have enough info.
        onLocationSelect(`${stateSigla}, Brasil`);
    };

    const handleCitySelect = (city: string) => {
        setSelectedCity(city);
        if (city && selectedState) {
            onLocationSelect(`${city}, ${selectedState}, Brasil`);
        } else if (selectedState) {
            onLocationSelect(`${selectedState}, Brasil`);
        } else {
            onLocationSelect(null);
        }
    };

    const clearFilter = () => {
        setSelectedState(null);
        setSelectedCity(null);
        onLocationSelect(null);
    };

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-base flex items-center">
                            <Map className="w-4 h-4 mr-2" />
                            Filtro Geográfico
                        </CardTitle>
                        <CardDescription>
                            Selecione um estado no mapa e depois a cidade.
                        </CardDescription>
                    </div>
                    {(selectedState || selectedCity) && (
                        <Button variant="ghost" size="sm" onClick={clearFilter} className="h-8 text-destructive">
                            <X className="w-4 h-4 mr-2" />
                            Limpar Filtro
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Map Section */}
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 min-h-[300px]">
                        <BrazilMap
                            selectedState={selectedState}
                            onStateSelect={handleStateSelect}
                        />
                    </div>

                    {/* Sidebar / Controls */}
                    <div className="w-full md:w-1/3 space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg border border-dashed text-sm">
                            <p className="font-medium mb-2">Localização Selecionada:</p>
                            {selectedState ? (
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Estado:</span>
                                        <span className="font-bold">{selectedState}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Cidade:</span>
                                        <span className="font-bold">{selectedCity || "-"}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic">Nenhuma localização selecionada.</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cidade</label>
                            <CitySelector
                                state={selectedState || ""}
                                selectedCity={selectedCity}
                                onCitySelect={handleCitySelect}
                            />
                            {!selectedState && (
                                <p className="text-xs text-muted-foreground">Selecione um estado no mapa primeiro.</p>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
