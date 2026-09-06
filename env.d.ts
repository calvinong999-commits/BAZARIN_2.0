interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_KEY: string
    readonly VITE_MIDTRANS_ID: string
    readonly VITE_MIDTRANS_CLIENT_KEY: string
    readonly VITE_MIDTRANS_SERVER_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}