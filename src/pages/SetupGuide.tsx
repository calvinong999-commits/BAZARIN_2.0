import { useState } from 'react'
import { Card, Button, Alert } from '../components/ui'
import { projectId } from '../../utils/supabase/info'

export function SetupGuide() {
  const [copied, setCopied] = useState(false)

  const sql = `-- ════════════════════════════════════════════
-- BZR DATABASE SETUP — Run in Supabase SQL Editor
-- ════════════════════════════════════════════

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  created_at timestamptz DEFAULT now()
);

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'umkm',
  full_name text,
  business_name text,
  phone text,
  city text,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  cover_image text,
  city text,
  location text,
  address text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_time time,
  end_time time,
  total_slots int DEFAULT 0,
  available_slots int DEFAULT 0,
  price numeric DEFAULT 0,
  status text DEFAULT 'pending',
  admin_notes text,
  tags text[],
  proposal_url text,
  izin_url text,
  ktp_url text,
  contact_phone text,
  layout_image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Event Stands
CREATE TABLE IF NOT EXISTS event_stands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  features text[] DEFAULT '{}',
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Registrations
CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  umkm_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  business_name text,
  phone text,
  product_type text,
  notes text,
  status text DEFAULT 'pending',
  host_notes text,
  ktp_url text,
  address text,
  stand_id uuid REFERENCES event_stands(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, umkm_id)
);

-- Payments (Midtrans)
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid REFERENCES registrations(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  umkm_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  order_id text UNIQUE NOT NULL,
  gross_amount numeric NOT NULL,
  payment_type text DEFAULT 'midtrans',
  transaction_status text DEFAULT 'pending',
  snap_token text,
  payment_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Event Reviews & Ratings (UMKM -> Host/Event)
CREATE TABLE IF NOT EXISTS event_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  umkm_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  registration_id uuid REFERENCES registrations(id) ON DELETE SET NULL,
  rating int CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, umkm_id)
);

-- UMKM Reviews & Ratings (Host -> UMKM)
CREATE TABLE IF NOT EXISTS umkm_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  host_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  umkm_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  registration_id uuid REFERENCES registrations(id) ON DELETE CASCADE,
  rating int CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, umkm_id)
);

-- Conversations (Tanya Host)
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  host_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  umkm_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, umkm_id)
);

-- In-App Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  registration_id uuid REFERENCES registrations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE umkm_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_stands ENABLE ROW LEVEL SECURITY;

-- Event Stands policies
CREATE POLICY "stands_select" ON event_stands FOR SELECT USING (true);
CREATE POLICY "stands_insert" ON event_stands FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM events WHERE events.id = event_stands.event_id AND events.host_id = auth.uid())
);
CREATE POLICY "stands_update" ON event_stands FOR UPDATE USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = event_stands.event_id AND events.host_id = auth.uid())
);
CREATE POLICY "stands_delete" ON event_stands FOR DELETE USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = event_stands.event_id AND events.host_id = auth.uid())
);

-- Payments policies
CREATE POLICY "payments_select" ON payments FOR SELECT USING (
  umkm_id = auth.uid() OR
  EXISTS (SELECT 1 FROM events WHERE events.id = payments.event_id AND events.host_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "payments_insert" ON payments FOR INSERT WITH CHECK (umkm_id = auth.uid());
CREATE POLICY "payments_update" ON payments FOR UPDATE USING (
  umkm_id = auth.uid() OR
  EXISTS (SELECT 1 FROM events WHERE events.id = payments.event_id AND events.host_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Reviews policies (UMKM -> Host)
CREATE POLICY "reviews_select" ON event_reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON event_reviews FOR INSERT WITH CHECK (umkm_id = auth.uid());
CREATE POLICY "reviews_update" ON event_reviews FOR UPDATE USING (umkm_id = auth.uid());

-- UMKM Reviews policies (Host -> UMKM)
CREATE POLICY "umkm_reviews_select" ON umkm_reviews FOR SELECT USING (true);
CREATE POLICY "umkm_reviews_insert" ON umkm_reviews FOR INSERT WITH CHECK (host_id = auth.uid());
CREATE POLICY "umkm_reviews_update" ON umkm_reviews FOR UPDATE USING (host_id = auth.uid());

-- Conversations policies
CREATE POLICY "convs_select" ON conversations FOR SELECT USING (host_id = auth.uid() OR umkm_id = auth.uid());
CREATE POLICY "convs_insert" ON conversations FOR INSERT WITH CHECK (host_id = auth.uid() OR umkm_id = auth.uid());

-- Chat Messages policies
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversations WHERE id = chat_messages.conversation_id AND (host_id = auth.uid() OR umkm_id = auth.uid()))
  OR
  EXISTS (SELECT 1 FROM registrations WHERE id = chat_messages.registration_id AND (umkm_id = auth.uid() OR EXISTS (SELECT 1 FROM events WHERE id = registrations.event_id AND host_id = auth.uid())))
);
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Profiles policies
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Events policies
CREATE POLICY "events_select" ON events FOR SELECT USING (
  status = 'published' OR host_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (host_id = auth.uid());
CREATE POLICY "events_update" ON events FOR UPDATE USING (
  host_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "events_delete" ON events FOR DELETE USING (host_id = auth.uid());

-- Registrations policies
CREATE POLICY "regs_select" ON registrations FOR SELECT USING (
  umkm_id = auth.uid() OR
  EXISTS (SELECT 1 FROM events WHERE events.id = registrations.event_id AND events.host_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "regs_insert" ON registrations FOR INSERT WITH CHECK (umkm_id = auth.uid());
CREATE POLICY "regs_update" ON registrations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = registrations.event_id AND events.host_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Categories policies
CREATE POLICY "cats_select" ON categories FOR SELECT USING (true);
CREATE POLICY "cats_admin" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seed default categories
INSERT INTO categories (name, slug, icon) VALUES
  ('Bazaar', 'bazaar', '🎪'),
  ('Festival', 'festival', '🎉'),
  ('Pameran', 'pameran', '🖼️'),
  ('Expo', 'expo', '🏢'),
  ('Market Day', 'market-day', '🛒'),
  ('Kampus', 'kampus', '🎓'),
  ('Kuliner', 'kuliner', '🍜'),
  ('Fashion', 'fashion', '👗'),
  ('Kerajinan', 'kerajinan', '🎨'),
  ('Teknologi', 'teknologi', '💻')
ON CONFLICT (slug) DO NOTHING;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'umkm'),
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Storage bucket for media
INSERT INTO storage.buckets (id, name, public)
VALUES ('bzr-media', 'bzr-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "media_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'bzr-media');
CREATE POLICY "media_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'bzr-media' AND auth.role() = 'authenticated');
CREATE POLICY "media_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'bzr-media' AND auth.uid() = owner);
CREATE POLICY "media_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'bzr-media' AND auth.uid() = owner);`

  function copy() {
    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-start justify-center p-6 pt-12">
      <div className="w-full max-w-3xl space-y-6">
        <div className="text-center space-y-2">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-3xl px-5 py-2 rounded-2xl inline-block shadow-xl">BZR</div>
          <h1 className="text-2xl font-bold text-slate-800">Setup Database Supabase</h1>
          <p className="text-slate-500">Ikuti langkah berikut untuk menghubungkan BZR ke Supabase</p>
        </div>

        <Alert type="info" message={`Project Supabase: ${projectId}`} />

        <div className="space-y-4">
          {[
            { n: '1', title: 'Buka Supabase SQL Editor', body: <>Buka <a href={`https://supabase.com/dashboard/project/${projectId}/sql/new`} target="_blank" rel="noopener" className="text-blue-600 hover:underline font-semibold">Supabase SQL Editor →</a> untuk project ini.</> },
            { n: '2', title: 'Copy & Jalankan SQL', body: 'Copy seluruh SQL di bawah dan paste ke SQL Editor, lalu tekan RUN.' },
            { n: '3', title: 'Aktifkan Email Auth', body: <>Di <a href={`https://supabase.com/dashboard/project/${projectId}/auth/providers`} target="_blank" rel="noopener" className="text-blue-600 hover:underline font-semibold">Auth Providers →</a>, pastikan Email provider aktif.</> },
            { n: '4', title: 'Set Admin', body: 'Setelah mendaftar dengan akun yang ingin jadi admin, update role di tabel profiles menjadi "admin" via SQL: UPDATE profiles SET role = \'admin\' WHERE email = \'your@email.com\';' },
          ].map(step => (
            <Card key={step.n} className="p-5 flex gap-4">
              <div className="w-9 h-9 bg-blue-600 text-white font-black text-sm rounded-xl flex items-center justify-center shrink-0">{step.n}</div>
              <div>
                <p className="font-bold text-slate-800">{step.title}</p>
                <p className="text-slate-500 text-sm mt-1">{step.body}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-700">
            <span className="text-slate-400 text-xs font-mono">bzr-schema.sql</span>
            <Button size="sm" variant="ghost" onClick={copy} className="text-xs bg-slate-700 text-white hover:bg-slate-600 border-slate-600">
              {copied ? '✓ Copied!' : '📋 Copy SQL'}
            </Button>
          </div>
          <pre className="bg-slate-950 text-emerald-400 text-xs p-5 overflow-auto max-h-64 font-mono leading-relaxed">{sql}</pre>
        </Card>

        <Alert type="success" message="Setelah SQL berhasil dijalankan, refresh halaman dan mulai gunakan BZR!" />

        <div className="text-center">
          <button onClick={() => window.location.reload()} className="text-blue-600 hover:underline font-semibold text-sm">
            Refresh setelah setup selesai →
          </button>
        </div>
      </div>
    </div>
  )
}
