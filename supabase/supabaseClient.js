import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gifgzokqoqrxlurtnlqs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZmd6b2txb3FyeGx1cnRubHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMjExNzEsImV4cCI6MjA2NDY5NzE3MX0.wNkCxBX8gmMQQtPOT1skUFQbEdgvK4DqnygxJhDeuRU '

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
