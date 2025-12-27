
import React, { useMemo, useState, useRef, useEffect } from 'react';
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
  isFeatured?: boolean,
  onCategoryClick?: (cat: string) => void
}> = ({ video, isOverlayActive, interactions, progress, isFeatured, onCategoryClick }) => {
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
    <div className={`w-full h-full relative bg-neutral-950 overflow-hidden group rounded-2xl shadow-2xl border transition-all duration-500 ${isFeatured ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.2)]' : 'border-white/5 hover:border-red-600/30'}`}>
      <video 
        ref={videoRef}
        src={video.video_url} 
        poster={video.poster_url}
        muted loop playsInline 
        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-700 pointer-events-none"
      />
      
      <div className="absolute top-2 right-2 left-2 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1">
          <div className={`p-1 rounded-lg backdrop-blur-md border ${isHeartActive ? 'bg-red-600/30 border-red-500 shadow-[0_0_8px_red]' : 'bg-black/40 border-white/10'}`}>
            <svg className={`w-2 h-2 ${isHeartActive ? 'text-red-500' : 'text-gray-400'}`} fill={isHeartActive ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <div className={`${isFeatured ? 'bg-yellow-500/80 border-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'bg-red-600/80 border-red-400 shadow-[0_0_5px_rgba(220,38,38,0.5)]'} backdrop-blur-md border px-2 py-0.5 rounded-lg`}>
            <span className="text-[6px] font-black text-white italic tracking-tighter uppercase">
              {video.category}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 z-20 pointer-events-none">
        <div className="flex flex-col gap-1">
          <p className={`text-white text-[8px] font-black line-clamp-1 italic text-right leading-tight ${isFeatured ? 'text-yellow-400' : ''}`}>
            {video.title}
          </p>
          <div className="flex items-center justify-end gap-2 mt-0.5">
             <div className="flex items-center gap-0.5">
                <svg className={`w-2 h-2 ${isFeatured ? 'text-yellow-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
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
          <div className={`h-full ${isFeatured ? 'bg-yellow-500 shadow-[0_0_8px_yellow]' : 'bg-red-600 shadow-[0_0_8px_red]'} transition-all duration-500`} style={{ width: `${progress * 100}%` }}></div>
        </div>
      )}
    </div>
  );
};

interface MainContentProps {
  videos: Video[];
  categoriesList: string[];
  interactions: UserInteractions;
  onPlayShort: (v: Video, list: Video[]) => void;
  onPlayLong: (v: Video, list: Video[]) => void;
  onCategoryClick: (cat: string) => void;
  onHardRefresh: () => void;
  loading: boolean;
  isTitleYellow: boolean;
  isOverlayActive: boolean;
}

const MainContent: React.FC<MainContentProps> = ({ 
  videos, categoriesList, interactions, onPlayShort, onPlayLong, onCategoryClick, onHardRefresh, loading, isTitleYellow, isOverlayActive
}) => {
  const [startY, setStartY] = useState(0);
  const [pullOffset, setPullOffset] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // تحليل تفضيلات الأقسام بناءً على الإعجابات
  const featuredShorts = useMemo(() => {
    const scores: Record<string, number> = {};
    categoriesList.forEach(c => scores[c] = 0);
    
    // زيادة نقاط القسم لكل لايك
    interactions.likedIds.forEach(id => {
      const v = videos.find(vid => vid.id === id);
      if (v) scores[v.category] = (scores[v.category] || 0) + 1;
    });

    // ترتيب الأقسام حسب التفاعل
    const sortedCats = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    const picked: Video[] = [];
    const usedIds = new Set<string>();

    // محاولة سحب شورت واحد من أفضل 4 أقسام
    for (const cat of sortedCats) {
      if (picked.length >= 4) break;
      const catShorts = videos.filter(v => v.category === cat && v.type === 'short' && !usedIds.has(v.id));
      if (catShorts.length > 0) {
        picked.push(catShorts[0]);
        usedIds.add(catShorts[0].id);
      }
    }

    // إذا لم نجد 4 من أقسام مختلفة، نكمل بأي شورتس متبقية
    if (picked.length < 4) {
      const allShorts = videos.filter(v => v.type === 'short' && !usedIds.has(v.id));
      picked.push(...allShorts.slice(0, 4 - picked.length));
    }

    return picked;
  }, [videos, interactions.likedIds, categoriesList]);

  const isActuallyRefreshing = loading || isRefreshing || pullOffset > 30;
  
  const titleColor = useMemo(() => {
    if (isActuallyRefreshing) return 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,1)]';
    return 'text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,1)]';
  }, [isActuallyRefreshing]);

  const filteredVideos = useMemo(() => {
    const excludedIds = interactions.dislikedIds;
    const featuredIds = featuredShorts.map(f => f.id);
    return videos.filter(v => !excludedIds.includes(v.id || v.video_url) && !featuredIds.includes(v.id));
  }, [videos, interactions.dislikedIds, featuredShorts]);

  const shorts = useMemo(() => videos.filter(v => v.type === 'short'), [videos]);
  const longs = useMemo(() => videos.filter(v => v.type === 'long'), [videos]);

  return (
    <div 
      onTouchStart={(e) => window.scrollY === 0 && setStartY(e.touches[0].pageY)}
      onTouchMove={(e) => {
        if (startY === 0) return;
        const diff = e.touches[0].pageY - startY;
        if (diff > 0 && diff < 150) setPullOffset(diff);
      }}
      onTouchEnd={() => { 
        if (pullOffset > 80) {
          setIsRefreshing(true);
          onHardRefresh();
          setTimeout(() => setIsRefreshing(false), 2000);
        }
        setPullOffset(0); 
        setStartY(0); 
      }}
      className="flex flex-col pb-40 pt-0 w-full bg-black min-h-screen relative transition-transform duration-200"
      style={{ transform: `translateY(${pullOffset / 2}px)` }}
      dir="rtl"
    >
      {/* هيدر الصفحة الرئيسية */}
      <section className={`flex items-center justify-between py-2 bg-black sticky top-0 z-[110] px-4 transition-all duration-300 ${pullOffset > 10 ? 'border-b border-yellow-400 shadow-[0_4px_15px_rgba(250,204,21,0.5)]' : 'border-b border-white/5'}`}>
        <div className="flex items-center gap-3" onClick={onHardRefresh}>
          <img src={LOGO_URL} className={`w-8 h-8 rounded-full border-2 transition-colors duration-300 ${isActuallyRefreshing ? 'border-yellow-400 shadow-[0_0_8px_yellow]' : 'border-red-600 shadow-[0_0_5px_red]'}`} alt="Logo" />
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <h1 className={`text-base font-black italic transition-colors duration-300 ${titleColor}`}>
                الحديقة المرعبة
              </h1>
              <p className="text-[5px] text-gray-500 font-black tracking-widest uppercase -mt-0.5">THE ORIGINAL HORROR FEED</p>
            </div>
            
            {isActuallyRefreshing && (
              <div className="animate-pulse bg-black/80 border border-yellow-400 text-yellow-400 font-black text-[9px] px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.6)] flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping"></span>
                تحديث
              </div>
            )}
          </div>
        </div>
      </section>

      {/* شريط الأقسام الدائري */}
      <nav className="nav-container nav-mask relative h-12 bg-black/90 backdrop-blur-2xl z-[100] border-b border-white/10 sticky top-[44px] overflow-x-auto scrollbar-hide flex items-center">
        <div className="animate-marquee-train flex items-center gap-4 px-10">
          {[...categoriesList, ...categoriesList, ...categoriesList, ...categoriesList, ...categoriesList].map((cat, idx) => (
            <button 
              key={`${cat}-${idx}`}
              onClick={() => onCategoryClick(cat)}
              className="neon-white-led shrink-0 px-5 py-1 rounded-full text-[9px] font-black text-white italic transition-all whitespace-nowrap"
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      {/* قسم الفيديوهات الأربعة المميزة (Featured Shorts) - تم رفعه للأعلى وحذف العنوان */}
      <div className="px-3 mt-1.5 mb-4">
        <div className="grid grid-cols-2 gap-3">
          {featuredShorts.map((video) => (
            <div 
              key={`featured-${video.id}`} 
              onClick={() => onPlayShort(video, shorts)} 
              className="cursor-pointer active:scale-95 transition-transform aspect-[9/16]"
            >
              <VideoCardThumbnail 
                video={video} 
                interactions={interactions} 
                isOverlayActive={isOverlayActive} 
                isFeatured={true}
                onCategoryClick={onCategoryClick}
              />
            </div>
          ))}
        </div>
      </div>

      {/* القائمة الرئيسية لبقية الفيديوهات */}
      <div className="px-3 mt-2">
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="w-1 h-3 bg-red-600 rounded-full shadow-[0_0_8px_red]"></div>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">المستودع الرقمي</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {filteredVideos.map((video) => (
            <div 
              key={video.id} 
              onClick={() => video.type === 'short' ? onPlayShort(video, shorts) : onPlayLong(video, longs)} 
              className={`cursor-pointer active:scale-95 transition-transform ${video.type === 'short' ? 'aspect-[9/16]' : 'aspect-video'}`}
            >
              <VideoCardThumbnail 
                video={video} 
                interactions={interactions} 
                isOverlayActive={isOverlayActive} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainContent;
