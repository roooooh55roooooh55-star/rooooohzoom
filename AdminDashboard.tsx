
import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoType, VideoAudioSettings } from './types';
import { fetchTelegramVideos, uploadToTelegramWithProgress, getFreshTelegramUrl } from './telegramClient';
import { analyzeVideoVisualContent, generateLongNarration } from './geminiService';
import { GoogleGenAI } from "@google/genai";
import { speakText, getElevenLabsKeys, saveElevenLabsKeys, getSubscriptionInfo, ElevenKeyInfo } from './ttsService';
import { formatBigNumber } from './MainContent';

const LOGO_URL = "https://i.top4top.io/p_3643ksmii1.jpg";

interface AdminDashboardProps {
  onClose: () => void;
  categories: string[];
  onNewVideo?: (v: Video) => void;
  initialVideos: Video[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onClose, categories, onNewVideo, initialVideos 
}) => {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadNarration, setUploadNarration] = useState('');
  const [uploadCategory, setUploadCategory] = useState(categories[0]);
  const [uploadType, setUploadType] = useState<VideoType>('short');
  const [audioSettings, setAudioSettings] = useState<VideoAudioSettings>({ titleEnabled: true, narrationEnabled: true });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  
  const [keysInfo, setKeysInfo] = useState<ElevenKeyInfo[]>([]);
  const [newKeyInput, setNewKeyInput] = useState('');

  const [devInput, setDevInput] = useState('');
  const [devMessages, setDevMessages] = useState<{role: 'dev' | 'guardian', text: string}[]>([]);
  const [isGuardianLoading, setIsGuardianLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const narrationTimeEstimate = uploadNarration.trim().split(/\s+/).length * 0.5;
  const isTimeWarning = narrationTimeEstimate > videoDuration && videoDuration > 0;

  const handleAuth = () => {
    const adminPass = localStorage.getItem('hadiqa-admin-pass') || '5030775';
    if (passcode === adminPass) {
      setIsAuthenticated(true);
      speakText("أهلاً بك يا مطور الحديقة.");
    } else {
      setPasscode('');
      alert("الرمز خاطئ!");
    }
  };

  const loadKeysInfo = async () => {
    const keys = getElevenLabsKeys();
    const results = await Promise.all(keys.map(k => getSubscriptionInfo(k)));
    setKeysInfo(results.filter((i): i is ElevenKeyInfo => i !== null));
  };

  useEffect(() => {
    if (isAuthenticated) loadKeysInfo();
  }, [isAuthenticated]);

  const handleGenerateAI = async () => {
    if (!previewUrl) return;
    setIsAnalyzing(true);
    try {
      const video = document.createElement('video');
      video.src = previewUrl;
      video.crossOrigin = "anonymous";
      video.currentTime = 1.5;
      video.onseeked = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        const frame = canvas.toDataURL('image/jpeg');
        const [meta, narration] = await Promise.all([
          analyzeVideoVisualContent(frame, uploadCategory),
          generateLongNarration(frame, uploadCategory, videoDuration || 30)
        ]);
        setUploadTitle(meta.title);
        setUploadNarration(narration);
        setIsAnalyzing(false);
        speakText("تم التوليد الذكي.");
      };
    } catch {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      const v = document.createElement('video');
      v.src = url;
      v.onloadedmetadata = () => {
        setVideoDuration(v.duration);
        setUploadType(v.videoHeight > v.videoWidth ? 'short' : 'long');
      };
    }
  };

  const handleSave = async () => {
    if (!selectedFile && !editingVideoId) return;
    setIsUploading(true);
    try {
      const warehouse = JSON.parse(localStorage.getItem('hadiqa_telegram_warehouse') || '[]');
      if (editingVideoId) {
        const idx = warehouse.findIndex((v: any) => v.id === editingVideoId);
        if (idx !== -1) {
          warehouse[idx] = { ...warehouse[idx], title: uploadTitle, narration: uploadNarration, category: uploadCategory, type: uploadType, audioSettings };
          localStorage.setItem('hadiqa_telegram_warehouse', JSON.stringify(warehouse));
          setVideos(warehouse);
        }
      } else if (selectedFile) {
        const result = await uploadToTelegramWithProgress(selectedFile, uploadTitle, uploadCategory, setUploadProgress);
        if (result) {
          const fullVideo = { ...result, type: uploadType, narration: uploadNarration, audioSettings, realViews: 0, views: Math.floor(Math.random()*800000)+200000 };
          const updated = [fullVideo, ...warehouse];
          localStorage.setItem('hadiqa_telegram_warehouse', JSON.stringify(updated));
          setVideos(updated);
          onNewVideo?.(fullVideo);
        }
      }
      setEditingVideoId(null); setSelectedFile(null); setPreviewUrl(null); setUploadTitle(''); setUploadNarration('');
      speakText("تم الحفظ.");
    } catch { alert("خطأ في الرفع"); } finally { setIsUploading(false); setUploadProgress(0); }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[2000] bg-[#050505] flex flex-col items-center justify-center p-6" dir="rtl">
        <img src={LOGO_URL} className="w-24 h-24 rounded-full border-4 border-red-600 mb-8 shadow-[0_0_30px_red]" />
        <h2 className="text-xl font-black text-red-600 mb-8 uppercase">بوابة المطور</h2>
        <div className="flex gap-4 mb-10">
          {[0,1,2,3,4,5,6].map(i => (
            <div key={i} className={`w-3.5 h-3.5 rounded-full border border-red-900 ${passcode.length > i ? 'bg-red-600 shadow-[0_0_10px_red]' : ''}`}></div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} onClick={() => setPasscode(p => p+n)} className="w-16 h-16 bg-neutral-900 border border-white/10 rounded-2xl text-3xl font-black text-white hover:border-red-600 active:scale-90 transition-all shadow-xl flex items-center justify-center">
              {n}
            </button>
          ))}
          <button onClick={() => setPasscode('')} className="w-16 h-16 rounded-2xl bg-red-950/20 text-xs font-black text-red-600">CLR</button>
          <button onClick={() => setPasscode(p => p+'0')} className="w-16 h-16 bg-neutral-900 border border-white/10 rounded-2xl text-3xl font-black text-white flex items-center justify-center">0</button>
          <button onClick={handleAuth} className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_red] active:scale-95 text-3xl font-black text-white">✓</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-[#020202] flex flex-col overflow-hidden text-white font-black" dir="rtl">
       <header className="p-4 border-b border-white/10 bg-neutral-900/50 flex items-center justify-between">
          <h2 className="text-sm italic">نظام التحكم - الحديقة</h2>
          <button onClick={onClose} className="text-xl">✕</button>
       </header>

       <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {isUploading && (
            <div className="bg-neutral-900 p-5 rounded-3xl border border-cyan-500/30 animate-pulse">
              <div className="flex justify-between mb-2 text-[10px] text-cyan-400"><span>جاري الرفع...</span><span>{uploadProgress}%</span></div>
              <div className="h-2 w-full bg-black rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 shadow-[0_0_10px_cyan]" style={{width: `${uploadProgress}%`}}></div>
              </div>
            </div>
          )}

          <div ref={formRef} className="bg-neutral-900 border border-red-600/30 p-6 rounded-[2.5rem] space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-lg">نشر واقعة</h3>
                <div className="flex bg-black p-1 rounded-xl border border-white/10">
                   <button onClick={() => setUploadType('short')} className={`px-4 py-1.5 rounded-lg text-[9px] ${uploadType === 'short' ? 'bg-red-600' : 'text-gray-500'}`}>Shorts</button>
                   <button onClick={() => setUploadType('long')} className={`px-4 py-1.5 rounded-lg text-[9px] ${uploadType === 'long' ? 'bg-red-600' : 'text-gray-500'}`}>Long</button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                   <div onClick={() => fileInputRef.current?.click()} className="aspect-video bg-black rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer overflow-hidden">
                      {previewUrl ? <video src={previewUrl} className="w-full h-full object-contain" muted /> : <span className="text-[10px] opacity-30">اختر فيديو</span>}
                   </div>
                   <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileChange} />
                   <button onClick={handleGenerateAI} disabled={!previewUrl || isAnalyzing} className="w-full py-3 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-xl text-[10px] active:scale-95 transition-all">توليد (AI) 🔄</button>
                </div>

                <div className="space-y-3">
                   <div className="relative">
                      <input type="text" placeholder="العنوان" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-red-600" />
                      <button onClick={() => setAudioSettings(s => ({...s, titleEnabled: !s.titleEnabled}))} className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${audioSettings.titleEnabled ? 'bg-green-500' : 'bg-red-600'}`}></button>
                   </div>
                   <div className="relative">
                      <textarea placeholder="السرد" value={uploadNarration} onChange={e => setUploadNarration(e.target.value)} className="w-full h-24 bg-black border border-white/10 rounded-xl p-3 text-[10px] outline-none" />
                      <div className="absolute left-3 bottom-3 flex flex-col items-center gap-2">
                        <button onClick={() => setAudioSettings(s => ({...s, narrationEnabled: !s.narrationEnabled}))} className={`w-4 h-4 rounded-full ${audioSettings.narrationEnabled ? 'bg-green-500' : 'bg-red-600'}`}></button>
                        <span className={`text-[8px] ${isTimeWarning ? 'text-red-500' : 'text-gray-500'}`}>{narrationTimeEstimate.toFixed(1)}s</span>
                      </div>
                   </div>
                   <button onClick={handleSave} disabled={isUploading || !previewUrl} className="w-full py-4 bg-red-600 rounded-2xl text-white shadow-[0_0_20px_red]">نشر الواقعة 🦁</button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default AdminDashboard;
