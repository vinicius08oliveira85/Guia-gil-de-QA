import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, ExternalLink } from 'lucide-react';

interface AudioViewerProps {
    /** URL do áudio */
    url: string;
    /** Nome do arquivo */
    filename: string;
    /** MIME type do áudio */
    mimeType?: string;
    /** Callback para download */
    onDownload?: () => void;
    /** Callback para abrir externo */
    onOpenExternal?: () => void;
    /** Classe CSS adicional */
    className?: string;
}

/**
 * Componente para visualização/reprodução de áudio
 * Player de áudio básico com controles
 */
export const AudioViewer: React.FC<AudioViewerProps> = ({
    url,
    filename,
    mimeType,
    onDownload,
    onOpenExternal,
    className = '',
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
            setVolume(newVolume);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`audio-viewer flex flex-col gap-4 p-6 bg-base-100 rounded-lg ${className}`}>
            <div className="flex items-center gap-4">
                <button
                    onClick={togglePlay}
                    className="btn btn-circle btn-lg btn-primary"
                    title={isPlaying ? 'Pausar' : 'Reproduzir'}
                >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>

                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className="range range-primary flex-1"
                        />
                    </div>
                    <div className="flex justify-between text-xs text-base-content/60">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleMute}
                        className="btn btn-circle btn-sm btn-ghost"
                        title={isMuted ? 'Ativar som' : 'Silenciar'}
                    >
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="range range-xs w-24"
                    />
                </div>

                {onDownload && (
                    <button
                        onClick={onDownload}
                        className="btn btn-circle btn-sm btn-ghost"
                        title="Download"
                    >
                        <Download size={16} />
                    </button>
                )}

                {onOpenExternal && (
                    <button
                        onClick={onOpenExternal}
                        className="btn btn-circle btn-sm btn-ghost"
                        title="Abrir em nova aba"
                    >
                        <ExternalLink size={16} />
                    </button>
                )}
            </div>

            <div className="text-center">
                <p className="text-sm font-medium text-base-content">{filename}</p>
                {mimeType && (
                    <p className="text-xs text-base-content/60 mt-1">{mimeType}</p>
                )}
            </div>

            <audio
                ref={audioRef}
                src={url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
            />
        </div>
    );
};

