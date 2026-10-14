-- =============================================================================
-- Krøll pattern structure (grams-first yarn) — DOCUMENTATION / ADDITIVE NOTES
-- yarn_requirements and sizes are already jsonb on knitting_patterns.
-- No destructive migration required. Run only if you want column comments.
-- Do NOT auto-run from the app. Does not touch FGTG.
-- =============================================================================

-- Yarn requirement JSON shape (per array element):
-- {
--   "id": "yarn-1",
--   "label": { "no": "...", "en": "..." },
--   "brand": "...",
--   "weight": "dk",
--   "gramsPerSkein": 50,
--   "metresPerSkein": 115,
--   "gramsBySize": [350, 400, 450, ...],   -- PRIMARY user-facing
--   "metresBySize": [805, 920, ...],      -- internal / stash (calc or override)
--   "metresManualOverride": false,
--   "metresMin": 805,
--   "metresMax": 1380,
--   "gramsMin": 350,
--   "gramsMax": 650,
--   "heldTogetherGroupId": "held-1" | null,
--   "substituteNote": { "no": "...", "en": "..." },
--   "notions": { "no": "...", "en": "..." }
-- }
--
-- Size JSON may include bodyBustMinCm / bodyBustMaxCm for size guide
-- (body measurement range), distinct from finished chestCm.

comment on column public.knitting_patterns.yarn_requirements is
  'JSON array of yarn lines. Primary quantity is gramsBySize; metresBySize is for stash matching (m/g aware). heldTogetherGroupId groups yarns worked together.';

comment on column public.knitting_patterns.sizes is
  'JSON array of sizes. Finished garment fields (chestCm, …) plus optional bodyBustMinCm/MaxCm for size guide.';
