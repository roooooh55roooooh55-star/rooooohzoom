
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Video, UserInteractions } from './types.ts';

export const LOGO_URL = "https://i.top4top.io/p_3643ksmii1.jpg";

export const getDeterministicStats = (seed: string) => {
  let hash = 0;
  if (!seed) return { views: 0, likes: 0 };
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const baseViews = Math.abs(hash % 900000) + 500000; 
  const views = baseViews * (Math.abs(hash % 5) + 2); 
  const likes = Math.abs(Math.floor(views * (0.12 + (Math.abs(hash % 15) / 100)))); 
  return { views, likes };
};

export const formatBigNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const VideoCardThumbnail: React.FC<{ 
  video: Video, 
  isOverlayActive: boolean, 
  interactions: UserInteractions,
  progress?: number, 
  showNewBadge?: boolean 
}> = ({ video, isOverlayActive, interactions, progress, showNewBadge }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const stats = useMemo(() => getDeterministicStats(video.video_url), [video.video_url]);
  
  const isLiked = interactions.likedIds.includes(video.id);
  const isSaved = interactions.savedIds.includes(video.id);
  const isHeartActive = isLiked || isSaved;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isOverlayActive) {
      v.pause();
      if (observerRef.current) observerRef.current.disconnect();
      return;
    }
    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) v.play().catch(() => {}); else v.pause();
    }, { threshold: 0.1 });
    observerRef.current.observe(v);
    return () => observerRef.current?.disconnect();
  }, [video.video_url, isOverlayActive]);

  return (
    <div className="w-full h-full relative bg-neutral-950 overflow-hidden group rounded-2xl shadow-2xl border border-white/5 pointer-events-none transition-all duration-500 hover:border-red-600/30">
      <video 
        ref={videoRef}
        src={video.video_url} 
        poster={video.poster_url}
        muted loop playsInline 
        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-700"
      />
      
      {/* الجزء العلوي: القسم والقلب */}
      <div className="absolute top-2 right-2 left-2 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1">
          <div className={`p-1 rounded-lg backdrop-blur-md border transition-all duration-500 ${isHeartActive ? 'bg-red-600/30 border-red-500 shadow-[0_0_10px_red]' : 'bg-black/40 border-white/10'}`}>
            <svg className={`w-2.5 h-2.5 ${isHeartActive ? 'text-red-500' : 'text-gray-400'}`} fill={isHeartActive ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <div className="backdrop-blur-md bg-black/50 border border-white/10 px-2 py-0.5 rounded-lg shadow-sm">
            <span className="text-[6px] font-black text-white italic tracking-tighter uppercase">
              {video.category}
            </span>
          </div>
        </div>

        {showNewBadge && (
          <div className="backdrop-blur-xl bg-blue-600/30 border border-blue-500 px-2 py-0.5 rounded-lg shadow-[0_0_10px_#3b82f6] animate-pulse">
            <span className="text-[7px] font-black text-blue-400 italic tracking-widest uppercase">جديد</span>
          </div>
        )}
      </div>

      {/* الجزء السفلي: العنوان والإحصائيات */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 z-20">
        <div className="flex flex-col gap-1">
          <p className="text-white text-[8px] font-black line-clamp-1 italic text-right drop-shadow-lg leading-tight">
            {video.title}
          </p>
          <div className="flex items-center justify-end gap-2 mt-0.5">
             <div className="flex items-center gap-0.5">
                <svg className="w-2 h-2 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                <span className="text-[6px] font-black text-white/80">{formatBigNumber(stats.likes)}</span>
             </div>
             <div className="flex items-center gap-0.5 border-r border-white/10 pr-1.5">
                <svg className="w-2 h-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                <span className="text-[6px] font-black text-white/80">{formatBigNumber(stats.views)}</span>
             </div>
          </div>
        </div>
      </div>

      {progress !== undefined && progress > 0 && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/10 z-30">
          <div className="h-full bg-red-600 shadow-[0_0_5px_red] transition-all duration-500" style={{ width: `${progress * 100}%` }}></div>
        </div>
      )}
    </div>
  );
};

const AutoMarqueeShorts: React.FC<{ 
  shorts: Video[], 
  interactions: UserInteractions,
  onPlay: (v: Video) => void, 
  isOverlayActive: boolean 
}> = ({ shorts, interactions, onPlay, isOverlayActive }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const tripledShorts = useMemo(() => [...shorts, ...shorts, ...shorts], [shorts]);

  useEffect(() => {
    if (!scrollRef.current || isInteracting || isOverlayActive) return;
    const scroll = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft -= 0.8; 
        if (Math.abs(scrollRef.current.scrollLeft) >= (scrollRef.current.scrollWidth / 3) * 2) {
          scrollRef.current.scrollLeft = - (scrollRef.current.scrollWidth / 3);
        }
      }
    };
    const timer = setInterval(scroll, 30);
    return () => clearInterval(timer);
  }, [isInteracting, isOverlayActive]);

  return (
    <div 
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-hide px-2 py-1 cursor-grab active:cursor-grabbing"
      onMouseDown={() => setIsInteracting(true)}
      onMouseUp={() => setIsInteracting(false)}
      onMouseLeave={() => setIsInteracting(false)}
      style={{ direction: 'ltr' }} 
    >
      {tripledShorts.map((v, i) => (
        <div key={`${v.id}-${i}`} onClick={() => onPlay(v)} className="w-28 aspect-[9/16] shrink-0 active:scale-95 transition-transform">
          <VideoCardThumbnail video={v} interactions={interactions} isOverlayActive={isOverlayActive} />
        </div>
      ))}
    </div>
  );
};

interface MainContentProps {
  videos: Video[];
  categoriesList: string[];
  interactions: UserInteractions;
  onPlayShort: (v: Video, list: Video[]) => void;
  onPlayLong: (v: Video, list: Video[]) => void;
  onHardRefresh: () => void;
  loading: boolean;
  isTitleYellow: boolean;
  onSearchToggle?: () => void;
  isOverlayActive: boolean;
}

const MainContent: React.FC<MainContentProps> = ({ 
  videos, categoriesList, interactions, onPlayShort, onPlayLong, onHardRefresh, loading, isTitleYellow, onSearchToggle, isOverlayActive
}) => {
  const [startY, setStartY] = useState(0);
  const [pullOffset, setPullOffset] = useState(0);

  const filteredVideos = useMemo(() => {
    const excludedIds = interactions.dislikedIds;
    return videos.filter(v => !excludedIds.includes(v.id || v.video_url));
  }, [videos, interactions.dislikedIds]);

  const shorts = useMemo(() => filteredVideos.filter(v => v.type === 'short'), [filteredVideos]);
  const longs = useMemo(() => filteredVideos.filter(v => v.type === 'long'), [filteredVideos]);

  const topShorts = useMemo(() => shorts.slice(0, 4), [shorts]);
  const featuredLongs = useMemo(() => longs.slice(0, 4), [longs]);

  const unwatchedData = useMemo(() => {
    const uniqueMap = new Map();
    [...interactions.watchHistory].reverse().forEach(h => {
      if (h.progress > 0.05 && h.progress < 0.95) {
        const video = videos.find(v => (v.id === h.id || v.video_url === h.id));
        if (video && !uniqueMap.has(video.id)) {
          uniqueMap.set(video.id, { video, progress: h.progress });
        }
      }
    });
    return Array.from(uniqueMap.values()).slice(0, 5);
  }, [interactions.watchHistory, videos]);

  return (
    <div 
      onTouchStart={(e) => window.scrollY === 0 && setStartY(e.touches[0].pageY)}
      onTouchMove={(e) => startY !== 0 && (e.touches[0].pageY - startY) > 0 && (e.touches[0].pageY - startY) < 120 && setPullOffset(e.touches[0].pageY - startY)}
      onTouchEnd={() => { pullOffset > 70 && onHardRefresh(); setPullOffset(0); setStartY(0); }}
      className="flex flex-col pb-40 pt-0 px-4 w-full bg-black min-h-screen relative transition-transform duration-200"
      style={{ transform: `translateY(${pullOffset / 2}px)` }}
      dir="rtl"
    >
      <section className="flex items-center justify-between py-2 border-b border-white/5 bg-black sticky top-0 z-40">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onHardRefresh}>
          <img src={LOGO_URL} className="w-8 h-8 rounded-full border border-red-600 shadow-[0_0_10px_red]" alt="Logo" />
          <div className="flex flex-col text-right">
            <h1 className={`text-base font-black italic transition-all duration-500 ${isTitleYellow ? 'text-yellow-400 drop-shadow-[0_0_15px_#facc15]' : 'text-red-600 drop-shadow-[0_0_8px_red]'}`}>
              الحديقة المرعبة
            </h1>
            <p className="text-[5px] text-blue-500 font-black tracking-widest uppercase -mt-0.5 opacity-60">AI DISCOVERY LIVE</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
           <button onClick={() => window.open('https://snaptubeapp.com', '_blank')} className="w-9 h-9 rounded-xl border border-yellow-600/30 flex items-center justify-center text-yellow-600 active:scale-90 transition-all bg-yellow-600/5">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M15.5,13.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5 s1.5,0.67,1.5,1.5S16.33,13.5,15.5,13.5z M8.5,13.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S9.33,13.5,8.5,13.5z M12,18c-2.33,0-4.39-1.39-5.33-3.41c-0.12-0.27,0.01-0.59,0.28-0.71c0.27-0.12,0.59,0.01,0.71,0.28C8.42,15.89,10.1,17,12,17 s3.58-1.11,4.34-2.84c0.12-0.27,0.44-0.4,0.71-0.28c0.27,0.12,0.4,0.44,0.28,0.71C16.39,16.61,14.33,18,12,18z"/><path d="M12,15c-1.1,0-2-0.9-2-2s0.9-2,2-2s2,0.9,2,2S13.1,15,12,15z" opacity=".3"/></svg>
           </button>
           <button onClick={onSearchToggle} className="w-9 h-9 rounded-xl bg-blue-500/5 border border-blue-500/30 flex items-center justify-center text-blue-500 active:scale-90 transition-all">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
           </button>
        </div>
      </section>

      {/* رعشة البداية */}
      <section className="mt-4">
        <div className="flex items-center gap-2 mb-3 px-2">
          <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_red]"></span>
          <h2 className="text-[10px] font-black text-red-600 uppercase tracking-widest italic">رعشة البداية</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {topShorts.map((v, i) => (
            <div key={v.id} onClick={() => onPlayShort(v, shorts)} className="aspect-[9/16] cursor-pointer active:scale-95 transition-transform">
              <VideoCardThumbnail video={v} interactions={interactions} isOverlayActive={isOverlayActive} showNewBadge={i < 2} />
            </div>
          ))}
        </div>
      </section>

      {unwatchedData.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping"></span>
            <h2 className="text-[10px] font-black text-yellow-500 uppercase tracking-widest italic">نواصل الحكاية</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide px-2">
            {unwatchedData.map(({ video, progress }) => (
              <div key={video.id} onClick={() => video.type === 'short' ? onPlayShort(video, shorts) : onPlayLong(video, longs)} className="w-40 aspect-video shrink-0 cursor-pointer active:scale-95 transition-transform">
                <VideoCardThumbnail video={video} interactions={interactions} isOverlayActive={isOverlayActive} progress={progress} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* كوابيس مختارة */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-3 px-2">
          <span className="w-1.5 h-1.5 bg-purple-600 rounded-full shadow-[0_0_8px_purple]"></span>
          <h2 className="text-[10px] font-black text-purple-600 uppercase tracking-widest italic">كوابيس مختارة</h2>
        </div>
        <div className="flex flex-col gap-4">
          {featuredLongs.map((video, idx) => (
            <div key={video.id} onClick={() => onPlayLong(video, longs)} className="aspect-video cursor-pointer active:scale-95 transition-transform">
              <VideoCardThumbnail video={video} interactions={interactions} isOverlayActive={isOverlayActive} showNewBadge={idx === 0} />
            </div>
          ))}
        </div>
      </section>

      {/* شورتس سريعة */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-3 px-2">
          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_10px_cyan] animate-pulse"></span>
          <h2 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest italic">شورتس سريعة</h2>
        </div>
        <AutoMarqueeShorts shorts={shorts.slice(4, 20)} interactions={interactions} onPlay={(v) => onPlayShort(v, shorts)} isOverlayActive={isOverlayActive} />
      </section>

      {/* أقسام الفئات */}
      {categoriesList.map((cat) => {
        const catName = cat.split(' ')[0];
        const catVideos = longs.filter(v => v.category.includes(catName));
        if (catVideos.length === 0) return null;
        return (
          <section key={cat} className="mt-10">
            <div className="flex items-center gap-2 mb-4 px-2 border-r-2 border-red-600">
              <h2 className="text-[10px] font-black text-white/90 uppercase">{cat}</h2>
            </div>
            <div className="flex flex-col gap-5">
              {catVideos.slice(0, 3).map(v => (
                <div key={v.id} onClick={() => onPlayLong(v, longs)} className="aspect-video cursor-pointer active:scale-95 transition-transform">
                  <VideoCardThumbnail video={v} interactions={interactions} isOverlayActive={isOverlayActive} />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {loading && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50">
           <span className="text-yellow-500 font-black text-[10px] animate-pulse bg-black/80 px-4 py-1 rounded-full border border-yellow-500/30 backdrop-blur-md">جاري تحديث المستودع...</span>
        </div>
      )}
    </div>
  );
};

export default MainContent;
