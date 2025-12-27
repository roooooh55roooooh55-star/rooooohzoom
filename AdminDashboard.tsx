
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Video } from './types';
import { fetchCloudinaryVideos } from './cloudinaryClient';
import { generateVideoMetadata, suggestTags } from './geminiService';
import { GoogleGenAI } from "@google/genai";

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
  const [currentPasscode, setCurrentPasscode] = useState(() => localStorage.getItem('hadiqa-admin-pass') || '506070');
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState(categories[0] || 'هجمات مرعبة');
  const [uploadExternalLink, setUploadExternalLink] = useState('');
  
  // تشخيص الحالة
  const [aiStatus, setAiStatus] = useState<'idle' | 'checking' | 'active' | 'error'>('idle');
  const [cloudinaryStatus, setCloudinaryStatus] = useState<'idle' | 'checking' | 'active' | 'error'>('idle');

  const handleAuth = () => {
    if (passcode === currentPasscode) {
      setIsAuthenticated(true);
    } else {
      alert("رمز الحماية خاطئ. الأرواح تراقبك.");
      setPasscode('');
    }
  };

  const checkAISystem = async () => {
    setAiStatus('checking');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Hi',
        config: { maxOutputTokens: 5 }
      });
      if (response.text) setAiStatus('active');
      else setAiStatus('error');
    } catch (e) {
      console.error(e);
      setAiStatus('error');
    }
  };

  const checkCloudinarySystem = async () => {
    setCloudinaryStatus('checking');
    try {
      const data = await fetchCloudinaryVideos();
      if (data && data.length > 0) setCloudinaryStatus('active');
      else setCloudinaryStatus('error');
    } catch (e) {
      setCloudinaryStatus('error');
    }
  };

  const filteredVideos = useMemo(() => {
    return videos.filter(v => 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [videos, searchQuery]);

  const handleAISuggestForUpload = async () => {
    if (isUploading) return;
    setIsUploading(true);
    const meta = await generateVideoMetadata(uploadCategory);
    setUploadTitle(meta.title);
    setIsUploading(false);
  };

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
          category: uploadCategory,
          type: res.info.height > res.info.width ? 'short' : 'long',
          likes: 0, views: 0, tags: [], isFeatured: false,
          external_link: uploadExternalLink
        };
        setVideos(p => [newV, ...p]);
        if (onNewVideo) onNewVideo(newV);
        setUploadTitle('');
        setUploadExternalLink('');
        setIsUploading(false);
      } else if (res?.event === "close") setIsUploading(false);
    });
  };

  const saveEdit = (v: Video) => {
    const updated = videos.map(item => (item.id === v.id || item.public_id === v.id) ? v : item);
    setVideos(updated);
    if (onUpdateVideo) onUpdateVideo(v);
    setEditingVideo(null);
  };

  const handleDelete = (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id && v.public_id !== id));
    onDeleteVideo?.(id);
    setEditingVideo(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-6" dir="rtl">
        <img src={LOGO_URL} className="w-24 h-24 rounded-full border-4 border-red-600 mb-8 shadow-[0_0_40px_red]" />
        <h2 className="text-2xl font-black text-red-600 mb-8 italic tracking-tighter text-center">منطقة محظورة<br/>أدخل رمز العبور</h2>
        <div className="flex gap-3 mb-12">
          {[1,2,3,4,5,6].map((_, i) => (
            <div key={i} className={`w-5 h-5 rounded-full border-2 border-red-600 ${passcode.length > i ? 'bg-red-600 shadow-[0_0_15px_red]' : 'bg-transparent'}`}></div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-5 max-w-[300px]">
          {[1,2,3,4,5,6,7,8,9].map(num => (
            <button key={num} onClick={() => passcode.length < 6 && setPasscode(p => p + num)} className="w-20 h-20 bg-neutral-900/50 rounded-3xl text-3xl font-black border-2 border-white/5 active:bg-red-600 active:border-white transition-all text-white">
              {num}
            </button>
          ))}
          <button onClick={() => setPasscode('')} className="w-20 h-20 bg-red-950/30 rounded-3xl text-sm font-black border-2 border-red-600/20 text-red-500 active:bg-red-600 active:text-white transition-all">مسح</button>
          <button onClick={() => passcode.length < 6 && setPasscode(p => p + '0')} className="w-20 h-20 bg-neutral-900/50 rounded-3xl text-3xl font-black border-2 border-white/5 active:bg-red-600 active:border-white transition-all text-white">0</button>
          <button onClick={handleAuth} className="w-20 h-20 bg-red-600 rounded-3xl text-sm font-black shadow-[0_0_20px_rgba(220,38,38,0.5)] active:scale-95 transition-all text-white border-2 border-red-400">دخول</button>
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
          <h1 className="text-xl font-black text-red-600 italic tracking-widest uppercase">Dev Console</h1>
        </div>
        <div className="flex-1 max-w-lg mx-10">
          <input 
            type="text" placeholder="ابحث لتعديل فيديو..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900/50 border-2 border-white/5 rounded-2xl py-3 px-6 text-sm outline-none focus:border-red-600 transition-all text-white"
          />
        </div>
        <button onClick={onClose} className="p-3 text-gray-500 hover:text-red-600 transition-colors"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 pb-40">
        <div className="bg-neutral-900/30 border-2 border-white/5 p-8 rounded-[3rem] mb-12 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black">رفع فيديو جديد</h2>
            <button onClick={handleAISuggestForUpload} className="bg-purple-600/20 text-purple-400 border border-purple-500/50 px-4 py-1 rounded-full text-[10px] font-black hover:bg-purple-600 hover:text-white transition-all animate-pulse">
              الذكاء الاصطناعي: اقتراح عنوان
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <input type="text" placeholder="العنوان" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} className="bg-black border-2 border-white/10 rounded-2xl p-5 text-white" />
            <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="bg-black border-2 border-white/10 rounded-2xl p-5 text-red-500 font-black">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="text" placeholder="رابط خارجي مخصص (اختياري)" value={uploadExternalLink} onChange={e => setUploadExternalLink(e.target.value)} className="bg-black border-2 border-white/10 rounded-2xl p-5 text-white lg:col-span-2" />
            <button onClick={openUploadWidget} disabled={isUploading} className="bg-red-600 rounded-2xl font-black py-5 text-white lg:col-span-2 shadow-[0_0_20px_red]">الرفع الآن</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredVideos.map(v => (
            <div key={v.id} className={`bg-neutral-900/20 border-2 p-4 rounded-[2.5rem] flex items-center gap-4 transition-all ${v.isFeatured ? 'border-red-600 shadow-[0_0_15px_red]' : 'border-white/5'}`}>
              <div className="w-24 h-16 bg-black rounded-xl overflow-hidden shrink-0">
                <video src={v.video_url} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 text-right">
                <h3 className="text-sm font-black text-white truncate">{v.title}</h3>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setEditingVideo(v)} className="bg-blue-600 px-3 py-1 rounded-lg text-[10px] font-black">تعديل</button>
                  <button 
                    onClick={() => saveEdit({...v, isFeatured: !v.isFeatured})} 
                    className={`px-3 py-1 rounded-lg text-[10px] font-black ${v.isFeatured ? 'bg-red-600 text-white animate-pulse shadow-[0_0_10px_red]' : 'bg-gray-700 text-white'}`}
                  >
                    {v.isFeatured ? 'رائج' : 'عادي'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* قسم تشخيص النظام المطور */}
        <div className="border-t border-white/10 pt-10">
           <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2">
             <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
             تشخيص النظام (المطور)
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* فحص Gemini */}
              <div className="bg-neutral-900/50 p-6 rounded-3xl border border-white/5 flex flex-col gap-4">
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-400">Gemini AI Engine</span>
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                      aiStatus === 'active' ? 'bg-green-600/20 text-green-500' : 
                      aiStatus === 'error' ? 'bg-red-600/20 text-red-500' : 'bg-gray-600/20 text-gray-500'
                    }`}>
                      {aiStatus === 'active' ? 'متصل' : aiStatus === 'error' ? 'خطأ في المفتاح' : 'قيد الانتظار'}
                    </span>
                 </div>
                 <div className="text-[10px] font-mono text-gray-500 truncate bg-black/40 p-2 rounded-lg">
                    Key: {process.env.API_KEY ? `${process.env.API_KEY.substring(0, 8)}...` : 'غير معرف'}
                 </div>
                 <button 
                   onClick={checkAISystem}
                   disabled={aiStatus === 'checking'}
                   className="w-full bg-white/5 border border-white/10 py-2 rounded-xl text-[10px] font-black hover:bg-white/10 transition-all"
                 >
                   {aiStatus === 'checking' ? 'جاري الفحص...' : 'فحص حالة المفتاح'}
                 </button>
              </div>

              {/* فحص Cloudinary */}
              <div className="bg-neutral-900/50 p-6 rounded-3xl border border-white/5 flex flex-col gap-4">
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-400">Cloudinary Storage</span>
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                      cloudinaryStatus === 'active' ? 'bg-green-600/20 text-green-500' : 
                      cloudinaryStatus === 'error' ? 'bg-red-600/20 text-red-500' : 'bg-gray-600/20 text-gray-500'
                    }`}>
                      {cloudinaryStatus === 'active' ? 'متاح' : cloudinaryStatus === 'error' ? 'فشل الجلب' : 'قيد الانتظار'}
                    </span>
                 </div>
                 <div className="text-[10px] text-gray-500 italic">
                    ملاحظة: تأكد من تفعيل "Resource List" في إعدادات Cloudinary.
                 </div>
                 <button 
                   onClick={checkCloudinarySystem}
                   disabled={cloudinaryStatus === 'checking'}
                   className="w-full bg-white/5 border border-white/10 py-2 rounded-xl text-[10px] font-black hover:bg-white/10 transition-all"
                 >
                   {cloudinaryStatus === 'checking' ? 'جاري الجلب...' : 'فحص جلب الفيديوهات'}
                 </button>
              </div>
           </div>
        </div>
      </div>

      {editingVideo && (
        <VideoEditor 
          video={editingVideo} 
          categories={categories}
          onClose={() => setEditingVideo(null)} 
          onSave={saveEdit} 
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

const VideoEditor: React.FC<{ video: Video, categories: string[], onClose: () => void, onSave: (v: Video) => void, onDelete: (id: string) => void }> = ({ video, categories, onClose, onSave, onDelete }) => {
  const [v, setV] = useState<Video>({ ...video });
  const [loadingAI, setLoadingAI] = useState(false);

  const handleAIEdit = async () => {
    setLoadingAI(true);
    const meta = await generateVideoMetadata(v.category);
    setV(prev => ({ ...prev, title: meta.title, tags: meta.tags }));
    setLoadingAI(false);
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-black/95 backdrop-blur-xl flex flex-col p-8 overflow-y-auto" dir="rtl">
      <div className="max-w-xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-red-600">تعديل الكابوس</h2>
          <button onClick={handleAIEdit} disabled={loadingAI} className="bg-purple-600/20 text-purple-400 border border-purple-500/50 px-4 py-2 rounded-xl text-[10px] font-black disabled:opacity-50">
            {loadingAI ? 'جاري التحليل...' : 'اقتراح ذكاء اصطناعي'}
          </button>
        </div>
        <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-white/10">
           <video src={v.video_url} autoPlay muted loop className="w-full h-full object-contain" />
        </div>
        <div className="space-y-4">
           <label className="text-[10px] font-black text-gray-500 uppercase mr-2">العنوان</label>
           <input type="text" value={v.title} onChange={e => setV({...v, title: e.target.value})} className="w-full bg-neutral-900 border border-white/10 rounded-2xl p-5 text-white" placeholder="العنوان" />
           
           <label className="text-[10px] font-black text-gray-500 uppercase mr-2">القسم</label>
           <select value={v.category} onChange={e => setV({...v, category: e.target.value})} className="w-full bg-neutral-900 border border-white/10 rounded-2xl p-5 text-red-600 font-black">
             {categories.map(c => <option key={c} value={c}>{c}</option>)}
           </select>

           <label className="text-[10px] font-black text-gray-500 uppercase mr-2">الرابط الخارجي</label>
           <input type="text" value={v.external_link || ''} onChange={e => setV({...v, external_link: e.target.value})} className="w-full bg-neutral-900 border border-white/10 rounded-2xl p-5 text-white" placeholder="رابط الانتقال المخصص" />
           
           <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
              <input type="checkbox" checked={v.isFeatured} onChange={e => setV({...v, isFeatured: e.target.checked})} className="w-6 h-6 accent-red-600" id="feat-check" />
              <label htmlFor="feat-check" className="text-sm font-black text-white">تمييز كـ "رائج" (Neon Badge)</label>
           </div>
        </div>
        <div className="flex gap-4">
           <button onClick={() => onSave(v)} className="flex-1 bg-red-600 py-4 rounded-2xl font-black text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]">حفظ التغييرات</button>
           <button onClick={onClose} className="flex-1 bg-neutral-800 py-4 rounded-2xl font-black text-white">إلغاء</button>
        </div>
        <button onClick={() => window.confirm("هل أنت متأكد من حذف هذا الكابوس؟") && onDelete(v.id)} className="w-full text-red-500 font-bold py-2 border border-red-900/30 rounded-xl hover:bg-red-900/20 transition-all">حذف نهائي</button>
      </div>
    </div>
  );
};

export default AdminDashboard;
