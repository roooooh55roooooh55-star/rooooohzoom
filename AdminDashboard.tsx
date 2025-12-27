
import React, { useState, useEffect, useMemo } from 'react';
import { Video } from './types';
import { fetchCloudinaryVideos } from './cloudinaryClient';
import { suggestTags } from './geminiService';

const LOGO_URL = "https://i.top4top.io/p_3643ksmii1.jpg";

interface AdminDashboardProps {
  onClose: () => void;
  categories: string[];
  onNewVideo?: (v: Video) => void;
  onUpdateVideo?: (v: Video) => void;
  onDeleteVideo?: (id: string) => void;
  initialVideos: Video[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onClose, categories, onNewVideo, onUpdateVideo, onDeleteVideo, initialVideos 
}) => {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  // الأقسام الثمانية المعتمدة
  const [uploadCategory, setUploadCategory] = useState(categories[0] || 'هجمات مرعبة');

  const handleAuth = () => {
    if (passcode === '506070') {
      setIsAuthenticated(true);
    } else {
      alert("رمز الحماية خاطئ. الأرواح تراقبك.");
      setPasscode('');
    }
  };

  const filteredVideos = useMemo(() => {
    return videos.filter(v => 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [videos, searchQuery]);

  const openUploadWidget = () => {
    const cloudinary = (window as any).cloudinary;
    if (!cloudinary) return;
    setIsUploading(true);
    
    cloudinary.openUploadWidget({
      cloudName: 'dlrvn33p0',
      uploadPreset: 'Good.zooo',
      folder: 'app_videos',
      tags: ['hadiqa_v4', uploadCategory],
      context: { custom: { caption: uploadTitle || "بدون عنوان" } },
      resourceType: 'video'
    }, (err: any, res: any) => {
      if (!err && res?.event === "success") {
        const newV: Video = {
          id: res.info.public_id,
          public_id: res.info.public_id,
          video_url: res.info.secure_url,
          title: uploadTitle || "فيديو جديد",
          category: uploadCategory, // القسم المختار من القائمة
          type: res.info.height > res.info.width ? 'short' : 'long',
          likes: 0, views: 0, tags: []
        };
        setVideos(p => [newV, ...p]);
        if (onNewVideo) onNewVideo(newV);
        setUploadTitle('');
        setIsUploading(false);
      } else if (res?.event === "close") setIsUploading(false);
    });
  };

  const handlePermanentDelete = (id: string) => {
    if (window.confirm("هل أنت متأكد من مسح هذا الكابوس نهائياً؟")) {
      setVideos(prev => prev.filter(v => v.id !== id && v.public_id !== id));
      onDeleteVideo?.(id);
    }
  };

  const saveEdit = (v: Video) => {
    setVideos(p => p.map(item => item.id === v.id ? v : item));
    if (onUpdateVideo) onUpdateVideo(v);
    setEditingVideo(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-6" dir="rtl">
        <img src={LOGO_URL} className="w-24 h-24 rounded-full border-4 border-red-600 mb-8 shadow-[0_0_40px_red]" />
        <h2 className="text-2xl font-black text-red-600 mb-8 italic tracking-tighter">منطقة محظورة - أدخل الرمز</h2>
        <div className="flex gap-3 mb-12">
          {[1,2,3,4,5,6].map((_, i) => (
            <div key={i} className={`w-5 h-5 rounded-full border-2 border-red-600 ${passcode.length > i ? 'bg-red-600 shadow-[0_0_15px_red]' : 'bg-transparent'}`}></div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-5 max-w-[300px]">
          {[1,2,3,4,5,6,7,8,9,0].map(num => (
            <button key={num} onClick={() => passcode.length < 6 && setPasscode(p => p + num)} className="w-20 h-20 bg-neutral-900/50 rounded-3xl text-3xl font-black border-2 border-white/5 active:bg-red-600 active:border-white transition-all">
              {num}
            </button>
          ))}
          <button onClick={() => setPasscode('')} className="w-20 h-20 bg-red-950/30 rounded-3xl text-sm font-black border-2 border-red-600/20 text-red-500">مسح</button>
          <button onClick={handleAuth} className="col-span-2 w-full bg-red-600 rounded-3xl text-xl font-black shadow-[0_0_30px_red] active:scale-95">دخول</button>
        </div>
        <button onClick={onClose} className="mt-16 text-gray-600 font-bold underline hover:text-white transition-colors">العودة للحديقة</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[900] bg-[#020202] overflow-hidden flex flex-col" dir="rtl">
      <div className="h-24 border-b-2 border-red-600/20 flex items-center justify-between px-8 bg-black/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <img src={LOGO_URL} className="w-12 h-12 rounded-full border-2 border-red-600" />
          <h1 className="text-xl font-black text-red-600 italic tracking-widest">HADIQA STUDIO</h1>
        </div>
        <div className="flex-1 max-w-lg mx-10">
          <div className="relative">
            <input 
              type="text" placeholder="بحث في المستودع الرقمي..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900/50 border-2 border-white/5 rounded-2xl py-3 px-12 text-sm outline-none focus:border-red-600 transition-all"
            />
            <svg className="w-5 h-5 absolute right-4 top-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>
        <button onClick={onClose} className="p-3 text-gray-500 hover:text-red-600 transition-colors"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 pb-40">
        <div className="bg-neutral-900/30 border-2 border-white/5 p-8 rounded-[3rem] mb-12 shadow-2xl">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-black flex items-center gap-3"><span className="w-3 h-3 bg-red-600 rounded-full animate-ping"></span> رفع استدعاء جديد للأقسام</h2>
           </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <input 
              type="text" placeholder="عنوان الفيديو" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)}
              className="bg-black border-2 border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-red-600"
            />
            {/* اختيار القسم من الـ 8 أقسام المعتمدة فقط */}
            <select 
              value={uploadCategory} 
              onChange={e => setUploadCategory(e.target.value)} 
              className="bg-black border-2 border-white/10 rounded-2xl p-5 text-sm text-red-500 font-black outline-none cursor-pointer"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={openUploadWidget} disabled={isUploading} className="bg-red-600 rounded-2xl font-black text-sm py-5 active:scale-95 disabled:opacity-50 shadow-[0_0_20px_red] transition-all">
              {isUploading ? "جاري الاستحضار..." : "بدء الرفع المبوب"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredVideos.map(v => (
            <div key={v.id} className="bg-neutral-900/40 border-2 border-white/5 p-5 rounded-[2.5rem] flex items-center justify-between group">
              <div className="flex items-center gap-6 flex-1 overflow-hidden">
                <div className="w-32 h-20 bg-black rounded-3xl overflow-hidden border-2 border-white/5 shrink-0">
                  <video src={v.video_url} className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-black text-white line-clamp-1 italic">{v.title}</h3>
                  <span className="text-[9px] bg-red-600/10 text-red-500 px-3 py-1 rounded-full uppercase font-black border border-red-600/20 w-fit">{v.category}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditingVideo(v)} className="p-3 text-blue-500 hover:bg-blue-600/10 rounded-xl transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button onClick={() => handlePermanentDelete(v.id)} className="p-3 text-red-600 hover:bg-red-600/10 rounded-xl transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingVideo && (
        <VideoEditor 
          video={editingVideo} 
          categories={categories}
          onClose={() => setEditingVideo(null)} 
          onSave={saveEdit} 
        />
      )}
    </div>
  );
};

const VideoEditor: React.FC<{ video: Video, categories: string[], onClose: () => void, onSave: (v: Video) => void }> = ({ video, categories, onClose, onSave }) => {
  const [v, setV] = useState<Video>({ ...video });
  return (
    <div className="fixed inset-0 z-[1000] bg-black/98 backdrop-blur-3xl p-10 flex flex-col" dir="rtl">
      <div className="flex items-center justify-between mb-12 border-b-2 border-white/10 pb-6">
        <h2 className="text-2xl font-black italic text-red-600">تغيير قسم الفيديو</h2>
        <button onClick={onClose} className="p-4 text-gray-500"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-12 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="text-xs font-black text-gray-500 uppercase px-4">عنوان الفيديو</label>
            <input type="text" value={v.title} onChange={e => setV({...v, title: e.target.value})} className="w-full bg-neutral-900 border-2 border-white/5 rounded-2xl p-6 text-white font-black" />
          </div>
          <div className="space-y-4">
            <label className="text-xs font-black text-gray-500 uppercase px-4">القسم المخصص</label>
            <select value={v.category} onChange={e => setV({...v, category: e.target.value})} className="w-full bg-neutral-900 border-2 border-white/5 rounded-2xl p-6 text-red-600 font-black cursor-pointer">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button onClick={() => onSave(v)} className="w-full bg-red-600 py-8 rounded-2xl font-black text-white text-xl">حفظ التغييرات</button>
      </div>
    </div>
  );
};

export default AdminDashboard;
