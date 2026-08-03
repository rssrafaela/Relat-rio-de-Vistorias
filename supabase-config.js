const SUPABASE_URL =
  "https://xtmxlztgmvzgmjczkqpp.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_Jr805HCZ1twzhQkSXAvYgQ_82xngDFI";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);