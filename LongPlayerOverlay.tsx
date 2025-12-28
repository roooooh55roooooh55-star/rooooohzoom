
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Video, UserInteractions } from './types.ts';
import { incrementViewsInDB } from './supabaseClient.ts';
import { getDeterministicStats, formatBigNumber, LOGO_URL } from './MainContent.tsx';
import { speakText } from './ttsService';

interface LongPlayerOverlayProps {
  video: Video;
  allLongVideos: Video[];
  interactions: UserInteractions;
  onClose: () => void;
  onLike: () => void;
  onDislike: () => void;
  onSave: () => void;
  onSwitchVideo: (v: Video) => void;
  onCategoryClick: (cat: string) => void;
  onDownload: () => void;
  isLiked: boolean;
  isDisliked: boolean;
  isSaved: boolean;
  isDownloaded: boolean;
  isGlobalDownloading: boolean;
  onProgress: (p: number) => void;
  onToggleAudio: (type: 'title' | 'narration') => void;
}

const LongPlayerOverlay: React.FC<LongPlayerOverlayProps> = ({ 
  video, allLongVideos, interactions, onClose, onLike, onDislike, onSave, onSwitchVideo, onCategoryClick, onDownload, isLiked, isDisliked, isSaved, isDownloaded, isGlobalDownloading, onProgress, onToggleAudio
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!video) return;
    const v = videoRef.current;
    if (!v) return;
    incrementViewsInDB(video.id);
    v.load();
    v.play().then(() => {
      setIsPlaying(true);
      const runAudio = async () => {
        // نستخدم إعدادات المطور للفيديو
        const settings = video.audioSettings || { titleEnabled: true, narrationEnabled: true };
        if (settings.titleEnabled) await speakText(video.title);
        if (settings.narrationEnabled && video.narration) await speakText(video.narration);
      };
      runAudio();
    }).catch(() => setIsPlaying(false));
  }, [video?.id]);

  return (
    <div className="fixed inset-0 bg-black z-[500] flex flex-col overflow-hidden" dir="rtl">
      <div className="relative h-[35dvh] bg-black border-b-2 border-white/10 flex items-center justify-center overflow-hidden">
        <video 
          ref={videoRef} 
          src={video.video_url} 
          className="h-full w-full object-contain contrast-110 saturate-125" 
          playsInline 
          onTimeUpdate={(e) => onProgress(e.currentTarget.currentTime / e.currentTarget.duration)}
          onClick={() => isPlaying ? videoRef.current?.pause() : videoRef.current?.play()}
        />
        <div className="absolute top-5 left-5 flex gap-4 z-50">
          <button onClick={onClose} className="p-3 bg-black/60 rounded-2xl border-2 border-red-600 text-red-600 shadow-[0_0_15px_red]">✕</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#020202] p-4 space-y-6 scrollbar-hide">
          <div className="flex items-center gap-5 bg-white/5 p-4 rounded-[2.5rem] border-2 border-white/10">
             <img src={LOGO_URL} className="w-14 h-14 rounded-full border-2 border-red-600 shadow-[0_0_20px_red]" />
             <div className="flex flex-col text-right flex-1 overflow-hidden">
                <h1 className="text-xl font-black text-white italic line-clamp-2">{video.title}</h1>
                <div className="flex items-center gap-3.5 mt-2">
                   <button onClick={() => onCategoryClick(video.category)} className="bg-red-600 border-2 border-red-400 px-4 py-0.5 rounded-full text-[10px] font-black text-white italic">{video.category}</button>
                   <span className="text-[10px] font-bold text-gray-500">{formatBigNumber(video.views)} مشاهدة</span>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-4 items-center bg-neutral-900/70 p-2.5 rounded-[2.5rem] border-2 border-white/15 gap-2">
             <button onClick={() => onLike()} className={`flex flex-col items-center py-3.5 rounded-2xl border-2 ${isLiked ? 'bg-red-600 border-red-400 text-white' : 'border-white/15 bg-white/5 text-gray-400'}`}>♥</button>
             <button onClick={() => onDownload()} className={`flex flex-col items-center py-3.5 rounded-2xl border-2 ${isDownloaded ? 'bg-cyan-600' : 'border-white/15 bg-white/5'}`}>⇩</button>
             <button onClick={() => isPlaying ? videoRef.current?.pause() : videoRef.current?.play()} className="flex flex-col items-center py-3.5 rounded-2xl border-2 border-red-600 bg-red-600/10 text-red-500">{isPlaying ? '||' : '▶'}</button>
             <button onClick={() => onSave()} className={`flex flex-col items-center py-3.5 rounded-2xl border-2 ${isSaved ? 'bg-yellow-500' : 'border-white/15 bg-white/5'}`}>★</button>
          </div>
      </div>
    </div>
  );
};

export default LongPlayerOverlay;
