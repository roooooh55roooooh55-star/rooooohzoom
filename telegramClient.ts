
import { Video } from './types';

const TELEGRAM_BOT_TOKEN = '8377287398:AAHlw02jpdHRE6OtwjABgCPVrxF4HLRQT9A';
const CHAT_ID = '-1003563010631'; 

/**
 * جلب رابط مباشر جديد وحي من تليجرام لمنع الشاشة السوداء
 */
export async function getFreshTelegramUrl(fileId: string): Promise<string> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
    const data = await response.json();
    if (data.ok && data.result.file_path) {
      return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${data.result.file_path}`;
    }
    return '';
  } catch (error) {
    console.error("Fresh Link Error:", error);
    return '';
  }
}

export const fetchTelegramVideos = async (): Promise<Video[]> => {
  try {
    const savedVideos = localStorage.getItem('hadiqa_telegram_warehouse');
    if (!savedVideos) return [];
    const videos: Video[] = JSON.parse(savedVideos);
    // نقوم بتحديث الروابط عند الطلب فقط لتوفير الأداء، ولكن هنا نضمن وجودها
    return videos;
  } catch (error) {
    return [];
  }
};

export const uploadToTelegramWithProgress = (
  file: File, 
  title: string, 
  category: string,
  onProgress: (p: number) => void
): Promise<Video | null> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('video', file);
    formData.append('caption', `💀 الحديقة المرعبة 💀\n\nالعنوان: ${title}`);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = async () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        if (data.ok) {
          const fileId = data.result.video.file_id;
          const videoUrl = await getFreshTelegramUrl(fileId);
          resolve({
            id: fileId,
            public_id: fileId,
            video_url: videoUrl,
            poster_url: '', 
            title: title,
            category: category,
            type: 'short',
            likes: 0,
            views: 0,
            realViews: 0,
            created_at: new Date().toISOString()
          });
        } else {
          reject(new Error(data.description));
        }
      } else {
        reject(new Error('Upload failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
};

export const uploadToTelegram = async (file: File, title: string, category: string): Promise<Video | null> => {
  return uploadToTelegramWithProgress(file, title, category, () => {});
};
