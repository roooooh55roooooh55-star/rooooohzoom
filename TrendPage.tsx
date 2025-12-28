
import React, { useEffect, useState, useMemo } from 'react';
import { Video } from '../types';
import { fetchTelegramVideos } from '../telegramClient';
import { getDeterministicStats, formatBigNumber } from './MainContent';

const LOGO_URL = "https://i.top4top.io/p_3643ksmii1.jpg";

interface TrendPageProps {
  onPlayShort: (v: Video, list: Video[]) => void;
  onPlayLong: (v: Video) => void;
  excludedIds: string[];
}

const TrendPage: React.FC<TrendPageProps> = ({ onPlayShort, onPlayLong, excludedIds }) => {
  const [rawTrends, setRawTrends] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTelegramVideos().then(data => { setRawTrends(data); setLoading(false); });
  }, []);

  const trendVideos = useMemo(() => {
    const featured = rawTrends.filter(v => v.isFeatured && !excludedIds.includes(v.id));
    const recent = [...rawTrends]
      .filter(v => !excludedIds.includes(v.id))
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 10);

    const combined = [...featured];
    recent.forEach(rv => {
      if (!combined.find(cv => cv.id === rv.id)) combined.push(rv);
    });

    return combined.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return (b.views || 0) - (a.views || 0);
    });
  }, [rawTrends, excludedIds]);

  if (loading) return <div className="p-20 text-center"><span className="text-red-600 font-black animate-pulse uppercase tracking-[0.2em]">تحليل بيانات القبو...</span></div>;

  return (
    <div className="flex flex-col gap-8 pb-32 animate-in fade-in duration-700">
      <div className="flex items-center justify-between border-b-2 border-red-600/30 pb-4 px-2">
         <div className="flex items-center gap-4">
            <img src={LOGO_URL} className="w-14 h-14 rounded-full border-2 border-red-600 shadow-[0_0_15px_red]" />
            <div className="flex flex-col text-right">
               <h1 className="text-2xl font-black text-red-600 italic">رائج الحديقة</h1>
               <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">The Horror Vault - Public Access</p>
            </div>
         </div>
      </div>

      <div className="flex flex-col gap-10 px-2">
        {trendVideos.map((video, idx) => (
          <div key={video.id} onClick={() => video.type === 'short' ? onPlayShort(video, trendVideos.filter(v=>v.type==='short')) : onPlayLong(video)} className="group relative bg-neutral-900/40 rounded-[3rem] border-2 border-red-600 overflow-hidden cursor-pointer shadow-xl transition-transform hover:scale-[1.01]">
            <div className="aspect-video relative overflow-hidden">
              <video src={video.video_url} muted autoPlay loop playsInline className="w-full h-full object-cover opacity-70 group-hover:scale-110 transition-all duration-700" />
              <div className="absolute top-6 right-6 z-20 w-12 h-12 flex items-center justify-center rounded-2xl font-black bg-red-600 text-white shadow-lg animate-bounce">{idx + 1}</div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none opacity-80" />
            </div>
            <div className="p-8">
              <h3 className="font-black text-xl text-white italic text-right line-clamp-2 leading-relaxed">{video.title}</h3>
              <div className="flex items-center justify-between mt-4">
                 <span className="text-red-500 text-[10px] font-black italic bg-red-600/10 px-3 py-1 rounded-lg border border-red-600/20 uppercase tracking-tighter">{video.category}</span>
                 <span className="text-gray-500 text-[10px] font-bold">{formatBigNumber(getDeterministicStats(video.video_url).views)} مشاهدة</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendPage;
