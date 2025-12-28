
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Video, UserInteractions } from './types';
import { getDeterministicStats, formatBigNumber, LOGO_URL } from './MainContent';
import { speakText } from './ttsService';
import { getFreshTelegramUrl } from './telegramClient';

interface ShortsPlayerOverlayProps {
  initialVideo: Video;
  videoList: Video[];
  interactions: UserInteractions;
  onClose: () => void;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  onCategoryClick: (cat: string) => void;
  onSave: (id: string) => void;
  onProgress: (id: string, progress: number) => void;
  onDownload: (video: Video) => void;
  isGlobalDownloading: boolean;
  onToggleAudio: (type: 'title' | 'narration') => void;
}

const ShortsPlayerOverlay: React.FC<ShortsPlayerOverlayProps> = ({ 
  initialVideo, videoList, interactions, onClose, onLike, onDislike, onCategoryClick, onSave, onProgress, onDownload, isGlobalDownloading, onToggleAudio
}) => {
  const randomizedList = useMemo(() => {
    const otherVideos = videoList.filter(v => v.id !== initialVideo.id);
    return [initialVideo, ...otherVideos.sort(() => Math.random() - 0.5)];
  }, [initialVideo.id, videoList]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleNextVideo = useCallback(() => {
    if (currentIndex < randomizedList.length - 1) {
      setCurrentIndex(p => p + 1);
      containerRef.current?.scrollTo({ top: (currentIndex + 1) * containerRef.current.clientHeight, behavior: 'smooth' });
    }
  }, [currentIndex, randomizedList.length]);

  useEffect(() => {
    const video = randomizedList[currentIndex];
    setIsLoading(true);
    
    // جلب رابط فريش فوراً لمنع الشاشة السوداء
    getFreshTelegramUrl(video.public_id).then(freshUrl => {
      setVideoUrl(freshUrl || video.video_url);
      setIsLoading(false);
      
      const settings = video.audioSettings || { titleEnabled: true, narrationEnabled: true };
      const runAudio = async () => {
        if (settings.titleEnabled) await speakText(video.title);
        if (settings.narrationEnabled && video.narration) await speakText(video.narration);
      };
      runAudio();
    });
  }, [currentIndex, randomizedList]);

  return (
    <div className="fixed inset-0 bg-black z-[500] flex flex-col overflow-hidden">
      <div className="absolute top-12 right-6 z-[600]">
        <button onClick={onClose} className="p-4 rounded-2xl bg-black/50 text-red-600 border-2 border-red-600 shadow-[0_0_20px_red]">✕</button>
      </div>

      <div ref={containerRef} onScroll={(e) => {
        const h = e.currentTarget.clientHeight;
        const i = Math.round(e.currentTarget.scrollTop / h);
        if (i !== currentIndex) setCurrentIndex(i);
      }} className="flex-grow overflow-y-scroll snap-y snap-mandatory scrollbar-hide h-full w-full">
        {randomizedList.map((video, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div key={`${video.id}-${idx}`} className="h-full w-full snap-start relative bg-black flex overflow-hidden">
              {isActive && (
                <>
                  {isLoading && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black"><div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>}
                  <video 
                      ref={videoRef}
                      src={videoUrl} 
                      className="h-full w-full object-cover"
                      playsInline autoPlay loop={false} 
                      onEnded={() => handleNextVideo()} 
                      onTimeUpdate={(e) => onProgress(video.id, e.currentTarget.currentTime / e.currentTarget.duration)}
                  />
                  <div className="absolute bottom-24 right-4 text-right z-40">
                    <img src={LOGO_URL} className="w-12 h-12 rounded-full border-2 border-red-600 mb-2 inline-block" />
                    <h3 className="text-white text-lg font-black italic">@الحديقة المرعبة</h3>
                    <p className="text-white/80 text-[11px] font-bold italic">{video.title}</p>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShortsPlayerOverlay;
