const metaENV = import.meta.env;

const VITE_SUPABASE_URL = metaENV.VITE_SUPABASE_URL || "";
const VITE_SUPABASE_KEY = metaENV.VITE_SUPABASE_KEY || "";

export { VITE_SUPABASE_URL, VITE_SUPABASE_KEY };