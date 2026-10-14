-- =============================================================================
-- Krøll demo catalog seed (9 complete demo patterns)
-- INSERT-ONLY / safe for re-run against edited production data.
-- Requires knitting_patterns + pattern_sections.
-- Does NOT touch FGTG tables. Do NOT auto-run from the app.
--
-- SAFETY: on conflict do nothing — never overwrite admin CMS edits,
-- cover images, gallery, PDFs, or section content.
-- Do NOT delete existing demo sections (preserves Admin changes).
-- =============================================================================

alter table public.knitting_patterns
  add column if not exists demo_pattern boolean not null default false;
alter table public.knitting_patterns
  add column if not exists needles jsonb not null default '[]'::jsonb;
alter table public.knitting_patterns
  add column if not exists recommended_ease_min_cm numeric;
alter table public.knitting_patterns
  add column if not exists recommended_ease_max_cm numeric;

-- Remove previous placeholder seed rows only (safe: known retired IDs)
delete from public.pattern_sections where pattern_id in (
  'pat-fjord-cowl','pat-lumen-hat','pat-tide-socks','pat-draft-cardigan'
);
delete from public.knitting_patterns where id in (
  'pat-fjord-cowl','pat-lumen-hat','pat-tide-socks','pat-draft-cardigan'
);

insert into public.knitting_patterns (
  id, slug, status, demo_pattern, price_nok, title_no, title_en, tagline_no, tagline_en,
  description_no, description_en, designer, difficulty, categories,
  sizes, yarn_requirements, needles, recommended_ease_min_cm, recommended_ease_max_cm,
  needle_mm, gauge_stitches, gauge_rows, gauge_per_cm, techniques, abbreviations
) values (
  'pat-lokke-hoodie', 'lokke-hoodie', 'published', true, 0,
  'Løkke Hoodie', 'Løkke Hoodie',
  'En myk, avslappet hettegenser strikket ovenfra og ned med raglanøkninger, romslig hette og lett oversized passform.', 'A soft, relaxed hoodie worked top-down with raglan increases, a roomy hood and a lightly oversized fit.',
  'En myk, avslappet hettegenser strikket ovenfra og ned med raglanøkninger, romslig hette og lett oversized passform.', 'A soft, relaxed hoodie worked top-down with raglan increases, a roomy hood and a lightly oversized fit.',
  'Krøll Demo', 'intermediate',
  array['sweater','hoodie']::text[],
  '[{"id":"size-xs","label":{"no":"XS","en":"XS"},"chestCm":98,"lengthCm":56,"sleeveLengthCm":45,"bodyBustMinCm":73,"bodyBustMaxCm":83},{"id":"size-s","label":{"no":"S","en":"S"},"chestCm":104,"lengthCm":57,"sleeveLengthCm":45,"bodyBustMinCm":79,"bodyBustMaxCm":89},{"id":"size-m","label":{"no":"M","en":"M"},"chestCm":110,"lengthCm":59,"sleeveLengthCm":46,"bodyBustMinCm":85,"bodyBustMaxCm":95},{"id":"size-l","label":{"no":"L","en":"L"},"chestCm":116,"lengthCm":61,"sleeveLengthCm":46,"bodyBustMinCm":91,"bodyBustMaxCm":101},{"id":"size-xl","label":{"no":"XL","en":"XL"},"chestCm":124,"lengthCm":63,"sleeveLengthCm":47,"bodyBustMinCm":99,"bodyBustMaxCm":109},{"id":"size-2xl","label":{"no":"2XL","en":"2XL"},"chestCm":134,"lengthCm":65,"sleeveLengthCm":47,"bodyBustMinCm":109,"bodyBustMaxCm":119},{"id":"size-3xl","label":{"no":"3XL","en":"3XL"},"chestCm":144,"lengthCm":67,"sleeveLengthCm":48,"bodyBustMinCm":119,"bodyBustMaxCm":129}]'::jsonb,
  '[{"id":"yarn-1","label":{"no":"Bulky / heavy worsted","en":"Bulky / heavy worsted"},"brand":"Valgfritt merke","weight":"bulky","gramsBySize":[700,750,850,900,1000,1100,1250],"gramsPerSkein":100,"metresPerSkein":125,"metresBySize":[875,938,1063,1125,1250,1375,1563],"metresMin":875,"heldTogetherGroupId":null,"substituteNote":{"no":"Annet garn som treffer 16 m / 10 cm etter vask.","en":"Any yarn that meets 16 sts / 10 cm after washing."},"notions":{"no":"Valgfri snor. To små maljer eller sydde knappehull til snor.","en":"Optional drawstring. Two small eyelets or sewn buttonholes."},"gramsMin":700,"gramsMax":1250,"metresMax":1563}]'::jsonb,
  '[{"mm":5,"notes":{"no":"Rundpinne 40 og 80 cm; strømpepinner/magic loop til ermer","en":"Circular 40 and 80 cm; DPNs or magic loop for cuffs"}},{"mm":5.5,"notes":{"no":"Rundpinne 40 og 80/100 cm","en":"Circular 40 and 80/100 cm"}}]'::jsonb,
  15, 25,
  array[5,5.5]::numeric[],
  16, 22, 10,
  '[{"no":"Vrangbord","en":"Ribbing"},{"no":"Glattstrikk","en":"Stockinette"},{"no":"Raglanøkninger","en":"Raglan increases"},{"no":"Tyske vendepinner","en":"German short rows"},{"no":"Plukke opp masker","en":"Picking up stitches"},{"no":"Strikk rundt","en":"Knitting in the round"},{"no":"Kitchener / tre-pinners felling","en":"Kitchener or three-needle bind-off"}]'::jsonb,
  '[{"abbr":"r / k","meaning":{"no":"rett","en":"knit"}},{"abbr":"vr / p","meaning":{"no":"vrang","en":"purl"}},{"abbr":"M1R","meaning":{"no":"økning til høyre","en":"make one right"}},{"abbr":"M1L","meaning":{"no":"økning til venstre","en":"make one left"}},{"abbr":"BOR","meaning":{"no":"omgangens start","en":"beginning of round"}}]'::jsonb
)
on conflict (id) do nothing;

insert into public.knitting_patterns (
  id, slug, status, demo_pattern, price_nok, title_no, title_en, tagline_no, tagline_en,
  description_no, description_en, designer, difficulty, categories,
  sizes, yarn_requirements, needles, recommended_ease_min_cm, recommended_ease_max_cm,
  needle_mm, gauge_stitches, gauge_rows, gauge_per_cm, techniques, abbreviations
) values (
  'pat-stripelue', 'stripelue', 'published', true, 0,
  'Stripelue', 'Stripelue',
  'En enkel, tettsittende stripelue som passer perfekt til små garnrester.', 'A simple, close-fitting striped hat — perfect for leftover yarn.',
  'En enkel, tettsittende stripelue som passer perfekt til små garnrester.', 'A simple, close-fitting striped hat — perfect for leftover yarn.',
  'Krøll Demo', 'easy',
  array['hat','accessories']::text[],
  '[{"id":"size-barn","label":{"no":"Barn","en":"Child"},"headCircumferenceMinCm":48,"headCircumferenceMaxCm":52,"finishedCircumferenceCm":42},{"id":"size-voksen-sm","label":{"no":"Voksen S/M","en":"Adult S/M"},"headCircumferenceMinCm":52,"headCircumferenceMaxCm":57,"finishedCircumferenceCm":46},{"id":"size-voksen-l","label":{"no":"Voksen L","en":"Adult L"},"headCircumferenceMinCm":57,"headCircumferenceMaxCm":61,"finishedCircumferenceCm":50}]'::jsonb,
  '[{"id":"yarn-main","label":{"no":"Hovedfarge DK","en":"Main colour DK"},"brand":"Valgfritt","weight":"dk","gramsBySize":[50,65,80],"gramsPerSkein":50,"metresPerSkein":115,"metresBySize":[115,150,184],"metresMin":115,"heldTogetherGroupId":null,"gramsMin":50,"gramsMax":80,"metresMax":184},{"id":"yarn-contrast","label":{"no":"Kontrastfarger (rester)","en":"Contrast colours (leftovers)"},"brand":"Valgfritt","weight":"dk","gramsBySize":[25,30,40],"gramsPerSkein":50,"metresPerSkein":115,"metresBySize":[57,69,92],"metresMin":57,"heldTogetherGroupId":null,"substituteNote":{"no":"Flere farger kan deles på totalvekten.","en":"Several colours may share the total weight."},"gramsMin":25,"gramsMax":40,"metresMax":92}]'::jsonb,
  '[{"mm":3.5,"notes":{"no":"Rundpinne","en":"Circular needle"}},{"mm":4,"notes":{"no":"Rundpinne / strømpepinner","en":"Circular / DPNs"}}]'::jsonb,
  null, null,
  array[3.5,4]::numeric[],
  22, 30, 10,
  '[{"no":"Vrangbord","en":"Ribbing"},{"no":"Glattstrikk","en":"Stockinette"},{"no":"Striper","en":"Stripes"},{"no":"Felling i toppen","en":"Crown decreases"}]'::jsonb,
  '[{"abbr":"r / k","meaning":{"no":"rett","en":"knit"}},{"abbr":"vr / p","meaning":{"no":"vrang","en":"purl"}}]'::jsonb
)
on conflict (id) do nothing;

insert into public.knitting_patterns (
  id, slug, status, demo_pattern, price_nok, title_no, title_en, tagline_no, tagline_en,
  description_no, description_en, designer, difficulty, categories,
  sizes, yarn_requirements, needles, recommended_ease_min_cm, recommended_ease_max_cm,
  needle_mm, gauge_stitches, gauge_rows, gauge_per_cm, techniques, abbreviations
) values (
  'pat-tabi-mittens', 'tabi-mittens', 'published', true, 0,
  'Tabi Mittens', 'Tabi Mittens',
  'Votter med et grafisk tabi-inspirert uttrykk og delt topp.', 'Mittens with a graphic tabi-inspired look and a split top.',
  'Votter med et grafisk tabi-inspirert uttrykk og delt topp.', 'Mittens with a graphic tabi-inspired look and a split top.',
  'Krøll Demo', 'intermediate',
  array['mittens','accessories']::text[],
  '[{"id":"size-s","label":{"no":"S","en":"S"},"handCircumferenceCm":17},{"id":"size-m","label":{"no":"M","en":"M"},"handCircumferenceCm":19},{"id":"size-l","label":{"no":"L","en":"L"},"handCircumferenceCm":21}]'::jsonb,
  '[{"id":"yarn-1","label":{"no":"DK-garn","en":"DK yarn"},"brand":"Valgfritt","weight":"dk","gramsBySize":[55,65,75],"gramsPerSkein":50,"metresPerSkein":115,"metresBySize":[126,150,173],"metresMin":126,"heldTogetherGroupId":null,"gramsMin":55,"gramsMax":75,"metresMax":173}]'::jsonb,
  '[{"mm":3,"notes":{"no":"Til mansjett","en":"For cuff"}},{"mm":3.5,"notes":{"no":"Til hånd","en":"For hand"}}]'::jsonb,
  null, null,
  array[3,3.5]::numeric[],
  24, 32, 10,
  '[{"no":"Vrangbord","en":"Ribbing"},{"no":"Glattstrikk","en":"Stockinette"},{"no":"Tommelkile","en":"Thumb gusset"},{"no":"Tabi-splitt","en":"Tabi split"},{"no":"Kitchener","en":"Kitchener stitch"}]'::jsonb,
  '[{"abbr":"r / k","meaning":{"no":"rett","en":"knit"}},{"abbr":"vr / p","meaning":{"no":"vrang","en":"purl"}}]'::jsonb
)
on conflict (id) do nothing;

insert into public.knitting_patterns (
  id, slug, status, demo_pattern, price_nok, title_no, title_en, tagline_no, tagline_en,
  description_no, description_en, designer, difficulty, categories,
  sizes, yarn_requirements, needles, recommended_ease_min_cm, recommended_ease_max_cm,
  needle_mm, gauge_stitches, gauge_rows, gauge_per_cm, techniques, abbreviations
) values (
  'pat-tabi-tofler', 'tabi-tofler', 'published', true, 0,
  'Tabi Tøfler', 'Tabi Tøfler',
  'Myke strikketøfler med tydelig tabi-splitt foran.', 'Soft knit slippers with a clear tabi split at the toe.',
  'Myke strikketøfler med tydelig tabi-splitt foran.', 'Soft knit slippers with a clear tabi split at the toe.',
  'Krøll Demo', 'intermediate',
  array['slippers','accessories']::text[],
  '[{"id":"size-36-37","label":{"no":"EU 36–37","en":"EU 36–37"},"footLengthCm":23},{"id":"size-38-39","label":{"no":"EU 38–39","en":"EU 38–39"},"footLengthCm":24.5},{"id":"size-40-41","label":{"no":"EU 40–41","en":"EU 40–41"},"footLengthCm":26},{"id":"size-42-43","label":{"no":"EU 42–43","en":"EU 42–43"},"footLengthCm":27.5}]'::jsonb,
  '[{"id":"yarn-1","label":{"no":"Worsted-garn","en":"Worsted yarn"},"brand":"Valgfritt","weight":"worsted","gramsBySize":[100,110,125,140],"gramsPerSkein":100,"metresPerSkein":180,"metresBySize":[180,198,225,252],"metresMin":180,"heldTogetherGroupId":null,"notions":{"no":"Valgfritt: antiskli under sålen","en":"Optional: sock stop / anti-slip for sole"},"gramsMin":100,"gramsMax":140,"metresMax":252}]'::jsonb,
  '[{"mm":4,"notes":{"no":"Mindre pinne","en":"Smaller needle"}},{"mm":4.5,"notes":{"no":"Større pinne","en":"Larger needle"}}]'::jsonb,
  null, null,
  array[4,4.5]::numeric[],
  18, 26, 10,
  '[{"no":"Hæl","en":"Heel"},{"no":"Vendepinner","en":"Short rows"},{"no":"Tabi-tå","en":"Tabi toe"},{"no":"Kitchener","en":"Kitchener stitch"}]'::jsonb,
  '[{"abbr":"r / k","meaning":{"no":"rett","en":"knit"}},{"abbr":"vr / p","meaning":{"no":"vrang","en":"purl"}}]'::jsonb
)
on conflict (id) do nothing;

insert into public.knitting_patterns (
  id, slug, status, demo_pattern, price_nok, title_no, title_en, tagline_no, tagline_en,
  description_no, description_en, designer, difficulty, categories,
  sizes, yarn_requirements, needles, recommended_ease_min_cm, recommended_ease_max_cm,
  needle_mm, gauge_stitches, gauge_rows, gauge_per_cm, techniques, abbreviations
) values (
  'pat-capsvarmeren', 'capsvarmeren', 'published', true, 0,
  'Capsvarmeren', 'Capsvarmeren',
  'Et pannebånd med formede øreflipper, laget for å brukes over eller sammen med caps.', 'An ear-warmer band with shaped ear flaps, made to wear with a cap.',
  'Et pannebånd med formede øreflipper, laget for å brukes over eller sammen med caps.', 'An ear-warmer band with shaped ear flaps, made to wear with a cap.',
  'Krøll Demo', 'easy',
  array['accessories','ear-warmer']::text[],
  '[{"id":"size-s","label":{"no":"S","en":"S"},"headCircumferenceMinCm":52,"headCircumferenceMaxCm":54,"finishedCircumferenceCm":50},{"id":"size-m","label":{"no":"M","en":"M"},"headCircumferenceMinCm":55,"headCircumferenceMaxCm":57,"finishedCircumferenceCm":53},{"id":"size-l","label":{"no":"L","en":"L"},"headCircumferenceMinCm":58,"headCircumferenceMaxCm":60,"finishedCircumferenceCm":56}]'::jsonb,
  '[{"id":"yarn-1","label":{"no":"DK-garn","en":"DK yarn"},"brand":"Valgfritt","weight":"dk","gramsBySize":[45,50,60],"gramsPerSkein":50,"metresPerSkein":115,"metresBySize":[103,115,138],"metresMin":103,"heldTogetherGroupId":null,"gramsMin":45,"gramsMax":60,"metresMax":138}]'::jsonb,
  '[{"mm":3.5,"notes":{"no":"Mindre pinne","en":"Smaller needle"}},{"mm":4,"notes":{"no":"Større pinne","en":"Larger needle"}}]'::jsonb,
  null, null,
  array[3.5,4]::numeric[],
  20, 28, 10,
  '[{"no":"Vrangbord / dobbelstrikk","en":"Rib or double knitting"},{"no":"Øreflippeforming","en":"Ear flap shaping"},{"no":"Madrassøm / grafting","en":"Mattress stitch or grafting"}]'::jsonb,
  '[{"abbr":"r / k","meaning":{"no":"rett","en":"knit"}},{"abbr":"vr / p","meaning":{"no":"vrang","en":"purl"}}]'::jsonb
)
on conflict (id) do nothing;

insert into public.knitting_patterns (
  id, slug, status, demo_pattern, price_nok, title_no, title_en, tagline_no, tagline_en,
  description_no, description_en, designer, difficulty, categories,
  sizes, yarn_requirements, needles, recommended_ease_min_cm, recommended_ease_max_cm,
  needle_mm, gauge_stitches, gauge_rows, gauge_per_cm, techniques, abbreviations
) values (
  'pat-hverdagsgenseren', 'hverdagsgenseren', 'published', true, 0,
  'Hverdagsgenseren', 'Hverdagsgenseren',
  'En klassisk raglangenser med rund hals og avslappet passform.', 'A classic raglan sweater with a round neck and relaxed fit.',
  'En klassisk raglangenser med rund hals og avslappet passform.', 'A classic raglan sweater with a round neck and relaxed fit.',
  'Krøll Demo', 'intermediate',
  array['sweater']::text[],
  '[{"id":"size-xs","label":{"no":"XS","en":"XS"},"chestCm":92,"lengthCm":54,"sleeveLengthCm":44,"bodyBustMinCm":74,"bodyBustMaxCm":82},{"id":"size-s","label":{"no":"S","en":"S"},"chestCm":98,"lengthCm":55,"sleeveLengthCm":44,"bodyBustMinCm":80,"bodyBustMaxCm":88},{"id":"size-m","label":{"no":"M","en":"M"},"chestCm":104,"lengthCm":57,"sleeveLengthCm":45,"bodyBustMinCm":86,"bodyBustMaxCm":94},{"id":"size-l","label":{"no":"L","en":"L"},"chestCm":112,"lengthCm":59,"sleeveLengthCm":45,"bodyBustMinCm":94,"bodyBustMaxCm":102},{"id":"size-xl","label":{"no":"XL","en":"XL"},"chestCm":120,"lengthCm":61,"sleeveLengthCm":46,"bodyBustMinCm":102,"bodyBustMaxCm":110},{"id":"size-2xl","label":{"no":"2XL","en":"2XL"},"chestCm":130,"lengthCm":63,"sleeveLengthCm":46,"bodyBustMinCm":112,"bodyBustMaxCm":120},{"id":"size-3xl","label":{"no":"3XL","en":"3XL"},"chestCm":140,"lengthCm":65,"sleeveLengthCm":47,"bodyBustMinCm":122,"bodyBustMaxCm":130}]'::jsonb,
  '[{"id":"yarn-1","label":{"no":"DK-garn","en":"DK yarn"},"brand":"Valgfritt","weight":"dk","gramsBySize":[400,450,500,550,600,700,750],"gramsPerSkein":50,"metresPerSkein":115,"metresBySize":[920,1035,1150,1265,1380,1610,1725],"metresMin":920,"heldTogetherGroupId":null,"gramsMin":400,"gramsMax":750,"metresMax":1725}]'::jsonb,
  '[{"mm":3.5,"notes":{"no":"Til vrangbord","en":"For ribbing"}},{"mm":4,"notes":{"no":"Til glattstrikk","en":"For stockinette"}}]'::jsonb,
  10, 18,
  array[3.5,4]::numeric[],
  20, 28, 10,
  '[{"no":"Raglan ovenfra","en":"Top-down raglan"},{"no":"Tyske vendepinner","en":"German short rows"},{"no":"Vrangbord","en":"Ribbing"}]'::jsonb,
  '[{"abbr":"r / k","meaning":{"no":"rett","en":"knit"}},{"abbr":"vr / p","meaning":{"no":"vrang","en":"purl"}}]'::jsonb
)
on conflict (id) do nothing;

insert into public.knitting_patterns (
  id, slug, status, demo_pattern, price_nok, title_no, title_en, tagline_no, tagline_en,
  description_no, description_en, designer, difficulty, categories,
  sizes, yarn_requirements, needles, recommended_ease_min_cm, recommended_ease_max_cm,
  needle_mm, gauge_stitches, gauge_rows, gauge_per_cm, techniques, abbreviations
) values (
  'pat-sidekick-jakke', 'sidekick-jakke', 'published', true, 0,
  'Sidekick Jakke', 'Sidekick Jakke',
  'En høyhalset strikkejakke med asymmetrisk lukking på siden av halsen.', 'A high-neck knit jacket with an asymmetric closure at the side of the neck.',
  'En høyhalset strikkejakke med asymmetrisk lukking på siden av halsen.', 'A high-neck knit jacket with an asymmetric closure at the side of the neck.',
  'Krøll Demo', 'advanced',
  array['jacket','cardigan']::text[],
  '[{"id":"size-xs","label":{"no":"XS","en":"XS"},"chestCm":94,"lengthCm":55,"bodyBustMinCm":78,"bodyBustMaxCm":86},{"id":"size-s","label":{"no":"S","en":"S"},"chestCm":100,"lengthCm":56,"bodyBustMinCm":84,"bodyBustMaxCm":92},{"id":"size-m","label":{"no":"M","en":"M"},"chestCm":106,"lengthCm":58,"bodyBustMinCm":90,"bodyBustMaxCm":98},{"id":"size-l","label":{"no":"L","en":"L"},"chestCm":114,"lengthCm":60,"bodyBustMinCm":98,"bodyBustMaxCm":106},{"id":"size-xl","label":{"no":"XL","en":"XL"},"chestCm":122,"lengthCm":62,"bodyBustMinCm":106,"bodyBustMaxCm":114},{"id":"size-2xl","label":{"no":"2XL","en":"2XL"},"chestCm":132,"lengthCm":64,"bodyBustMinCm":116,"bodyBustMaxCm":124},{"id":"size-3xl","label":{"no":"3XL","en":"3XL"},"chestCm":142,"lengthCm":66,"bodyBustMinCm":126,"bodyBustMaxCm":134}]'::jsonb,
  '[{"id":"yarn-1","label":{"no":"Worsted-garn","en":"Worsted yarn"},"brand":"Valgfritt","weight":"worsted","gramsBySize":[550,600,650,700,800,850,950],"gramsPerSkein":100,"metresPerSkein":180,"metresBySize":[990,1080,1170,1260,1440,1530,1710],"metresMin":990,"heldTogetherGroupId":null,"notions":{"no":"4–6 knapper ELLER én glidelås 18–22 cm","en":"4–6 buttons OR one 18–22 cm zipper"},"gramsMin":550,"gramsMax":950,"metresMax":1710}]'::jsonb,
  '[{"mm":4,"notes":{"no":"Mindre pinne","en":"Smaller needle"}},{"mm":4.5,"notes":{"no":"Større pinne","en":"Larger needle"}}]'::jsonb,
  8, 16,
  array[4,4.5]::numeric[],
  18, 26, 10,
  '[{"no":"Høy hals","en":"High neck"},{"no":"Raglan","en":"Raglan"},{"no":"Asymmetrisk lukking","en":"Asymmetric closure"}]'::jsonb,
  '[{"abbr":"r / k","meaning":{"no":"rett","en":"knit"}},{"abbr":"vr / p","meaning":{"no":"vrang","en":"purl"}}]'::jsonb
)
on conflict (id) do nothing;

insert into public.knitting_patterns (
  id, slug, status, demo_pattern, price_nok, title_no, title_en, tagline_no, tagline_en,
  description_no, description_en, designer, difficulty, categories,
  sizes, yarn_requirements, needles, recommended_ease_min_cm, recommended_ease_max_cm,
  needle_mm, gauge_stitches, gauge_rows, gauge_per_cm, techniques, abbreviations
) values (
  'pat-nesten-polo', 'nesten-polo', 'published', true, 0,
  'Nesten Polo', 'Nesten Polo',
  'En rundhalset genser med kort knappestolpe foran – litt polo, bare uten kragen.', 'A crew-neck sweater with a short front button placket — a little polo, without the collar.',
  'En rundhalset genser med kort knappestolpe foran – litt polo, bare uten kragen.', 'A crew-neck sweater with a short front button placket — a little polo, without the collar.',
  'Krøll Demo', 'intermediate',
  array['sweater']::text[],
  '[{"id":"size-xs","label":{"no":"XS","en":"XS"},"chestCm":94,"lengthCm":53,"bodyBustMinCm":76,"bodyBustMaxCm":84},{"id":"size-s","label":{"no":"S","en":"S"},"chestCm":100,"lengthCm":55,"bodyBustMinCm":82,"bodyBustMaxCm":90},{"id":"size-m","label":{"no":"M","en":"M"},"chestCm":106,"lengthCm":57,"bodyBustMinCm":88,"bodyBustMaxCm":96},{"id":"size-l","label":{"no":"L","en":"L"},"chestCm":114,"lengthCm":59,"bodyBustMinCm":96,"bodyBustMaxCm":104},{"id":"size-xl","label":{"no":"XL","en":"XL"},"chestCm":122,"lengthCm":61,"bodyBustMinCm":104,"bodyBustMaxCm":112},{"id":"size-2xl","label":{"no":"2XL","en":"2XL"},"chestCm":132,"lengthCm":63,"bodyBustMinCm":114,"bodyBustMaxCm":122},{"id":"size-3xl","label":{"no":"3XL","en":"3XL"},"chestCm":142,"lengthCm":65,"bodyBustMinCm":124,"bodyBustMaxCm":132}]'::jsonb,
  '[{"id":"yarn-dk","label":{"no":"DK-ull","en":"DK wool"},"brand":"Valgfritt","weight":"dk","gramsBySize":[300,350,400,450,500,550,600],"gramsPerSkein":50,"metresPerSkein":115,"metresBySize":[690,805,920,1035,1150,1265,1380],"metresMin":690,"heldTogetherGroupId":"held-nesten","gramsMin":300,"gramsMax":600,"metresMax":1380},{"id":"yarn-mohair","label":{"no":"Bløt lace-mohair","en":"Soft lace mohair"},"brand":"Valgfritt","weight":"lace","gramsBySize":[50,50,50,75,75,75,100],"gramsPerSkein":25,"metresPerSkein":210,"metresBySize":[420,420,420,630,630,630,840],"metresMin":420,"heldTogetherGroupId":"held-nesten","substituteNote":{"no":"Annet luftig lace-garn med lignende m/g.","en":"Another airy lace yarn with similar m/g."},"gramsMin":50,"gramsMax":100,"metresMax":840}]'::jsonb,
  '[{"mm":3.5,"notes":{"no":"Til vrangbord","en":"For ribbing"}},{"mm":4,"notes":{"no":"Til glattstrikk (holdt sammen)","en":"For stockinette (held together)"}}]'::jsonb,
  10, 18,
  array[3.5,4]::numeric[],
  20, 28, 10,
  '[{"no":"Raglan","en":"Raglan"},{"no":"Knappestolpe","en":"Button placket"},{"no":"To tråder holdt sammen","en":"Two yarns held together"}]'::jsonb,
  '[{"abbr":"r / k","meaning":{"no":"rett","en":"knit"}},{"abbr":"vr / p","meaning":{"no":"vrang","en":"purl"}}]'::jsonb
)
on conflict (id) do nothing;

insert into public.knitting_patterns (
  id, slug, status, demo_pattern, price_nok, title_no, title_en, tagline_no, tagline_en,
  description_no, description_en, designer, difficulty, categories,
  sizes, yarn_requirements, needles, recommended_ease_min_cm, recommended_ease_max_cm,
  needle_mm, gauge_stitches, gauge_rows, gauge_per_cm, techniques, abbreviations
) values (
  'pat-knapp-cardigan', 'knapp-cardigan', 'published', true, 0,
  'Knapp Cardigan', 'Knapp Cardigan',
  'En enkel cardigan hvor knappene får være en viktig del av uttrykket.', 'A simple cardigan where the buttons are an important part of the look.',
  'En enkel cardigan hvor knappene får være en viktig del av uttrykket.', 'A simple cardigan where the buttons are an important part of the look.',
  'Krøll Demo', 'intermediate',
  array['cardigan']::text[],
  '[{"id":"size-xs","label":{"no":"XS","en":"XS"},"chestCm":92,"lengthCm":50,"bodyBustMinCm":76,"bodyBustMaxCm":84},{"id":"size-s","label":{"no":"S","en":"S"},"chestCm":98,"lengthCm":52,"bodyBustMinCm":82,"bodyBustMaxCm":90},{"id":"size-m","label":{"no":"M","en":"M"},"chestCm":104,"lengthCm":54,"bodyBustMinCm":88,"bodyBustMaxCm":96},{"id":"size-l","label":{"no":"L","en":"L"},"chestCm":112,"lengthCm":56,"bodyBustMinCm":96,"bodyBustMaxCm":104},{"id":"size-xl","label":{"no":"XL","en":"XL"},"chestCm":120,"lengthCm":58,"bodyBustMinCm":104,"bodyBustMaxCm":112},{"id":"size-2xl","label":{"no":"2XL","en":"2XL"},"chestCm":130,"lengthCm":60,"bodyBustMinCm":114,"bodyBustMaxCm":122},{"id":"size-3xl","label":{"no":"3XL","en":"3XL"},"chestCm":140,"lengthCm":62,"bodyBustMinCm":124,"bodyBustMaxCm":132}]'::jsonb,
  '[{"id":"yarn-1","label":{"no":"Sport / lett DK","en":"Sport / light DK"},"brand":"Valgfritt","weight":"sport","gramsBySize":[300,350,375,400,450,500,550],"gramsPerSkein":50,"metresPerSkein":150,"metresBySize":[900,1050,1125,1200,1350,1500,1650],"metresMin":900,"heldTogetherGroupId":null,"notions":{"no":"5–7 dekorative knapper","en":"5–7 decorative buttons"},"gramsMin":300,"gramsMax":550,"metresMax":1650}]'::jsonb,
  '[{"mm":3,"notes":{"no":"Mindre pinne","en":"Smaller needle"}},{"mm":3.5,"notes":{"no":"Større pinne","en":"Larger needle"}}]'::jsonb,
  8, 16,
  array[3,3.5]::numeric[],
  22, 30, 10,
  '[{"no":"Cardigan ovenfra","en":"Top-down cardigan"},{"no":"Raglan","en":"Raglan"},{"no":"Knappestolper","en":"Button bands"}]'::jsonb,
  '[{"abbr":"r / k","meaning":{"no":"rett","en":"knit"}},{"abbr":"vr / p","meaning":{"no":"vrang","en":"purl"}}]'::jsonb
)
on conflict (id) do nothing;

-- Sections: insert missing only. Never delete demo sections (Admin may have edited).

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-lokke-hoodie-sec-overview-1', 'pat-lokke-hoodie', 'overview', 1,
  'Oversikt', 'Overview',
  'En myk, avslappet hettegenser strikket ovenfra og ned med raglanøkninger, romslig hette og lett oversized passform.', 'A soft, relaxed hoodie worked top-down with raglan increases, a roomy hood and lightly oversized fit.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-lokke-hoodie-sec-construction-2', 'pat-lokke-hoodie', 'construction', 2,
  'Konstruksjon', 'Construction',
  'Strikkes ovenfra og ned. Først strikkes hals og bærestykke frem og tilbake for å forme halsåpningen. Arbeidet samles deretter til rundstrikk. Raglanøkninger former bærestykket. Ermemaskene settes på vent mens bolen strikkes ferdig. Ermene strikkes rundt til slutt. Hetten plukkes opp rundt halsen.', 'Worked top-down. Neck and yoke are worked flat to shape the neckline, then joined in the round. Raglan increases shape the yoke. Sleeve stitches rest while the body is finished. Sleeves are worked in the round last. The hood is picked up around the neck.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-lokke-hoodie-sec-size_guide-3', 'pat-lokke-hoodie', 'size_guide', 3,
  'Størrelsesguide', 'Size guide',
  'Velg størrelse ut fra egen brystvidde + ønsket bevegelsesvidde (ca. 15–25 cm). Se tabellen for kroppsmål per størrelse og ferdig plaggmål. Strikkefasthet påvirker passform — sjekk alltid etter vask.', 'Choose size from your bust plus desired ease (about 15–25 cm). See the table for body range per size and finished garment measurements. Gauge affects fit — always check after washing.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-lokke-hoodie-sec-gauge-4', 'pat-lokke-hoodie', 'gauge', 4,
  'Strikkefasthet', 'Gauge',
  '16 masker × 22 rader = 10 × 10 cm i glattstrikk på 5,5 mm etter vask.', '16 sts × 22 rows = 10 × 10 cm in stockinette on 5.5 mm after washing.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-lokke-hoodie-sec-needles-5', 'pat-lokke-hoodie', 'needles', 5,
  'Pinner', 'Needles',
  '5 mm rundpinne, 40 og 80 cm.
5,5 mm rundpinne, 40 og 80/100 cm.
5 mm strømpepinner eller magic loop til ermer.', '5 mm circular, 40 and 80 cm.
5.5 mm circular, 40 and 80/100 cm.
5 mm DPNs or magic loop for cuffs.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-lokke-hoodie-sec-materials-6', 'pat-lokke-hoodie', 'materials', 6,
  'Materialer', 'Materials',
  'Ca. 700 (750) 850 (900) 1000 (1100) 1250 g bulky / heavy worsted som treffer fastheten (nøste ca. 100 g / 125 m). Valgfri snor. To små maljer eller sydde knappehull.', 'Approx. 700 (750) 850 (900) 1000 (1100) 1250 g bulky / heavy worsted giving gauge (skein ~100 g / 125 m). Optional drawstring and eyelets.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-lokke-hoodie-sec-before_you_begin-7', 'pat-lokke-hoodie', 'before_you_begin', 7,
  'Før du begynner', 'Before you begin',
  'Les hele oppskriften. Sjekk strikkefasthet etter vask. Marker fire raglanlinjer.', 'Read the whole pattern. Check gauge after washing. Place markers for four raglan lines.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-lokke-hoodie-sec-neck-8', 'pat-lokke-hoodie', 'neck', 8,
  'Hals', 'Neck',
  'Legg opp 76 (80) 84 (88) 92 (96) 100 m på 5 mm. Strikk 1×1 vrangbord i 4 cm. Bytt til 5,5 mm.', 'Cast on 76 (80) 84 (88) 92 (96) 100 sts on 5 mm. Work 1×1 rib for 4 cm. Change to 5.5 mm.',
  20
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-lokke-hoodie-sec-stitch_distribution-9', 'pat-lokke-hoodie', 'stitch_distribution', 9,
  'Maskefordeling', 'Stitch distribution',
  'Foran: 22 (24) 26 (28) 30 (32) 34 m
Erme: 10 m
Bak: 24 (24) 24 (24) 24 (24) 24 m
Erme: 10 m
Resterende masker danner raglanmasker / kantfordeling.', 'Front: 22 (24) 26 (28) 30 (32) 34 sts
Sleeve: 10 sts
Back: 24 sts all sizes
Sleeve: 10 sts
Remaining stitches form raglan / edge distribution.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-lokke-hoodie-sec-short_rows-10', 'pat-lokke-hoodie', 'short_rows', 10,
  'Vendepinner', 'Short rows',
  'Tyske vendepinner over bakre hals: Strikk til 4 m forbi første ermemarkør, snu. Vrang til 4 m forbi motsatt ermemarkør, snu. Fortsett med 4 m lenger hver gang — totalt 4 snu på hver side.', 'German short rows across the back neck: knit to 4 sts past first sleeve marker, turn. Purl to 4 sts past opposite sleeve marker, turn. Continue 4 sts farther each time for 4 turns each side.',
  16
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-lokke-hoodie-sec-raglan-11', 'pat-lokke-hoodie', 'raglan', 11,
  'Raglanøkninger', 'Raglan increases',
  'Øk én maske på hver side av hver raglanmarkør annenhver omgang (8 m per økeomgang). Fortsett til bærestykket måler ca. 22 (23) 24 (25) 26 (27) 28 cm og du har ca. 248 (264) 280 (296) 316 (340) 364 m. Del bol og ermer.', 'Increase one stitch each side of each raglan marker every second round (8 sts per increase round). Continue until yoke is approx. 22–28 cm and you have approx. 248–364 sts. Separate body and sleeves.',
  60
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-lokke-hoodie-sec-body-12', 'pat-lokke-hoodie', 'body', 12,
  'Bol', 'Body',
  'Sett ermemasker på hjelpegarn: 52 (56) 60 (64) 68 (74) 80 m per erme. Legg opp 8 (8) 10 (10) 12 (12) 14 m under hvert erme. Fortsett glattstrikk rundt til bolen måler ca. 50 (51) 53 (55) 57 (59) 61 cm fra skulder. Bytt til 5 mm. 1×1 vrangbord 6 cm. Fell elastisk.', 'Place sleeve sts on waste yarn. Cast on underarm sts. Work stockinette in the round to approx. 50–61 cm from shoulder. Change to 5 mm; 1×1 rib 6 cm; bind off elastically.',
  80
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-lokke-hoodie-sec-sleeves-13', 'pat-lokke-hoodie', 'sleeves', 13,
  'Ermer', 'Sleeves',
  'Sett ermemasker på 5,5 mm. Plukk opp undermermasker. Glattstrikk. Minn 2 m ca. hver 8. omgang til ønsket mansjettomkrets. Fortsett til ermet måler 39 (39) 40 (40) 41 (41) 42 cm fra underarm. Bytt til 5 mm. 1×1 vrangbord 6 cm. Fell elastisk.', 'Work sleeves in stockinette on 5.5 mm. Decrease 2 sts about every 8th round. Continue to 39–42 cm from underarm. Rib 6 cm on 5 mm; bind off elastically.',
  70
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-lokke-hoodie-sec-hood-14', 'pat-lokke-hoodie', 'hood', 14,
  'Hette', 'Hood',
  'Plukk opp ca. 92–104 m rundt halsen. Strikk frem og tilbake i glattstrikk. Øk gradvis midt bak de første 8–10 cm. Fortsett til hetten måler ca. 34–36 cm. Del maskene jevnt og lukk toppen med Kitchener eller tre-pinners felling. Valgfritt: foldet kant til snor.', 'Pick up approx. 92–104 sts around neckline. Work flat in stockinette; increase at centre back for volume. Continue to 34–36 cm. Join top with Kitchener or three-needle bind-off.',
  50
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-lokke-hoodie-sec-finishing-15', 'pat-lokke-hoodie', 'finishing', 15,
  'Avslutning', 'Finishing',
  'Fest alle tråder. Vask forsiktig og blokk til mål.', 'Weave in ends. Gently wash and block to measurements.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-stripelue-sec-overview-1', 'pat-stripelue', 'overview', 1,
  'Oversikt', 'Overview',
  'En enkel, tettsittende stripelue som passer perfekt til små garnrester.', 'A simple close-fitting striped hat for leftovers.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-stripelue-sec-construction-2', 'pat-stripelue', 'construction', 2,
  'Konstruksjon', 'Construction',
  'Strikkes nedenfra og opp i det runde.', 'Worked bottom-up in the round.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-stripelue-sec-size_guide-3', 'pat-stripelue', 'size_guide', 3,
  'Størrelsesguide', 'Size guide',
  'Velg etter hodeomkrets. Ferdig lueomkrets skal sitte med litt negativ ease. Mål hodet og sammenlign med tabellen.', 'Choose by head circumference. Finished hat circumference should have a little negative ease. Measure the head and compare with the table.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-stripelue-sec-materials-4', 'pat-stripelue', 'materials', 4,
  'Materialer', 'Materials',
  'Hovedfarge: ca. 50 (65) 80 g DK.
Kontrast: ca. 25 (30) 40 g DK (rester OK).', 'Main: approx. 50 (65) 80 g DK.
Contrast: approx. 25 (30) 40 g DK (leftovers OK).',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-stripelue-sec-cast_on-5', 'pat-stripelue', 'cast_on', 5,
  'Opplegging', 'Cast-on',
  'Legg opp 92 (100) 108 m på 3,5 mm. Strikk 1×1 vrangbord i 5 cm. Bytt til 4 mm.', 'Cast on 92 (100) 108 sts on 3.5 mm. Work 1×1 rib for 5 cm. Change to 4 mm.',
  24
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-stripelue-sec-stripes-6', 'pat-stripelue', 'stripes', 6,
  'Striper', 'Stripes',
  'Strikk glattstrikk og bytt farge hver 4.–10. omgang etter ønske. Fortsett til arbeidet måler 17 (19) 21 cm.', 'Work stockinette, changing colour every 4–10 rounds as desired. Continue until piece measures 17 (19) 21 cm.',
  40
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-stripelue-sec-crown-7', 'pat-stripelue', 'crown', 7,
  'Topp', 'Crown',
  'Sett 4 markører jevnt rundt. Fell før og etter hver markør annenhver omgang. Når 12–16 m gjenstår: klipp garnet, trekk gjennom maskene og stram.', 'Place 4 markers equally. Decrease before and after each marker every second round. When 12–16 sts remain, draw yarn through and pull tight.',
  24
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-stripelue-sec-finishing-8', 'pat-stripelue', 'finishing', 8,
  'Avslutning', 'Finishing',
  'Fest alle tråder. Vask og blokk lett.', 'Weave in ends. Wash and lightly block.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-mittens-sec-overview-1', 'pat-tabi-mittens', 'overview', 1,
  'Oversikt', 'Overview',
  'Votter med et grafisk tabi-inspirert uttrykk og delt topp.', 'Mittens with a graphic tabi-inspired look and split top.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-mittens-sec-construction-2', 'pat-tabi-mittens', 'construction', 2,
  'Konstruksjon', 'Construction',
  'Strikkes fra mansjett og opp.', 'Worked from cuff upward.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-mittens-sec-size_guide-3', 'pat-tabi-mittens', 'size_guide', 3,
  'Størrelsesguide', 'Size guide',
  'Mål håndomkrets rundt knokene (uten tommel). Velg nærmeste størrelse. Negativ ease gir bedre passform.', 'Measure hand circumference around the knuckles (excluding thumb). Choose the nearest size. Negative ease improves fit.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-mittens-sec-materials-4', 'pat-tabi-mittens', 'materials', 4,
  'Materialer', 'Materials',
  'Ca. 55 (65) 75 g DK (nøste ca. 50 g / 115 m).', 'Approx. 55 (65) 75 g DK (skein ~50 g / 115 m).',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-mittens-sec-cuffs-5', 'pat-tabi-mittens', 'cuffs', 5,
  'Mansjett', 'Cuff',
  'Legg opp 40 (44) 48 m. Strikk 1×1 vrangbord i 7 cm. Bytt til 3,5 mm.', 'Cast on 40 (44) 48 sts. Work 1×1 rib for 7 cm. Change to 3.5 mm.',
  30
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-mittens-sec-hand-6', 'pat-tabi-mittens', 'hand', 6,
  'Hånd', 'Hand',
  'Strikk glattstrikk.', 'Work stockinette.',
  20
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-mittens-sec-thumb-7', 'pat-tabi-mittens', 'thumb', 7,
  'Tommelkile', 'Thumb gusset',
  'Øk 2 m hver tredje omgang rundt tommelmarkør til kilen har 11 (13) 15 m. Sett tommelmasker på hjelpegarn. Legg opp 2 m over åpningen. Fortsett til votten når fingerroten.', 'Increase 2 sts every third round until gusset has 11 (13) 15 sts. Place thumb sts on waste yarn. Cast on 2 sts above opening. Continue to base of fingers.',
  36
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-mittens-sec-toe-8', 'pat-tabi-mittens', 'toe', 8,
  'Tabi-splitt', 'Tabi split',
  'Del øvre håndmasker i to: ca. 1/3 til pekefingersiden og 2/3 til øvrige fingre. Strikk hver del separat rundt. Fell i begge sider nær toppen til 6–8 m. Lukk med Kitchener.', 'Divide upper hand into two sections (~1/3 index side, ~2/3 remaining). Work each in the round. Decrease at both sides until 6–8 sts; close with Kitchener.',
  28
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-mittens-sec-thumb-9', 'pat-tabi-mittens', 'thumb', 9,
  'Tommel', 'Thumb',
  'Sett tommelmasker tilbake. Plukk opp 2–4 m rundt åpningen. Strikk til tommelen er ca. 5 (5,5) 6 cm. Fell jevnt og lukk.', 'Return thumb sts. Pick up 2–4 sts. Work to approx. 5 (5.5) 6 cm. Decrease evenly and close.',
  20
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-mittens-sec-finishing-10', 'pat-tabi-mittens', 'finishing', 10,
  'Avslutning', 'Finishing',
  'Fest tråder. Blokk forsiktig.', 'Weave in ends. Block gently.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-tofler-sec-overview-1', 'pat-tabi-tofler', 'overview', 1,
  'Oversikt', 'Overview',
  'Myke strikketøfler med tydelig tabi-splitt foran.', 'Soft knit slippers with a clear tabi split.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-tofler-sec-construction-2', 'pat-tabi-tofler', 'construction', 2,
  'Konstruksjon', 'Construction',
  'Strikkes fra hæl mot tå.', 'Worked from heel toward toe.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-tofler-sec-size_guide-3', 'pat-tabi-tofler', 'size_guide', 3,
  'Størrelsesguide', 'Size guide',
  'Velg etter fotlengde (cm) eller EU-størrelse i tabellen. Tøfler skal sitte tett uten å stramme over vristen.', 'Choose by foot length (cm) or EU size in the table. Slippers should fit snugly without straining over the instep.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-tofler-sec-materials-4', 'pat-tabi-tofler', 'materials', 4,
  'Materialer', 'Materials',
  'Ca. 100 (110) 125 (140) g worsted (nøste ca. 100 g / 180 m).', 'Approx. 100 (110) 125 (140) g worsted (skein ~100 g / 180 m).',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-tofler-sec-heel-5', 'pat-tabi-tofler', 'heel', 5,
  'Hæl', 'Heel',
  'Legg opp 30 (32) 34 (36) m. Strikk frem og tilbake i riller eller glattstrikk ca. 5 cm.', 'Cast on 30 (32) 34 (36) sts. Work flat in garter or stockinette for approx. 5 cm.',
  20
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-tofler-sec-short_rows-6', 'pat-tabi-tofler', 'short_rows', 6,
  'Hælsnu', 'Heel turn',
  'Form hælen med vendepinner.', 'Use short rows to shape the heel.',
  12
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-tofler-sec-body-7', 'pat-tabi-tofler', 'body', 7,
  'Fot', 'Foot',
  'Plukk opp masker langs begge sider av hællappen. Samle til rundstrikk. Fell kilemasker til opprinnelig fotomkrets. Strikk til ca. 5 cm kortere enn total fotlengde.', 'Pick up along heel flap sides; join in the round. Decrease gusset to foot circumference. Work until ~5 cm shorter than foot length.',
  40
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-tofler-sec-toe-8', 'pat-tabi-tofler', 'toe', 8,
  'Tabi-tå', 'Tabi toe',
  'Del maskene i stortå-seksjon og øvrige tær. Strikk hver del separat. Fell gradvis i begge kanter til ca. 6 m. Lukk med Kitchener.', 'Divide into large-toe and remaining-toes sections. Work each separately; decrease to ~6 sts; Kitchener close.',
  24
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-tofler-sec-cuffs-9', 'pat-tabi-tofler', 'cuffs', 9,
  'Ankelkant', 'Ankle edge',
  'Plukk opp masker rundt åpningen ved behov. Strikk 2–3 cm vrangbord. Fell elastisk.', 'Pick up around opening if needed. Work 2–3 cm rib. Bind off elastically.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-tabi-tofler-sec-finishing-10', 'pat-tabi-tofler', 'finishing', 10,
  'Avslutning', 'Finishing',
  'Fest tråder. Blokk. Påfør valgfritt antiskli under sålen.', 'Weave in ends. Block. Apply optional anti-slip under sole.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-capsvarmeren-sec-overview-1', 'pat-capsvarmeren', 'overview', 1,
  'Oversikt', 'Overview',
  'Et pannebånd med formede øreflipper, laget for å brukes over eller sammen med caps.', 'An ear-warmer with shaped flaps for wearing with a cap.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-capsvarmeren-sec-construction-2', 'pat-capsvarmeren', 'construction', 2,
  'Konstruksjon', 'Construction',
  'Strikkes sidelengs.', 'Worked sideways.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-capsvarmeren-sec-size_guide-3', 'pat-capsvarmeren', 'size_guide', 3,
  'Størrelsesguide', 'Size guide',
  'Velg etter hodeomkrets. Ferdig mål skal sitte tett under eller over caps uten å gli.', 'Choose by head circumference. Finished size should sit snugly under or over a cap without slipping.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-capsvarmeren-sec-materials-4', 'pat-capsvarmeren', 'materials', 4,
  'Materialer', 'Materials',
  'Ca. 45 (50) 60 g DK.', 'Approx. 45 (50) 60 g DK.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-capsvarmeren-sec-cast_on-5', 'pat-capsvarmeren', 'cast_on', 5,
  'Opplegging', 'Cast-on',
  'Legg opp 18 m. Strikk i vrangbord eller dobbelstrikk ca. 6 cm.', 'Cast on 18 sts. Work rib or double knitting for approx. 6 cm.',
  20
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-capsvarmeren-sec-ear_flap-6', 'pat-capsvarmeren', 'ear_flap', 6,
  'Øreflipper', 'Ear flap shaping',
  'Øk 1 m i hver kant annenhver rad til 30 m. Strikk rett over midten. Minn 1 m i hver kant tilbake til 18 m. Fortsett over bakhodet. Gjenta øreflippe på motsatt side. Skjøt endene med madrassøm eller grafting.', 'Increase 1 st each edge every second row to 30 sts. Work even across centre. Decrease back to 18. Continue across back of head. Repeat flap; join ends.',
  60
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-capsvarmeren-sec-notes-7', 'pat-capsvarmeren', 'notes', 7,
  'Valgfri capsåpning', 'Optional cap opening',
  'Form fremre del litt smalere slik at den sitter godt under eller over caps.', 'Shape the front section slightly narrower so it sits under or over a cap.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-capsvarmeren-sec-finishing-8', 'pat-capsvarmeren', 'finishing', 8,
  'Avslutning', 'Finishing',
  'Fest tråder. Blokk lett.', 'Weave in ends. Block lightly.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-hverdagsgenseren-sec-overview-1', 'pat-hverdagsgenseren', 'overview', 1,
  'Oversikt', 'Overview',
  'En klassisk raglangenser med rund hals og avslappet passform.', 'A classic raglan sweater with round neck and relaxed fit.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-hverdagsgenseren-sec-construction-2', 'pat-hverdagsgenseren', 'construction', 2,
  'Konstruksjon', 'Construction',
  'Raglan ovenfra og ned.', 'Top-down raglan.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-hverdagsgenseren-sec-size_guide-3', 'pat-hverdagsgenseren', 'size_guide', 3,
  'Størrelsesguide', 'Size guide',
  'Anbefalt bevegelsesvidde: 10–18 cm. Velg størrelse der ferdig brystmål = egen brystvidde + ønsket ease. Se kroppsmål i tabellen. Strikkefasthet må treffe etter vask.', 'Recommended ease: 10–18 cm. Choose the size where finished chest = your bust + desired ease. See body ranges in the table. Gauge must match after washing.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-hverdagsgenseren-sec-gauge-4', 'pat-hverdagsgenseren', 'gauge', 4,
  'Strikkefasthet', 'Gauge',
  '20 masker × 28 rader = 10 × 10 cm.', '20 sts × 28 rows = 10 × 10 cm.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-hverdagsgenseren-sec-materials-5', 'pat-hverdagsgenseren', 'materials', 5,
  'Materialer', 'Materials',
  'Ca. 400 (450) 500 (550) 600 (700) 750 g DK (nøste ca. 50 g / 115 m).', 'Approx. 400 (450) 500 (550) 600 (700) 750 g DK (skein ~50 g / 115 m).',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-hverdagsgenseren-sec-neck-6', 'pat-hverdagsgenseren', 'neck', 6,
  'Hals', 'Neck',
  'Legg opp 88 (92) 96 (100) 104 (108) 112 m på 3,5 mm. 1×1 vrangbord 3 cm. Bytt til 4 mm.', 'Cast on 88–112 sts on 3.5 mm. 1×1 rib 3 cm. Change to 4 mm.',
  16
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-hverdagsgenseren-sec-stitch_distribution-7', 'pat-hverdagsgenseren', 'stitch_distribution', 7,
  'Maskefordeling', 'Stitch distribution',
  'Foran, Erme, Bak, Erme. Sett fire raglanmarkører.', 'Front, Sleeve, Back, Sleeve. Place four raglan markers.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-hverdagsgenseren-sec-short_rows-8', 'pat-hverdagsgenseren', 'short_rows', 8,
  'Vendepinner', 'Short rows',
  'Tyske vendepinner for å heve bakre hals. 3–5 snu på hver side.', 'German short rows to raise the back neckline. 3–5 turns each side.',
  12
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-hverdagsgenseren-sec-raglan-9', 'pat-hverdagsgenseren', 'raglan', 9,
  'Raglan', 'Raglan',
  'Øk én maske på hver side av hver raglanmarkør annenhver omgang. Fortsett til bærestykket er 20 (21) 22 (23) 24 (25) 26 cm. Del ermemasker. Legg opp undermermasker.', 'Increase each side of each raglan marker every second round until yoke is 20–26 cm. Separate sleeves; cast on underarm sts.',
  50
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-hverdagsgenseren-sec-body-10', 'pat-hverdagsgenseren', 'body', 10,
  'Bol', 'Body',
  'Glattstrikk til ca. 49 (50) 52 (54) 56 (58) 60 cm. 5 cm vrangbord. Fell elastisk.', 'Stockinette to approx. 49–60 cm. 5 cm rib. Bind off elastically.',
  70
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-hverdagsgenseren-sec-sleeves-11', 'pat-hverdagsgenseren', 'sleeves', 11,
  'Ermer', 'Sleeves',
  'Plukk opp undermermasker. Glattstrikk. Minn ca. hver 8.–10. omgang. Avslutt med 5 cm vrangbord.', 'Pick up underarm sts. Stockinette; decrease every 8–10 rounds. Finish with 5 cm rib.',
  60
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-hverdagsgenseren-sec-finishing-12', 'pat-hverdagsgenseren', 'finishing', 12,
  'Avslutning', 'Finishing',
  'Fest tråder. Blokk til mål.', 'Weave in ends. Block to dimensions.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-sidekick-jakke-sec-overview-1', 'pat-sidekick-jakke', 'overview', 1,
  'Oversikt', 'Overview',
  'En høyhalset strikkejakke med asymmetrisk lukking på siden av halsen.', 'A high-neck jacket with asymmetric side-neck closure.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-sidekick-jakke-sec-construction-2', 'pat-sidekick-jakke', 'construction', 2,
  'Konstruksjon', 'Construction',
  'Ovenfra og ned med høy hals.', 'Top-down with high neck.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-sidekick-jakke-sec-size_guide-3', 'pat-sidekick-jakke', 'size_guide', 3,
  'Størrelsesguide', 'Size guide',
  'Anbefalt ease ca. 8–16 cm. Velg etter egen brystvidde + ønsket plass. Se kroppsmål og ferdig bryst i tabellen.', 'Recommended ease about 8–16 cm. Choose from your bust plus desired room. See body range and finished chest in the table.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-sidekick-jakke-sec-materials-4', 'pat-sidekick-jakke', 'materials', 4,
  'Materialer', 'Materials',
  'Ca. 550 (600) 650 (700) 800 (850) 950 g worsted (nøste ca. 100 g / 180 m).', 'Approx. 550 (600) 650 (700) 800 (850) 950 g worsted (skein ~100 g / 180 m).',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-sidekick-jakke-sec-neck-5', 'pat-sidekick-jakke', 'neck', 5,
  'Høy hals', 'High neck',
  'Legg opp ca. 76 (80) 84 (88) 92 (96) 100 m. Strikk vrangbord frem og tilbake. Lag sideåpning langs venstre forstykke/hals. Lag knappehull ca. hver 4.–5. cm ved knapper. Fortsett hals til ca. 12–14 cm.', 'Cast on approx. 76–100 sts. Work rib flat. Create side opening along left front/neck. Buttonholes every 4–5 cm if using buttons. Continue neck to 12–14 cm.',
  40
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-sidekick-jakke-sec-yoke-6', 'pat-sidekick-jakke', 'yoke', 6,
  'Bærestykke', 'Yoke',
  'Fordel masker til raglan. Øk annenhver rad/omgang. Hold sideåpningen til ca. øvre bryst. Samle bolen i det runde under åpningen.', 'Distribute for raglan. Increase every second row/round. Keep side opening to upper chest, then join body in the round.',
  50
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-sidekick-jakke-sec-body-7', 'pat-sidekick-jakke', 'body', 7,
  'Bol', 'Body',
  'Del ermer. Glattstrikk i bolen. Avslutt med 6 cm vrangbord.', 'Separate sleeves. Stockinette body. Finish with 6 cm rib.',
  70
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-sidekick-jakke-sec-sleeves-8', 'pat-sidekick-jakke', 'sleeves', 8,
  'Ermer', 'Sleeves',
  'Strikk rundt. Minn gradvis. Avslutt med vrangbord-mansjetter.', 'Work in the round. Decrease gradually. Finish with rib cuffs.',
  55
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-sidekick-jakke-sec-side_closure-9', 'pat-sidekick-jakke', 'side_closure', 9,
  'Sidelukking', 'Side closure',
  'Knapper: forsterk stolpe; sy knapper mot hullene.
Glidelås: stabiliser kanten; sy glidelåsen for hånd i åpningen.', 'Buttons: reinforce band; sew buttons opposite holes.
Zipper: stabilise edge; hand-sew zipper into opening.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-sidekick-jakke-sec-finishing-10', 'pat-sidekick-jakke', 'finishing', 10,
  'Avslutning', 'Finishing',
  'Fest tråder. Blokk før glidelås/knapper når det er mulig.', 'Weave in ends. Block before installing zipper/buttons when possible.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-nesten-polo-sec-overview-1', 'pat-nesten-polo', 'overview', 1,
  'Oversikt', 'Overview',
  'En rundhalset genser med kort knappestolpe foran – litt polo, bare uten kragen. Strikkes med DK og lace-mohair holdt sammen.', 'A crew-neck sweater with a short front button placket. Worked with DK and lace mohair held together.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-nesten-polo-sec-construction-2', 'pat-nesten-polo', 'construction', 2,
  'Konstruksjon', 'Construction',
  'Strikkes ovenfra og ned med to tråder holdt sammen.', 'Worked top-down with two yarns held together.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-nesten-polo-sec-size_guide-3', 'pat-nesten-polo', 'size_guide', 3,
  'Størrelsesguide', 'Size guide',
  'Anbefalt ease 10–18 cm. Velg etter brystvidde + ønsket plass. Begge garnene i gruppen «holdt sammen» brukes samtidig.', 'Recommended ease 10–18 cm. Choose from bust + desired room. Both yarns in the held-together group are used at once.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-nesten-polo-sec-materials-4', 'pat-nesten-polo', 'materials', 4,
  'Materialer', 'Materials',
  'Holdt sammen:
DK: ca. 300 (350) 400 (450) 500 (550) 600 g
Lace-mohair: ca. 50 (50) 50 (75) 75 (75) 100 g
3–4 små knapper.', 'Held together:
DK: approx. 300 (350) 400 (450) 500 (550) 600 g
Lace mohair: approx. 50 (50) 50 (75) 75 (75) 100 g
3–4 small buttons.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-nesten-polo-sec-neck-5', 'pat-nesten-polo', 'neck', 5,
  'Hals', 'Neck',
  'Legg opp halsmasker. Strikk 2,5–3 cm vrangbord.', 'Cast on neckline stitches. Work 2.5–3 cm rib.',
  14
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-nesten-polo-sec-placket-6', 'pat-nesten-polo', 'placket', 6,
  'Knappestolpe', 'Button placket',
  'Midt foran: reserver masker til ca. 8–10 cm lang stolpe. Strikk øvre del frem og tilbake. Lag jevnt fordelte knappehull på én side.', 'At centre front, reserve sts for an 8–10 cm placket. Work top part flat. Space buttonholes evenly on one side.',
  30
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-nesten-polo-sec-yoke-7', 'pat-nesten-polo', 'yoke', 7,
  'Bærestykke', 'Yoke',
  'Raglanøkninger samtidig som stolpen holdes. Når stolpen har ønsket lengde: overlap/skjøt og fortsett rundt. Fortsett raglan. Del ermer.', 'Raglan increases while maintaining placket. When placket length is reached, join and continue in the round. Separate sleeves.',
  45
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-nesten-polo-sec-body-8', 'pat-nesten-polo', 'body', 8,
  'Bol', 'Body',
  'Glattstrikk. Avslutt med 5–6 cm vrangbord.', 'Stockinette. Finish with 5–6 cm rib.',
  65
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-nesten-polo-sec-sleeves-9', 'pat-nesten-polo', 'sleeves', 9,
  'Ermer', 'Sleeves',
  'Strikk rundt. Minn jevnt mot mansjett. Avslutt med vrangbord.', 'Work in the round. Decrease evenly toward cuff. Finish with ribbing.',
  55
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-nesten-polo-sec-button_band-10', 'pat-nesten-polo', 'button_band', 10,
  'Knapper', 'Buttons',
  'Sy knapper mot knappehullene.', 'Sew buttons opposite buttonholes.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-nesten-polo-sec-finishing-11', 'pat-nesten-polo', 'finishing', 11,
  'Avslutning', 'Finishing',
  'Fest tråder. Blokk.', 'Weave in ends. Block.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-knapp-cardigan-sec-overview-1', 'pat-knapp-cardigan', 'overview', 1,
  'Oversikt', 'Overview',
  'En enkel cardigan hvor knappene får være en viktig del av uttrykket.', 'A simple cardigan where buttons are part of the expression.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-knapp-cardigan-sec-construction-2', 'pat-knapp-cardigan', 'construction', 2,
  'Konstruksjon', 'Construction',
  'Strikkes ovenfra og ned, frem og tilbake.', 'Worked top-down, back and forth.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-knapp-cardigan-sec-size_guide-3', 'pat-knapp-cardigan', 'size_guide', 3,
  'Størrelsesguide', 'Size guide',
  'Anbefalt ease 8–16 cm. Velg etter brystvidde. Cardiganen er åpen foran — mål ferdig bryst når forstykkene møtes.', 'Recommended ease 8–16 cm. Choose by bust. The cardigan is open at the front — measure finished chest with fronts meeting.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-knapp-cardigan-sec-materials-4', 'pat-knapp-cardigan', 'materials', 4,
  'Materialer', 'Materials',
  'Ca. 300 (350) 375 (400) 450 (500) 550 g sport / lett DK (nøste ca. 50 g / 150 m). 5–7 dekorative knapper.', 'Approx. 300 (350) 375 (400) 450 (500) 550 g sport / light DK (skein ~50 g / 150 m). 5–7 decorative buttons.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-knapp-cardigan-sec-neck-5', 'pat-knapp-cardigan', 'neck', 5,
  'Hals', 'Neck',
  'Legg opp 84 (88) 92 (96) 100 (104) 108 m. Strikk halskant i vrangbord.', 'Cast on 84–108 sts. Work neck edge in rib.',
  12
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-knapp-cardigan-sec-stitch_distribution-6', 'pat-knapp-cardigan', 'stitch_distribution', 6,
  'Maskefordeling', 'Stitch distribution',
  'Venstre forstykke, Erme, Bak, Erme, Høyre forstykke. Sett fire raglanmarkører.', 'Left front, Sleeve, Back, Sleeve, Right front. Place four raglan markers.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-knapp-cardigan-sec-raglan-7', 'pat-knapp-cardigan', 'raglan', 7,
  'Raglan', 'Raglan',
  'Øk én maske på hver side av hver raglanmarkør annenhver rettside-rad. Hold knappekanter samtidig. Fortsett til bærestykket er 19 (20) 21 (22) 23 (24) 25 cm. Del ermer.', 'Increase each side of every raglan marker every second RS row while maintaining button bands. Continue to yoke depth 19–25 cm. Separate sleeves.',
  48
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-knapp-cardigan-sec-button_band-8', 'pat-knapp-cardigan', 'button_band', 8,
  'Knappehull', 'Buttonholes',
  'Lag knappehull jevnt nedover én forstykke-stolpe. Forslag: ca. hver 7.–9. cm.', 'Work buttonholes evenly down one front band. Suggested spacing: about every 7–9 cm.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-knapp-cardigan-sec-body-9', 'pat-knapp-cardigan', 'body', 9,
  'Bol', 'Body',
  'Fortsett frem og tilbake i glattstrikk. Hold knappekanter. Strikk til ca. 44 (46) 48 (50) 52 (54) 56 cm. 6 cm vrangbord. Fell av.', 'Continue flat in stockinette with button bands to approx. 44–56 cm. 6 cm rib. Bind off.',
  70
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-knapp-cardigan-sec-sleeves-10', 'pat-knapp-cardigan', 'sleeves', 10,
  'Ermer', 'Sleeves',
  'Sett ermemasker tilbake. Plukk opp undermermasker. Strikk rundt. Minn gradvis. Avslutt med 5–6 cm vrangbord.', 'Return sleeve sts; pick up underarm. Work in round; decrease gradually; 5–6 cm rib cuff.',
  55
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-knapp-cardigan-sec-button_band-11', 'pat-knapp-cardigan', 'button_band', 11,
  'Knappestolpe (valgfritt opplukk)', 'Button band (optional pickup)',
  'Hvis stolpene ikke ble strikket samtidig: plukk opp ca. 3 m for hver 4. rad langs begge forstykker. Strikk vrangbord. Plasser knappehull jevnt. Fell pent.', 'If bands were not worked simultaneously: pick up ~3 sts for every 4 rows along both fronts. Work rib; place buttonholes; bind off neatly.',
  null
)
on conflict (id) do nothing;

insert into public.pattern_sections (
  id, pattern_id, kind, sort_order, title_no, title_en, body_no, body_en, row_count
) values (
  'pat-knapp-cardigan-sec-finishing-12', 'pat-knapp-cardigan', 'finishing', 12,
  'Avslutning', 'Finishing',
  'Fest tråder. Vask og blokk. La cardiganen tørke flatt før knappene sys på om mulig. Sy dekorative knapper godt fast.', 'Weave in ends. Wash and block flat before sewing decorative buttons if possible.',
  null
)
on conflict (id) do nothing;

comment on column public.knitting_patterns.demo_pattern is 'Internal demo flag — never sell as final paid production';
