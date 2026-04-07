import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qjfpysmatudfdiykfxfc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZnB5c21hdHVkZmRpeWtmeGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNDA3NTEsImV4cCI6MjA1OTYxNjc1MX0.5KQx3j6OQHl0fRjnBdmq6YxB80Pb_iSXQDlBldn7Sag";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
