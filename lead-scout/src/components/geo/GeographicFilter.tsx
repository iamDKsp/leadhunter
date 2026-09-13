import { useState } from "react";
import BrazilMap from "./BrazilMap";
import { CitySelector } from "./CitySelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { X, Map } from "lucide-react";

interface GeographicFilterProps {
    onLocationSelect: (location: string | null) => void;
}

const BRAZILIAN_STATES = [
    { sigla: "AC", nome: "Acre" },
    { sigla: "AL", nome: "Alagoas" },
    { sigla: "AP", nome: "Amapá" },
    { sigla: "AM", nome: "Amazonas" },
    { sigla: "BA", nome: "Bahia" },
    { sigla: "CE", nome: "Ceará" },
    { sigla: "DF", nome: "Distrito Federal" },
    { sigla: "ES", nome: "Espírito Santo" },
    { sigla: "GO", nome: "Goiás" },
    { sigla: "MA", nome: "Maranhão" },
    { sigla: "MT", nome: "Mato Grosso" },
    { sigla: "MS", nome: "Mato Grosso do Sul" },
    { sigla: "MG", nome: "Minas Gerais" },
    { sigla: "PA", nome: "Pará" },
    { sigla: "PB", nome: "Paraíba" },
    { sigla: "PR", nome: "Paraná" },
    { sigla: "PE", nome: "Pernambuco" },
    { sigla: "PI", nome: "Piauí" },
    { sigla: "RJ", nome: "Rio de Janeiro" },
    { sigla: "RN", nome: "Rio Grande do Norte" },
    { sigla: "RS", nome: "Rio Grande do Sul" },
    { sigla: "RO", nome: "Rondônia" },
    { sigla: "RR", nome: "Roraima" },
    { sigla: "SC", nome: "Santa Catarina" },
    { sigla: "SP", nome: "São Paulo" },
    { sigla: "SE", nome: "Sergipe" },
    { sigla: "TO", nome: "Tocantins" },
];

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
                            Selecione um estado no menu ou no mapa, e opcionalmente escolha a cidade.
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
                                        <span className="font-bold">
                                            {selectedState} - {BRAZILIAN_STATES.find(s => s.sigla === selectedState)?.nome || ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Cidade:</span>
                                        <span className="font-bold">{selectedCity || "Todas as cidades (Estado inteiro)"}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic">Nenhuma localização selecionada.</p>
                            )}
                        </div>

                        {/* Menu Dropdown de Estado */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Estado (UF)</label>
                            <select
                                value={selectedState || ""}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (!val) {
                                        clearFilter();
                                    } else {
                                        handleStateSelect(val);
                                    }
                                }}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="">Selecione um estado no menu ou no mapa...</option>
                                {BRAZILIAN_STATES.map((st) => (
                                    <option key={st.sigla} value={st.sigla}>
                                        {st.sigla} - {st.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Menu Seletor de Cidade */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cidade (Opcional)</label>
                            <CitySelector
                                state={selectedState || ""}
                                selectedCity={selectedCity}
                                onCitySelect={handleCitySelect}
                            />
                            {!selectedState ? (
                                <p className="text-xs text-muted-foreground">Selecione um estado no menu acima ou clique no mapa.</p>
                            ) : !selectedCity ? (
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    ✓ Buscando em todo o estado ({selectedState}). Escolha uma cidade para refinar.
                                </p>
                            ) : null}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
