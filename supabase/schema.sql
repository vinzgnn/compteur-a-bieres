-- =============================================
-- Schéma Supabase - Compteur à Bières
-- =============================================

-- Table des membres
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pseudo TEXT NOT NULL UNIQUE,
  email TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des posts (photos de pintes)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  pseudo TEXT NOT NULL,
  location TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  pint_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_pseudo ON posts(pseudo);
CREATE INDEX idx_posts_pint_number ON posts(pint_number);

-- Config générale
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO config (key, value) VALUES
  ('goal', '5000'),
  ('group_name', 'Road to 5000 pintes');

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "Lecture publique posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Lecture publique membres" ON members FOR SELECT USING (true);

-- Écriture uniquement via service role (API routes Next.js)
CREATE POLICY "Insertion posts via service role" ON posts
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Insertion membres via service role" ON members
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
