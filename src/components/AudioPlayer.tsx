import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface AudioPlayerProps {
    audioUrl?: string;
    seekTime?: number | null;
    compact?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, seekTime, compact = false }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current && seekTime != null) {
            audioRef.current.currentTime = seekTime;
            if (!isPlaying) {
                audioRef.current.play().catch(e => console.error("Playback error:", e));
                setIsPlaying(true);
            }
        }
    }, [seekTime]);

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Playback error:", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (audioRef.current) {
            const progressBar = e.currentTarget;
            const rect = progressBar.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const clickProgress = (x / rect.width);
            const newTime = clickProgress * audioRef.current.duration;

            audioRef.current.currentTime = newTime;
            setProgress(clickProgress * 100);
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const skip = (seconds: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime += seconds;
        }
    };

    return (
        <div className={`flex items-center gap-4 ${compact ? 'bg-transparent' : 'bg-white border border-slate-100 rounded-2xl p-4 shadow-sm'}`}>
            {audioUrl && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                />
            )}

            {compact ? (
                <div className="hidden sm:flex items-center gap-1.5 mr-1 ml-2 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    <div className={`w-1.5 h-1.5 rounded-full bg-red-500 ${isPlaying ? 'animate-pulse' : ''}`} />
                    <span className="text-[8px] font-black text-slate-500 tracking-widest uppercase">REC</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-700 rounded-xl shrink-0">
                    <div className={`w-1.5 h-1.5 rounded-full bg-red-500 ${isPlaying ? 'animate-pulse' : ''}`} />
                    <span className="text-[9px] font-extrabold tracking-widest uppercase">Recording</span>
                </div>
            )}

            <div className={`flex items-center ${compact ? 'gap-2' : 'gap-4'} text-slate-300`}>
                <button onClick={() => skip(-5)} className="hover:text-slate-500 transition-colors"><SkipBack size={compact ? 14 : 16} /></button>
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`${compact ? 'w-8 h-8' : 'w-11 h-11'} bg-black shadow-sm rounded-full flex items-center justify-center text-white hover:scale-105 transition-all hover:bg-slate-800`}
                >
                    {isPlaying ? <Pause size={compact ? 12 : 16} fill="currentColor" /> : <Play size={compact ? 12 : 16} className="ml-0.5" fill="currentColor" />}
                </button>
                <button onClick={() => skip(5)} className="hover:text-slate-500 transition-colors"><SkipForward size={compact ? 14 : 16} /></button>
            </div>

            <div className={`flex-1 flex items-center gap-3 ${compact ? 'min-w-[120px]' : ''}`}>
                <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{formatTime(currentTime)}</span>
                <div
                    className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden relative group cursor-pointer"
                    onClick={handleSeek}
                >
                    <div className="absolute left-0 top-0 h-full bg-black transition-all" style={{ width: `${progress}%` }} />
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{ left: `calc(${progress}% - 4px)` }}
                    />
                </div>
                {!compact && <span className="text-[10px] font-bold text-slate-400 w-8">{formatTime(duration)}</span>}
            </div>
        </div>
    );
};

export default AudioPlayer;
