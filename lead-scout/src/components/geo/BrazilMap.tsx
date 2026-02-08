import React, { memo, useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { Tooltip } from "react-tooltip";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

import geoUrl from "@/assets/geo/brazil-states.json";

interface BrazilMapProps {
    onStateSelect: (stateSigla: string) => void;
    selectedState: string | null;
}

const STATE_CENTROIDS: Record<string, [number, number]> = {
    'AC': [-70.5, -9.0], 'AL': [-36.5, -9.6], 'AM': [-64.5, -4.0], 'AP': [-51.5, 1.0],
    'BA': [-41.5, -12.5], 'CE': [-39.5, -5.0], 'DF': [-47.8, -15.8], 'ES': [-40.5, -19.5],
    'GO': [-49.5, -16.0], 'MA': [-45.0, -5.0], 'MG': [-44.0, -18.5], 'MS': [-54.5, -20.5],
    'MT': [-55.5, -12.5], 'PA': [-52.5, -3.5], 'PB': [-36.5, -7.2], 'PE': [-38.0, -8.3],
    'PI': [-42.5, -7.5], 'PR': [-51.0, -24.5], 'RJ': [-42.5, -22.0], 'RN': [-36.5, -5.7],
    'RO': [-62.5, -10.5], 'RR': [-61.5, 2.0], 'RS': [-53.0, -29.5], 'SC': [-50.5, -27.0],
    'SE': [-37.4, -10.5], 'SP': [-48.5, -22.0], 'TO': [-48.5, -10.0]
};

const INITIAL_POSITION = { coordinates: [-54, -15] as [number, number], zoom: 1 };

const BrazilMap = ({ onStateSelect, selectedState }: BrazilMapProps) => {
    const [position, setPosition] = useState(INITIAL_POSITION);

    // Animation refs
    const requestRef = React.useRef<number>();
    const targetRef = React.useRef(INITIAL_POSITION);
    const currentRef = React.useRef(INITIAL_POSITION);

    // Linear interpolation helper
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    const animate = () => {
        const factor = 0.1; // Smoothness factor (lower = slower/smoother)

        const nextZoom = lerp(currentRef.current.zoom, targetRef.current.zoom, factor);
        const nextX = lerp(currentRef.current.coordinates[0], targetRef.current.coordinates[0], factor);
        const nextY = lerp(currentRef.current.coordinates[1], targetRef.current.coordinates[1], factor);

        // Check completion
        if (
            Math.abs(nextZoom - targetRef.current.zoom) < 0.001 &&
            Math.abs(nextX - targetRef.current.coordinates[0]) < 0.001 &&
            Math.abs(nextY - targetRef.current.coordinates[1]) < 0.001
        ) {
            currentRef.current = targetRef.current;
            setPosition(targetRef.current);
            return;
        }

        currentRef.current = { coordinates: [nextX, nextY], zoom: nextZoom };
        setPosition(currentRef.current);
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        let newTarget = INITIAL_POSITION;

        if (selectedState && STATE_CENTROIDS[selectedState]) {
            newTarget = {
                coordinates: STATE_CENTROIDS[selectedState],
                zoom: 4 // Deeper zoom
            };
        }

        targetRef.current = newTarget;

        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(animate);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [selectedState]);

    const handleRecenter = (e: React.MouseEvent) => {
        e.stopPropagation();
        onStateSelect(""); // Clear selection
        // Animation loop will handle the rest via useEffect
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full h-[600px] glass-card overflow-hidden relative group"
            data-tip=""
        >
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <Button
                    size="icon"
                    variant="outline"
                    className="bg-card/80 backdrop-blur border-border hover:bg-primary/20 hover:border-primary transition-all"
                    onClick={handleRecenter}
                    title="Recentralizar Mapa"
                >
                    <RotateCcw className="h-4 w-4" />
                </Button>
            </div>

            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 850,
                    center: [-54, -15]
                }}
                className="w-full h-full"
            >
                <ZoomableGroup
                    zoom={position.zoom}
                    center={position.coordinates}
                    onMoveEnd={({ coordinates, zoom }) => {
                        // Updating current ref allows user to drag and then animation to resume/correct if logic desires
                        // But strictly for tracking, we just sync if user drags manually
                        currentRef.current = { coordinates: coordinates as [number, number], zoom };
                        setPosition({ coordinates: coordinates as [number, number], zoom });
                    }}
                    maxZoom={10}
                >
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const isSelected = selectedState === geo.properties.sigla;
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onClick={() => {
                                            const { sigla } = geo.properties;
                                            onStateSelect(sigla);
                                        }}
                                        data-tooltip-id="my-tooltip"
                                        data-tooltip-content={geo.properties.name}
                                        style={{
                                            default: {
                                                fill: isSelected ? "hsl(142, 76%, 45%)" : "hsl(217, 33%, 20%)",
                                                outline: "none",
                                                stroke: "hsl(222, 47%, 9%)",
                                                strokeWidth: 0.5,
                                                transition: "all 0.3s ease"
                                            },
                                            hover: {
                                                fill: "hsl(142, 76%, 45%)",
                                                fillOpacity: 0.8,
                                                outline: "none",
                                                cursor: "pointer",
                                                transform: "scale(1.01)",
                                                transition: "all 0.3s ease"
                                            },
                                            pressed: {
                                                fill: "hsl(142, 76%, 35%)",
                                                outline: "none"
                                            }
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
            <Tooltip
                id="my-tooltip"
                style={{
                    backgroundColor: "hsl(222, 47%, 9%)",
                    color: "white",
                    border: "1px solid hsl(142, 76%, 45%)",
                    borderRadius: "8px",
                    zIndex: 50
                }}
            />
        </motion.div>
    );
};

export default memo(BrazilMap);
