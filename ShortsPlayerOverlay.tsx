
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Video, UserInteractions } from './types';
import { getDeterministicStats, formatBigNumber, LOGO_URL } from './MainContent';

interface ShortsPlayerOverlayProps {
  initialVideo: Video;
  videoList: Video[];
  interactions: UserInteractions;
  onClose: () => void;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  onSave: (id: string) => void;
  onProgress: (id: string, progress: number) => void;
}

const ShortsPlayerOverlay: React.FC<ShortsPlayerOverlayProps> = ({ 
  initialVideo, videoList, interactions, onClose, onLike, onDislike, onSave, onProgress
}) => {
  // تفعيل العشوائية: خلط القائمة المتاحة مع وضع الفيديو المختار في البداية
  const randomizedList = useMemo(() => {
    const otherVideos = videoList.filter(v => v.id !== initialVideo.id);
    const shuffled = [...otherVideos].sort(() => Math.random() - 0.5);
    return [initialVideo, ...shuffled];
  }, [initialVideo.id, videoList]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const [isBuffering, setIsBuffering] = useState(true);
  const [showStatusIcon, setShowStatusIcon] = useState<'play' | 'pause' | null>(null);

  useEffect(() => {
    const vid = videoRefs.current[currentIndex];
    if (vid) {
      setIsBuffering(true);
      vid.play().catch(() => { vid.muted = true; vid.play().catch(() => {}); });
    }
    Object.keys(videoRefs.current).forEach((key) => {
      const idx = parseInt(key);
      if (idx !== currentIndex) videoRefs.current[idx]?.pause();
    });
  }, [currentIndex]);

  const togglePlay = (idx: number) => {
    const vid = videoRefs.current[idx];
    if (!vid) return;
    if (vid.paused) vid.play().catch(() => {}); else vid.pause();
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const height = e.currentTarget.clientHeight;
    if (height === 0) return;
    const index = Math.round(e.currentTarget.scrollTop / height);
    if (index !== currentIndex && index >= 0 && index < randomizedList.length) setCurrentIndex(index);
  };

  // نظام الدوران الذكي: العودة للأول بسلاسة تامة
  const playNextSmartly = useCallback(() => {
    const nextIdx = (currentIndex + 1) % randomizedList.length;
    if (containerRef.current) {
      // إذا وصلنا للأخير، نعود للأول دون تأثير سحب طويل
      if (nextIdx === 0) {
        containerRef.current.scrollTo({ top: 0, behavior: 'auto' });
        setCurrentIndex(0);
      } else {
        containerRef.current.scrollTo({ top: nextIdx * containerRef.current.clientHeight, behavior: 'smooth' });
      }
    }
  }, [currentIndex, randomizedList.length]);

  return (
    <div className="fixed inset-0 bg-black z-[500] flex flex-col overflow-hidden">
      <div className="absolute top-12 right-6 z-[600]">
        <button onClick={onClose} className="p-4 rounded-[1.5rem] bg-black/50 backdrop-blur-2xl text-red-600 border-2 border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-75 transition-all">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div ref={containerRef} onScroll={handleScroll} className="flex-grow overflow-y-scroll snap-y snap-mandatory scrollbar-hide h-full w-full">
        {randomizedList.map((video, idx) => {
          const stats = getDeterministicStats(video.video_url);
          const isLiked = interactions.likedIds.includes(video.id);
          const isSaved = interactions.savedIds.includes(video.id);
          const isActive = idx === currentIndex;

          return (
            <div key={`${video.id}-${idx}`} className="h-full w-full snap-start relative bg-black cursor-pointer" onClick={() => togglePlay(idx)}>
              <video 
                  ref={el => { videoRefs.current[idx] = el; }}
                  src={video.video_url} 
                  className={`h-full w-full object-cover transition-opacity duration-500 ${isActive && isBuffering ? 'opacity-40' : 'opacity-100'}`}
                  playsInline
                  onWaiting={() => isActive && setIsBuffering(true)}
                  onPlaying={() => { if (isActive) { setIsBuffering(false); setShowStatusIcon('play'); setTimeout(() => setShowStatusIcon(null), 600); } }}
                  onPause={() => { if (isActive) { setShowStatusIcon('pause'); setTimeout(() => setShowStatusIcon(null), 600); } }}
                  onEnded={() => playNextSmartly()}
                  onTimeUpdate={(e) => isActive && onProgress(video.id, e.currentTarget.currentTime / e.currentTarget.duration)}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/95 pointer-events-none z-20" />
              
              {/* شريط الأدوات الجانبي - الترتيب المطلوب: لايك، ديسلايك، حفظ */}
              <div className="absolute bottom-28 left-6 flex flex-col items-center gap-7 z-40">
                {/* زر لايك */}
                <button onClick={(e) => { e.stopPropagation(); onLike(video.id); }} className="flex flex-col items-center">
                  <div className={`p-4 rounded-full border-2 transition-all duration-300 ${isLiked ? 'bg-red-600 border-red-400 text-white shadow-[0_0_30px_red]' : 'bg-black/50 border-white/20 text-white backdrop-blur-2xl'}`}>
                    <svg className="w-7 h-7" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
                  </div>
                  <span className="text-[10px] font-black text-white mt-1 drop-shadow-md">{formatBigNumber(stats.likes)}</span>
                </button>

                {/* زر ديسلايك (استبعاد) */}
                <button onClick={(e) => { e.stopPropagation(); onDislike(video.id); }} className="flex flex-col items-center">
                  <div className="p-4 rounded-full border-2 bg-black/50 border-white/20 text-white backdrop-blur-2xl active:bg-red-900 transition-all">
                    <svg className="w-7 h-7 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
                  </div>
                  <span className="text-[10px] font-black text-white mt-1">استبعاد</span>
                </button>

                {/* زر حفظ */}
                <button onClick={(e) => { e.stopPropagation(); onSave(video.id); }} className="flex flex-col items-center">
                   <div className={`p-4 rounded-full border-2 transition-all duration-300 ${isSaved ? 'bg-yellow-500 border-yellow-300 text-white shadow-[0_0_30px_yellow]' : 'bg-black/50 border-white/20 text-white backdrop-blur-2xl'}`}>
                     <svg className="w-7 h-7" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                   </div>
                   <span className="text-[10px] font-black text-white mt-1">حفظ</span>
                </button>
              </div>

              <div className="absolute bottom-28 right-6 left-28 z-40 text-right">
                <div className="flex flex-col items-end gap-4">
                  <div className="backdrop-blur-2xl bg-black/60 border-2 border-red-600 px-5 py-1.5 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                    <span className="text-[11px] font-black text-white italic uppercase tracking-widest uppercase">{video.category}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <h3 className="text-white text-xl font-black drop-shadow-[0_2px_15px_black] leading-tight line-clamp-2">{video.title}</h3>
                      <p className="text-red-600 text-[11px] font-black italic tracking-tighter opacity-90 mt-1">@AL_HADIQA_OFFICIAL</p>
                    </div>
                    <img src={LOGO_URL} className="w-14 h-14 rounded-full border-2 border-red-600 relative z-10 shadow-2xl" alt="Channel Logo" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShortsPlayerOverlay;
