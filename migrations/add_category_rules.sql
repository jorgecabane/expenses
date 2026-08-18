-- Reglas comercio -> bolsillo, editables desde la app (antes vivían en un rules.json
-- local del scraper, inaccesible desde el celular y atado a una sola máquina).
CREATE TABLE IF NOT EXISTS category_rules (
  id          TEXT PRIMARY KEY,
  group_id    TEXT NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  keyword     TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_by  TEXT,
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS category_rules_group_keyword_key ON category_rules(group_id, keyword);
CREATE INDEX IF NOT EXISTS category_rules_group_id_idx ON category_rules(group_id);
