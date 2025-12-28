
const VOICE_ID = 'EXAVIToYtCBk8En3LNoS'; 
const DEFAULT_KEY = '97b061348f54aac071926ba535a848e27bee7e1b66655d2c4aea97e61c1d1a63';

let currentAudio: HTMLAudioElement | null = null;

export interface ElevenKeyInfo {
  key: string;
  characterLimit: number;
  characterCount: number;
  remaining: number;
  status: 'active' | 'error' | 'checking';
}

export const getElevenLabsKeys = (): string[] => {
  try {
    const saved = localStorage.getItem('hadiqa_eleven_keys_v2');
    return saved ? JSON.parse(saved) : [DEFAULT_KEY];
  } catch {
    return [DEFAULT_KEY];
  }
};

export const saveElevenLabsKeys = (keys: string[]) => {
  localStorage.setItem('hadiqa_eleven_keys_v2', JSON.stringify(keys));
};

export const getSubscriptionInfo = async (key: string): Promise<ElevenKeyInfo | null> => {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': key },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      key,
      characterLimit: data.character_limit,
      characterCount: data.character_count,
      remaining: data.character_limit - data.character_count,
      status: 'active'
    };
  } catch {
    return null;
  }
};

export const speakText = async (text: string): Promise<void> => {
  if (!text) return;
  
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }

  const keys = getElevenLabsKeys();
  
  for (const key of keys) {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': key,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.4, similarity_boost: 0.8 },
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        currentAudio = audio;
        
        return new Promise((resolve) => {
          audio.onended = () => {
            if (currentAudio === audio) currentAudio = null;
            resolve();
          };
          audio.onerror = () => resolve();
          audio.play().catch(() => resolve());
        });
      }
    } catch (error) {
      continue; 
    }
  }
};
