CREATE TABLE users (
  id TEXT PRIMARY KEY,
  chaos_mode BOOLEAN DEFAULT FALSE,
  skip_count INTEGER DEFAULT 0,
  play_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE games (
  seed TEXT PRIMARY KEY,
  game_type TEXT NOT NULL,
  config_json JSONB NOT NULL,
  fingerprint TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE seen_seeds (
  user_id TEXT REFERENCES users(id),
  seed TEXT REFERENCES games(seed),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, seed)
);

CREATE TABLE memes (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  style TEXT NOT NULL,
  seed TEXT NOT NULL,
  hash TEXT NOT NULL,
  embedding JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE engagements (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  seed TEXT,
  action TEXT NOT NULL,
  value INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE comments (
  id BIGSERIAL PRIMARY KEY,
  seed TEXT NOT NULL,
  user_id TEXT REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
