import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Download, ExternalLink } from 'lucide-react';

interface VideoViewerProps {
    /** URL do vídeo */
    url: string;
    /** Nome do arquivo */
    filename: string;
    /** MIME type do vídeo */
    mimeType?: string;
    /** Callback para download */
    onDownload?: () => void;
    /** Callback para abrir externo */
    onOpenExternal?: () => void;
    /** Classe CSS adicional */
    className?: string;
}

/**
 * Componente para visualização de vídeos
 * Preparado para integração futura com recursos avançados
 */
export const VideoViewer: React.FC<VideoViewerProps> = ({
    url,
    filename,
    mimeType,
    onDownload,
    onOpenExternal,
    className = '',
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
            setVolume(newVolume);
        }
    };

    const handleFullscreen = () => {
        if (videoRef.current) {
            if (videoRef.current.requestFullscreen) {
                videoRef.current.requestFullscreen();
            }
        }
    };

    return (
        <div className={`video-viewer flex flex-col h-full ${className}`}>
            <div className="video-container relative bg-black rounded-lg overflow-hidden">
                <video
                    ref={videoRef}
                    src={url}
                    className="w-full h-full max-h-[70vh]"
                    controls={false}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                >
                    Seu navegador não suporta a tag de vídeo.
                </video>

                {/* Controles customizados */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={togglePlay}
                            className="btn btn-circle btn-sm btn-ghost text-white"
                            title={isPlaying ? 'Pausar' : 'Reproduzir'}
                        >
                            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </button>

                        <div className="flex items-center gap-2 flex-1">
                            <button
                                onClick={toggleMute}
                                className="btn btn-circle btn-sm btn-ghost text-white"
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

                        <button
                            onClick={handleFullscreen}
                            className="btn btn-circle btn-sm btn-ghost text-white"
                            title="Tela cheia"
                        >
                            <Maximize size={16} />
                        </button>

                        {onDownload && (
                            <button
                                onClick={onDownload}
                                className="btn btn-circle btn-sm btn-ghost text-white"
                                title="Download"
                            >
                                <Download size={16} />
                            </button>
                        )}

                        {onOpenExternal && (
                            <button
                                onClick={onOpenExternal}
                                className="btn btn-circle btn-sm btn-ghost text-white"
                                title="Abrir em nova aba"
                            >
                                <ExternalLink size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-2 text-sm text-base-content/70 text-center">
                {filename}
            </div>
        </div>
    );
};

