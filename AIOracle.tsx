
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { speakText } from './ttsService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIOracle: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('al-hadiqa-ai-history-v5');
      return saved ? JSON.parse(saved) : [
        { role: 'model', text: 'أهلاً بيك في الحديقة المرعبة.. أنا الحارسة هنا، وكل ركن في المكان ده وراه حكاية رعب حقيقية.' }
      ];
    } catch (e) { return []; }
  });
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // نظام تتبع الـ TTS اليومي (5 جمل لكل مستخدم)
  const [ttsCount, setTtsCount] = useState(() => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('hadiqa_tts_daily_v2');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.date === today) return data.count;
    }
    return 0;
  });

  useEffect(() => {
    localStorage.setItem('al-hadiqa-ai-history-v5', JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const today = new Date().toDateString();
    localStorage.setItem('hadiqa_tts_daily_v2', JSON.stringify({ date: today, count: ttsCount }));
  }, [ttsCount]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: messages.concat({ role: 'user', text: userMessage }).map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: `أنتِ "حارسة الحديقة المرعبة". شخصيتك: فتاة غامضة، مرعبة، وصارمة. 
          تحدثي بالعامية المصرية المشوقة. ركزي فقط على الحيوانات المفترسة والأهوال الموجودة في الفيديوهات.
          مهم جداً: لا تذكري اسم المطور "حماده العميد" أبداً في حديثك العادي. 
          فقط وإذا فقط سألك المستخدم "مين صاحب التطبيق؟" أو "مين اللي عمل الحديقة؟"، ردي بـ "المطور حماده العميد هو اللي أسس الحديقة دي". 
          غير ذلك، ابقي في شخصية الحارسة المرعبة.`,
          temperature: 0.8,
        }
      });

      const modelResponse = response.text || "الحديقة ساكتة.. والحيوانات مستنية اللحظة الجاية.";
      setMessages(prev => [...prev, { role: 'model', text: modelResponse }]);
      
      // قراءة الرد صوتياً بصوت الحارسة (5 مرات يومياً)
      if (ttsCount < 5) {
        await speakText(modelResponse);
        setTtsCount(p => p + 1);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "في حاجة غلط حصلت.. الحيوانات قربت تهرب!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="fixed bottom-24 right-6 z-[100] w-14 h-14 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.8)] border-2 border-red-400 flex items-center justify-center animate-bounce active:scale-90 transition-all">
        <img src="https://i.top4top.io/p_3643ksmii1.jpg" className="w-10 h-10 rounded-full object-cover" alt="AI Avatar" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex flex-col animate-in fade-in zoom-in duration-300 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-red-600/30 bg-black/50">
            <div className="flex items-center gap-3">
              <img src="https://i.top4top.io/p_3643ksmii1.jpg" className="w-10 h-10 rounded-full border-2 border-red-600 object-cover" alt="AI Avatar" />
              <div className="flex flex-col text-right">
                <h2 className="text-sm font-black text-red-600 italic">حارسة الحديقة المرعبة</h2>
                <span className="text-[8px] text-gray-500 uppercase tracking-widest">الصوت نشط: {ttsCount}/5</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-red-600 p-2"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>

          <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] font-black shadow-xl leading-relaxed ${msg.role === 'user' ? 'bg-white/5 text-gray-300 border border-white/10 rounded-tl-none' : 'bg-red-950/40 text-red-500 border border-red-900/30 rounded-tr-none'}`}>{msg.text}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-black border-t border-white/5 flex items-center gap-2 mb-safe">
            <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="اسألي الحارسة عن أهوال الحديقة..." className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-red-600 transition-colors" />
            <button type="submit" disabled={loading || !inputText.trim()} className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white active:scale-90 disabled:opacity-50"><svg className="w-6 h-6 rotate-180" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIOracle;
