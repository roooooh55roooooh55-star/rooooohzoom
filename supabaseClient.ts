
export const supabase = null;

/**
 * زيادة المشاهدات الحقيقية والوهمية في التخزين المحلي
 */
export const incrementViewsInDB = async (id: string) => {
  try {
    const saved = localStorage.getItem('hadiqa_telegram_warehouse');
    if (!saved) return;
    
    let videos = JSON.parse(saved);
    const index = videos.findIndex((v: any) => v.id === id || v.public_id === id);
    
    if (index !== -1) {
      // زيادة المشاهدات الحقيقية
      videos[index].realViews = (videos[index].realViews || 0) + 1;
      // زيادة المشاهدات التسويقية (وهمية) بمعدل عشوائي
      videos[index].views = (videos[index].views || 0) + Math.floor(Math.random() * 50) + 10;
      
      localStorage.setItem('hadiqa_telegram_warehouse', JSON.stringify(videos));
    }
  } catch (e) {
    console.error('Error incrementing views:', e);
  }
};

export const updateLikesInDB = async (id: string, inc: boolean) => {
  console.log('Like updated locally for:', id, inc);
};
