import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Music, Volume2, VolumeX, Loader2, Radio } from 'lucide-react';

interface AudioPlayerProps {
    className?: string;
}

// Lista de rádios web gratuitas (streams MP3 HTTPS de alta confiabilidade)
const RADIO_STATIONS = [
    { name: 'Lofi Girl / Chill', url: 'https://lofi.stream.laut.fm/lofi', keywords: ['lofi', 'lo-fi', 'relax', 'study'] },
    { name: 'Synthwave / Retrowave', url: 'https://nightdrive.stream.laut.fm/nightdrive', keywords: ['synth', 'retro', '80s', 'cyberpunk'] },
    { name: 'Foco / Ambient', url: 'https://ambient.stream.laut.fm/ambient', keywords: ['focus', 'ambient', 'calmo'] },
    { name: 'Pop Hits', url: 'https://100hitz.stream.laut.fm/100hitz', keywords: ['pop', 'hits', 'agito'] },
    { name: 'Rock Clássico', url: 'https://rock.stream.laut.fm/rock', keywords: ['rock', 'metal', 'pesado'] },
    { name: 'Piano / Deep Focus', url: 'https://piano.stream.laut.fm/piano', keywords: ['jazz', 'classic', 'classico', 'piano'] }
];

const STATIONS_LIST_TEXT = "Ex: Lofi, Rock, Pop, Synth...";

const YouTubeAudioPlayer: React.FC<AudioPlayerProps> = ({ className }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentStation, setCurrentStation] = useState<{ name: string, url: string } | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [hasError, setHasError] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Inicializar o áudio na primeira vez
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.volume = 0.5;

            // Event listeners do elemento áudio HTML5 nativo
            audioRef.current.addEventListener('playing', () => {
                setIsLoading(false);
                setIsPlaying(true);
                setHasError(false);
            });

            audioRef.current.addEventListener('waiting', () => setIsLoading(true));
            audioRef.current.addEventListener('pause', () => setIsPlaying(false));
            audioRef.current.addEventListener('error', (e) => {
                console.error("Audio playback error", e);
                setIsLoading(false);
                setIsPlaying(false);
                setHasError(true);
            });
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
        }
    }, []);

    const findStation = (query: string) => {
        const lowerQuery = query.toLowerCase().trim();
        // Buscar por palavra-chave
        const foundByKeyword = RADIO_STATIONS.find(station =>
            station.keywords.some(kw => lowerQuery.includes(kw)) ||
            station.name.toLowerCase().includes(lowerQuery)
        );

        // Se não achar nada específico, toca Lofi
        return foundByKeyword || RADIO_STATIONS[0];
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim() || !audioRef.current) return;

        setIsLoading(true);
        setHasError(false);
        setIsPlaying(false);

        const station = findStation(searchQuery);
        setCurrentStation(station);
        setSearchQuery(station.name); // Atualiza o input pro nome da rádio real encontrada

        // Parar áudio anterior
        audioRef.current.pause();
        audioRef.current.src = station.url;

        // Tentar tocar (Navegadores podem bloquear se não houver interação)
        audioRef.current.play().catch(err => {
            console.warn("Autoplay bloqueado pelo navegador. Usuário precisa clicar no play.", err);
            setIsLoading(false);
            setIsPlaying(false);
        });
    };

    const togglePlay = () => {
        if (!audioRef.current || !currentStation) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            setIsLoading(true);
            audioRef.current.play().catch(err => {
                console.error("Erro ao tocar", err);
                setHasError(true);
                setIsLoading(false);
            });
        }
    };

    const toggleMute = () => {
        if (!audioRef.current) return;

        const newMutedState = !isMuted;
        audioRef.current.muted = newMutedState;
        setIsMuted(newMutedState);
    };

    return (
        <div className={`mt-0 z-50 ${className || ''}`}>

            <div className="flex flex-col items-end gap-2">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full p-1.5 pr-3 shadow-2xl relative overflow-hidden max-w-[280px]"
                >
                    {/* Animated background glow when playing */}
                    {isPlaying && !isLoading && (
                        <div className="absolute inset-0 bg-primary/20 animate-pulse-slow"></div>
                    )}

                    {hasError && (
                        <div className="absolute inset-0 bg-red-500/10"></div>
                    )}

                    <form onSubmit={handleSearch} className="flex relative z-10 w-full flex-1">
                        <div className="relative flex items-center w-full">
                            <Radio className="w-4 h-4 text-emerald-400 absolute left-3" />
                            <input
                                type="text"
                                placeholder="Rádio (Ex: Lofi...)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-3 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-primary/50 w-full sm:w-40 transition-all font-medium"
                                autoComplete="off"
                            />
                        </div>
                        <button type="submit" className="hidden">buscar</button>
                    </form>

                    <div className="w-px h-6 bg-white/20 mx-1 z-10 hidden sm:block"></div>

                    {/* Controls */}
                    <div className="flex items-center gap-1 z-10 shrink-0">
                        <button
                            onClick={togglePlay}
                            disabled={!currentStation && !searchQuery.trim()}
                            className={`p-1.5 rounded-full transition-all flex items-center justify-center w-8 h-8 ${(currentStation || searchQuery) ? 'hover:bg-primary/20 text-white bg-white/5 border border-white/10' : 'text-muted-foreground opacity-50 cursor-not-allowed'}`}
                            title={isPlaying ? "Pausar" : "Tocar"}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            ) : isPlaying ? (
                                <Pause className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                            ) : (
                                <Play className="w-4 h-4 ml-0.5 text-white" />
                            )}
                        </button>

                        <button
                            onClick={toggleMute}
                            disabled={!currentStation}
                            className={`p-1.5 rounded-full transition-all flex items-center justify-center w-8 h-8 ${currentStation ? 'hover:bg-white/10 text-white' : 'text-muted-foreground opacity-50 cursor-not-allowed hidden sm:flex'}`}
                            title={isMuted ? "Ativar som" : "Mudo"}
                        >
                            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </motion.div>

                {/* Now Playing Status */}
                <AnimatePresence>
                    {(currentStation || isLoading || hasError) && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            className="flex items-center gap-2 text-[10px] text-white/50 bg-black/20 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm self-end mr-3"
                        >
                            {isPlaying && !isLoading ? (
                                <div className="flex items-center gap-1">
                                    <div className="w-1 h-2.5 bg-emerald-400 rounded-full animate-[musicBar_1s_ease-in-out_infinite]"></div>
                                    <div className="w-1 h-3.5 bg-emerald-400 rounded-full animate-[musicBar_1.2s_ease-in-out_infinite_0.1s]"></div>
                                    <div className="w-1 h-2 bg-emerald-400 rounded-full animate-[musicBar_0.8s_ease-in-out_infinite_0.2s]"></div>
                                </div>
                            ) : (
                                <Music className={`w-2.5 h-2.5 ${hasError ? 'text-red-400' : ''}`} />
                            )}
                            <span className={`truncate max-w-[150px] font-medium text-[10px] ${hasError ? 'text-red-400' : 'text-emerald-300/80'}`}>
                                {isLoading ? 'Conectando à rádio...' :
                                    hasError ? 'Erro na rádio. Tente Lofi, Pop' :
                                        isPlaying ? `No ar: ${currentStation?.name}` :
                                            `Pausado: ${currentStation?.name}`}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Optional Keyframes via style */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes musicBar {
                        0%, 100% { height: 6px; }
                        50% { height: 12px; }
                    }
                    .animate-pulse-slow {
                        animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    }
                    `}} />
            </div>
        </div>
    );
};

export default YouTubeAudioPlayer;
