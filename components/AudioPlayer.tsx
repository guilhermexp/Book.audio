import React, { useState, useEffect } from 'react';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import StopIcon from './icons/StopIcon';
import RewindIcon from './icons/RewindIcon';
import ForwardIcon from './icons/ForwardIcon';
import Rewind15Icon from './icons/Rewind15Icon';
import Forward15Icon from './icons/Forward15Icon';
import ClockIcon from './icons/ClockIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import WifiIcon from './icons/WifiIcon';
import ArrowsPointingOutIcon from './icons/ArrowsPointingOutIcon';
import { ttsService, TTSVoice } from '../services/ttsService';

interface AudioPlayerProps {
    isVisible: boolean;
    isBookLoaded?: boolean;
    isTTSPlaying?: boolean;
    ttsVoice?: string;
    ttsSpeed?: number;
    ttsBackendHealthy?: boolean;
    currentPage?: number;
    totalPages?: number;
    onTTSPlay?: () => void;
    onTTSPause?: () => void;
    onTTSStop?: () => void;
    onTTSVoiceChange?: (voice: string) => void;
    onTTSSpeedChange?: (speed: number) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
    isVisible,
    isBookLoaded = false,
    isTTSPlaying = false,
    ttsVoice = 'pt-BR-FranciscaNeural',
    ttsSpeed = 1.0,
    ttsBackendHealthy = false,
    currentPage = 1,
    totalPages = 1,
    onTTSPlay,
    onTTSPause,
    onTTSStop,
    onTTSVoiceChange,
    onTTSSpeedChange
}) => {
    const [progress, setProgress] = useState(0);
    const [showVoiceMenu, setShowVoiceMenu] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [availableVoices, setAvailableVoices] = useState<TTSVoice[]>([]);
    const [isLoadingVoices, setIsLoadingVoices] = useState(false);

    useEffect(() => {
        if (showVoiceMenu && availableVoices.length === 0 && !isLoadingVoices) {
            loadVoices();
        }
    }, [showVoiceMenu]);

    useEffect(() => {
        // Calculate progress based on current page
        if (totalPages > 0) {
            setProgress((currentPage / totalPages) * 100);
        }
    }, [currentPage, totalPages]);

    const loadVoices = async () => {
        setIsLoadingVoices(true);
        try {
            const voices = await ttsService.getVoices();
            setAvailableVoices(voices);
        } catch (error) {
            console.error('Error loading voices:', error);
        }
        setIsLoadingVoices(false);
    };

    const handleSpeedChange = (speed: number) => {
        onTTSSpeedChange?.(speed);
        setShowSpeedMenu(false);
    };

    const handleVoiceChange = (voiceId: string) => {
        onTTSVoiceChange?.(voiceId);
        setShowVoiceMenu(false);
    };

    const speedOptions = [
        { value: 0.5, label: '0.5x' },
        { value: 0.75, label: '0.75x' },
        { value: 1.0, label: '1.0x' },
        { value: 1.25, label: '1.25x' },
        { value: 1.5, label: '1.5x' },
        { value: 1.75, label: '1.75x' },
        { value: 2.0, label: '2.0x' }
    ];

    if (!isVisible) {
        return null;
    }

    // Group voices by locale
    const ptBRVoices = availableVoices.filter(v => v.locale.startsWith('pt-BR'));
    const enUSVoices = availableVoices.filter(v => v.locale.startsWith('en-US'));
    const otherVoices = availableVoices.filter(v => !v.locale.startsWith('pt-BR') && !v.locale.startsWith('en-US'));

    return (
        <div className="fixed inset-x-0 bottom-0 z-30 p-4 flex justify-center">
            <div className="w-full max-w-4xl bg-neutral-800/50 backdrop-blur-xl rounded-2xl p-4 font-sans text-neutral-200 shadow-2xl ring-1 ring-white/10">
                {/* TTS Mode Indicator */}
                {isBookLoaded && ttsBackendHealthy && (
                    <div className="text-center mb-3">
                        <span className="text-xs text-purple-400 font-medium">
                            🎙️ Modo Leitura {isTTSPlaying ? '(Reproduzindo)' : '(Pausado)'}
                        </span>
                    </div>
                )}

                {/* Top Controls */}
                <div className="flex items-center justify-center gap-8 text-xs text-neutral-400 mb-4">
                    {/* Speed Control */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                            className="flex items-center gap-2 hover:text-white transition-colors"
                        >
                            <ClockIcon className="w-4 h-4" />
                            Velocidade ({ttsSpeed}x)
                        </button>

                        {showSpeedMenu && (
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-neutral-900 rounded-lg py-2 min-w-[120px] shadow-lg">
                                {speedOptions.map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleSpeedChange(option.value)}
                                        className={`block w-full px-4 py-1 text-left hover:bg-neutral-800 ${ttsSpeed === option.value ? 'text-purple-400' : ''}`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Voice Selection */}
                    <div className="relative">
                        <button
                            onClick={() => setShowVoiceMenu(!showVoiceMenu)}
                            className="flex items-center gap-2 hover:text-white transition-colors"
                        >
                            <BookOpenIcon className="w-4 h-4" />
                            Voz
                        </button>

                        {showVoiceMenu && (
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-neutral-900 rounded-lg py-2 min-w-[200px] max-h-64 overflow-y-auto shadow-lg">
                                {isLoadingVoices ? (
                                    <div className="px-4 py-2 text-center text-neutral-500">Carregando...</div>
                                ) : (
                                    <>
                                        {ptBRVoices.length > 0 && (
                                            <>
                                                <div className="px-4 py-1 text-xs font-bold text-neutral-500">🇧🇷 Português</div>
                                                {ptBRVoices.map(voice => (
                                                    <button
                                                        key={voice.id}
                                                        onClick={() => handleVoiceChange(voice.id)}
                                                        className={`block w-full px-4 py-1 text-left hover:bg-neutral-800 text-xs ${ttsVoice === voice.id ? 'text-purple-400' : ''}`}
                                                    >
                                                        {voice.name.split(' - ')[1] || voice.name}
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                        {enUSVoices.length > 0 && (
                                            <>
                                                <div className="px-4 py-1 text-xs font-bold text-neutral-500 mt-2">🇺🇸 English</div>
                                                {enUSVoices.slice(0, 10).map(voice => (
                                                    <button
                                                        key={voice.id}
                                                        onClick={() => handleVoiceChange(voice.id)}
                                                        className={`block w-full px-4 py-1 text-left hover:bg-neutral-800 text-xs ${ttsVoice === voice.id ? 'text-purple-400' : ''}`}
                                                    >
                                                        {voice.name.split(' - ')[1] || voice.name}
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <button className="flex items-center gap-2 hover:text-white transition-colors">
                        <WifiIcon className="w-4 h-4" />
                        Dispositivos
                    </button>

                    <button className="flex items-center gap-2 hover:text-white transition-colors">
                        <ArrowsPointingOutIcon className="w-4 h-4" />
                        Foco
                    </button>
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-between gap-6">
                    <button
                        onClick={() => window.history.back()}
                        className="text-neutral-400 hover:text-white transition-colors"
                    >
                        <RewindIcon className="w-6 h-6" />
                    </button>

                    <button className="text-neutral-400 hover:text-white transition-colors">
                        <Rewind15Icon className="w-8 h-8" />
                    </button>

                    <div className="flex items-center gap-4">
                        {/* Book Cover */}
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md shadow-lg flex items-center justify-center">
                            <BookOpenIcon className="w-8 h-8 text-white" />
                        </div>

                        {/* Play/Pause/Stop Buttons */}
                        {isBookLoaded && ttsBackendHealthy ? (
                            <div className="flex gap-2">
                                {isTTSPlaying ? (
                                    <button
                                        onClick={onTTSPause}
                                        className="w-16 h-16 bg-white/90 text-black rounded-full flex items-center justify-center hover:bg-white transition-colors"
                                    >
                                        <PauseIcon className="w-8 h-8" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={onTTSPlay}
                                        className="w-16 h-16 bg-white/90 text-black rounded-full flex items-center justify-center hover:bg-white transition-colors"
                                    >
                                        <PlayIcon className="w-8 h-8" />
                                    </button>
                                )}
                                <button
                                    onClick={onTTSStop}
                                    className="w-12 h-12 bg-neutral-700 text-white rounded-full flex items-center justify-center hover:bg-neutral-600 transition-colors"
                                >
                                    <StopIcon className="w-6 h-6" />
                                </button>
                            </div>
                        ) : (
                            <button
                                disabled
                                className="w-16 h-16 bg-neutral-700 text-neutral-500 rounded-full flex items-center justify-center cursor-not-allowed"
                            >
                                <PlayIcon className="w-8 h-8" />
                            </button>
                        )}
                    </div>

                    <button className="text-neutral-400 hover:text-white transition-colors">
                        <Forward15Icon className="w-8 h-8" />
                    </button>

                    <button
                        onClick={() => window.history.forward()}
                        className="text-neutral-400 hover:text-white transition-colors"
                    >
                        <ForwardIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 px-2">
                    <p className="text-center text-sm font-medium text-neutral-100 mb-2">
                        {isBookLoaded ? `Página ${currentPage} de ${totalPages}` : 'Nenhum livro carregado'}
                    </p>
                    <div className="relative w-full h-1.5 bg-neutral-600/50 rounded-full">
                        <div
                            className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full"></div>
                        </div>
                    </div>
                    <div className="flex justify-between text-xs text-neutral-400 mt-1">
                        <span>Página {currentPage}</span>
                        <span>Página {totalPages}</span>
                    </div>
                    {!ttsBackendHealthy && isBookLoaded && (
                        <p className="text-center text-xs text-yellow-500 mt-2">
                            ⚠️ Serviço de TTS offline - Inicie o backend
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;