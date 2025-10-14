import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://utynvssdbjeiujjvsrmj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0eW52c3NkYmplaXVqanZzcm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzM0NjAsImV4cCI6MjA3NTYwOTQ2MH0.1UdchHU1Bn9GLwJEL6A7yDwVq2HyQy47dzbxhmi-LV0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
