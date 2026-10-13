/* אפרתושקה – הגדרות שבן ממלא (ריק = מוסתר / מצב הדגמה). אין כאן מפתחות סודיים: ה-anon key של Supabase ציבורי ומוגן ע"י RLS. */
window.EFCFG={
  supabaseUrl:'https://xggvdizqwmnnsrzrkios.supabase.co',        // לדוגמה: 'https://abcd1234.supabase.co'
  supabaseAnonKey:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZ3ZkaXpxd21ubnNyenJraW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MDEyODUsImV4cCI6MjEwNzQ3NzI4NX0.kgKbPI_kEfhWhb_tn8KvpCdTol4TooJ19VsM96axhrI',    // ה-anon public key בלבד (לעולם לא service_role)
  social:{
    facebook:'',         // 'https://www.facebook.com/...'
    tiktok:'',           // 'https://www.tiktok.com/@...'
    instagram:'',        // 'https://www.instagram.com/...'
    youtube:'',
    whatsapp:'972502222559',   // וואטסאפ להזמנת מופעים (פורמט בינלאומי)
    phone:'050-2222559',       // טלפון להזמנות (לתצוגה)
    tel:'+972502222559',       // לחיוג
    bookingText:'היי אפרתושקה! 🎉 הגעתי מהמשחק ואשמח לפרטים על מופע ליום הולדת / אירוע. תאריך: ___ גיל הילד/ה: ___ עיר: ___'
  }
};
window.EFCFG.vapidPublicKey='BJY4L5kQ7aPUXFTZ12Dq9G-INmbITxYkUyS0l4UVfSnGUCFVZ5_dRmi9_10iNR-4V7xmkDkoWVCkw7IKYoiWdFs'; // ציבורי בלבד (המפתח הפרטי שמור בשרת)
