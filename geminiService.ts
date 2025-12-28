
import { GoogleGenAI, Type } from "@google/genai";
import { Video, UserInteractions } from "./types";

const APP_CONTEXT = `الهوية: الحديقة المرعبة. المبدأ: تحليل دقيق وواقعي لهجمات الحيوانات المفترسة والأهوال الطبيعية. الأسلوب: سرد سينمائي مرعب بالعامية المصرية.`;

/**
 * تحليل بصري دقيق للمشهد وتوليد عنوان واقعي يصف الحدث الفعلي
 */
export async function analyzeVideoVisualContent(base64Image: string, category: string): Promise<{ title: string, tags: string[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const imagePart = {
      inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] },
    };
    
    const prompt = `${APP_CONTEXT}
    قم بتحليل دقيق جداً لهذه اللقطة. ما هو نوع الحيوان المفترس؟ (أسد، نمر، تمساح، إلخ) وماذا يفعل بالضبط؟ (هجوم، مطاردة، زئير).
    صغ عنواناً واقعياً ومرعباً بالعامية المصرية يصف هذا "الحدث الحقيقي" الذي تراه. 
    ممنوع ذكر اسم المطور. أرجع JSON: {"title": "العنوان الواقعي"، "tags": ["رعب_الحيوانات", "هجوم"]}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [imagePart, { text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    const res = JSON.parse(response.text || '{"title": "هجمة غير متوقعة في الحديقة", "tags": ["رعب"]}');
    return res;
  } catch (e) {
    return { title: "واقعة مرعبة خلف أسوار الحديقة", tags: ["#الحديقة_المرعبة"] };
  }
}

/**
 * توليد سرد قصصي واقعي ومزامن للمدة الزمنية
 */
export async function generateLongNarration(base64Image: string, category: string, durationSeconds: number): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const imagePart = {
      inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] },
    };

    const wordCount = Math.floor(durationSeconds * 2);

    const prompt = `${APP_CONTEXT}
    أنتِ "حارسة الحديقة المرعبة". حللي المشهد المرعب للحيوان المفترس في الصورة. 
    اكتبي سردياً بالعامية المصرية يصف الرعب الحقيقي الذي يحدث. 
    يجب أن يكون النص كافياً للقراءة في ${durationSeconds} ثانية (حوالي ${wordCount} كلمة).
    ركزي على تفاصيل الهجوم أو الرعب البصري. ممنوع ذكر اسم المطور.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [imagePart, { text: prompt }] },
    });

    return response.text || "المكان ده ملوش أمان، وكل لقمة هنا بتمنها.. الحديقة بتفتح أبوابها للأهوال.";
  } catch (e) {
    return "الأهوال في الحديقة ملهاش نهاية، والحيوانات مستنية اللحظة اللي تخرج فيها من الظلام...";
  }
}

export async function getRecommendedFeed(allVideos: Video[], interactions: UserInteractions): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const likedVideos = allVideos.filter(v => interactions.likedIds.includes(v.id));
  const favoriteCategories = Array.from(new Set(likedVideos.map(v => v.category)));
  const videoContext = allVideos.map(v => ({ id: v.id, title: v.title, category: v.category }));
  
  const prompt = `رتب IDs الفيديوهات بناءً على اهتمام المستخدم بتصنيفات: ${JSON.stringify(favoriteCategories)}. الفيديوهات: ${JSON.stringify(videoContext)}. أرجع JSON فقط كقائمة IDs.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return allVideos.map(v => v.id).sort(() => Math.random() - 0.5);
  }
}
