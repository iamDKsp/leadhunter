
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import axios from "axios";

interface CitySelectorProps {
    state: string; // state sigla, ex: 'SP'
    selectedCity: string | null;
    onCitySelect: (city: string) => void;
}

interface City {
    id: number;
    nome: string;
}

export function CitySelector({ state, selectedCity, onCitySelect }: CitySelectorProps) {
    const [open, setOpen] = useState(false);
    const [cities, setCities] = useState<City[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!state) return;

        const fetchCities = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios`);
                setCities(response.data);
            } catch (error) {
                console.error("Failed to fetch cities:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCities();
    }, [state]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={!state || isLoading}
                >
                    {selectedCity
                        ? selectedCity
                        : isLoading ? "Carregando cidades..." : "Selecione uma cidade..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Buscar cidade..." />
                    <CommandList>
                        <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                        <CommandGroup>
                            {cities.map((city) => (
                                <CommandItem
                                    key={city.id}
                                    value={city.nome}
                                    onSelect={(currentValue) => {
                                        onCitySelect(currentValue === selectedCity ? "" : currentValue);
                                        setOpen(false);
                                    }}
                                >
                                    <MapPin className={cn("mr-2 h-4 w-4", selectedCity === city.nome ? "opacity-100" : "opacity-0")} />
                                    {city.nome}
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            selectedCity === city.nome ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
