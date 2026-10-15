import type { AppLocale } from './types'

export type MessageKey =
  | 'nav.explore'
  | 'nav.myPatterns'
  | 'nav.stash'
  | 'nav.projects'
  | 'nav.account'
  | 'nav.cart'
  | 'nav.back'
  | 'menu.open'
  | 'menu.close'
  | 'brand.tagline'
  | 'explore.title'
  | 'explore.lead'
  | 'explore.empty'
  | 'explore.price'
  | 'explore.owned'
  | 'explore.view'
  | 'explore.buy'
  | 'pattern.difficulty.beginner'
  | 'pattern.difficulty.easy'
  | 'pattern.difficulty.intermediate'
  | 'pattern.difficulty.advanced'
  | 'pattern.materials'
  | 'pattern.sizes'
  | 'pattern.gauge'
  | 'pattern.needles'
  | 'pattern.needlesSuggested'
  | 'pattern.yarn'
  | 'pattern.techniques'
  | 'pattern.techOverview'
  | 'pattern.sizeGuide'
  | 'pattern.sizeGuideLead'
  | 'pattern.gaugeCaveat'
  | 'pattern.heldTogether'
  | 'pattern.bodyBust'
  | 'pattern.gramsBySize'
  | 'pattern.internalMetres'
  | 'pattern.abbreviations'
  | 'pattern.read'
  | 'pattern.pdf'
  | 'pattern.pdfPlaceholder'
  | 'pattern.pdfOwnedOnly'
  | 'pattern.pdfError'
  | 'pattern.match'
  | 'pattern.matchSoft'
  | 'pattern.noMatch'
  | 'pattern.leftoverLead'
  | 'pattern.demoBanner'
  | 'pattern.claimFree'
  | 'pattern.ease'
  | 'pattern.sizeCol'
  | 'pattern.chest'
  | 'pattern.length'
  | 'pattern.sleeve'
  | 'pattern.head'
  | 'pattern.finished'
  | 'pattern.hand'
  | 'pattern.foot'
  | 'purchase.title'
  | 'purchase.demo'
  | 'purchase.lead'
  | 'purchase.confirm'
  | 'purchase.cancel'
  | 'purchase.done'
  | 'purchase.already'
  | 'cart.title'
  | 'cart.lead'
  | 'cart.empty'
  | 'cart.add'
  | 'cart.added'
  | 'cart.alreadyInCart'
  | 'cart.remove'
  | 'cart.clear'
  | 'cart.continue'
  | 'cart.checkout'
  | 'cart.subtotal'
  | 'cart.total'
  | 'cart.free'
  | 'cart.freeNote'
  | 'cart.paidNote'
  | 'cart.viewCart'
  | 'checkout.title'
  | 'checkout.lead'
  | 'checkout.summary'
  | 'checkout.freeTitle'
  | 'checkout.freeLead'
  | 'checkout.claimFree'
  | 'checkout.paidTitle'
  | 'checkout.stripePending'
  | 'checkout.secureNote'
  | 'checkout.signInRequired'
  | 'checkout.payStripe'
  | 'checkout.backCart'
  | 'checkout.claimed'
  | 'checkout.successTitle'
  | 'checkout.successPending'
  | 'checkout.successReady'
  | 'checkout.successSecure'
  | 'myPatterns.title'
  | 'myPatterns.lead'
  | 'myPatterns.empty'
  | 'myPatterns.continue'
  | 'myPatterns.purchased'
  | 'reader.resume'
  | 'reader.row'
  | 'reader.section'
  | 'reader.bookmark'
  | 'reader.markRow'
  | 'stash.title'
  | 'stash.lead'
  | 'stash.empty'
  | 'stash.addKnown'
  | 'stash.addUnknown'
  | 'stash.search'
  | 'stash.quantity'
  | 'stash.unit.skeins'
  | 'stash.unit.g'
  | 'stash.unit.m'
  | 'stash.save'
  | 'stash.remove'
  | 'stash.colour'
  | 'stash.notes'
  | 'projects.title'
  | 'projects.lead'
  | 'projects.empty'
  | 'projects.new'
  | 'projects.status.planned'
  | 'projects.status.in_progress'
  | 'projects.status.finished'
  | 'projects.notes'
  | 'projects.save'
  | 'account.title'
  | 'account.lead'
  | 'account.email'
  | 'account.password'
  | 'account.signIn'
  | 'account.signUp'
  | 'account.signOut'
  | 'account.language'
  | 'account.guest'
  | 'account.configuredOff'
  | 'account.demoUser'
  | 'lang.chooseTitle'
  | 'lang.chooseLead'
  | 'lang.no'
  | 'lang.en'
  | 'admin.gate'
  | 'admin.overview'
  | 'admin.innsikt'
  | 'admin.patterns'
  | 'admin.yarns'
  | 'admin.settings'
  | 'admin.back'
  | 'admin.publish'
  | 'admin.draft'
  | 'common.loading'
  | 'common.close'
  | 'common.cancel'
  | 'common.save'
  | 'common.delete'
  | 'common.edit'

type Catalog = Record<MessageKey, string>

const no: Catalog = {
  'nav.explore': 'Utforsk',
  'nav.myPatterns': 'Mine oppskrifter',
  'nav.stash': 'Garnlager',
  'nav.projects': 'Prosjekter',
  'nav.account': 'Konto',
  'nav.cart': 'Handlekurv',
  'nav.back': 'Tilbake',
  'menu.open': 'Åpne meny',
  'menu.close': 'Lukk meny',
  'brand.tagline': 'Strikk med det du har — og det du elsker.',
  'explore.title': 'Utforsk',
  'explore.lead': 'Originale strikkeoppskrifter, klare for pinnene dine.',
  'explore.empty': 'Ingen oppskrifter publisert ennå.',
  'explore.price': '{price} kr',
  'explore.owned': 'Kjøpt',
  'explore.view': 'Se oppskrift',
  'explore.buy': 'Legg i handlekurv',
  'pattern.difficulty.beginner': 'Nybegynner',
  'pattern.difficulty.easy': 'Enkel',
  'pattern.difficulty.intermediate': 'Middels',
  'pattern.difficulty.advanced': 'Avansert',
  'pattern.materials': 'Materialer',
  'pattern.sizes': 'Størrelser',
  'pattern.gauge': 'Strikkefasthet',
  'pattern.needles': 'Pinner',
  'pattern.needlesSuggested': 'Veiledende pinner',
  'pattern.yarn': 'Garn',
  'pattern.techniques': 'Teknikker',
  'pattern.techOverview': 'Teknisk oversikt',
  'pattern.sizeGuide': 'Størrelsesguide',
  'pattern.sizeGuideLead':
    'Velg størrelse ut fra egne kroppsmål og ønsket bevegelsesvidde. Ferdigmål er plaggets mål etter blokking.',
  'pattern.gaugeCaveat':
    'Strikkefasthet påvirker passform — sjekk alltid etter vask før du velger størrelse.',
  'pattern.heldTogether': 'Holdt sammen',
  'pattern.bodyBust': 'Kropp bryst',
  'pattern.gramsBySize': 'Gram per størrelse',
  'pattern.internalMetres': 'Meter (internt / lager)',
  'pattern.abbreviations': 'Forkortelser',
  'pattern.read': 'Åpne oppskrift',
  'pattern.pdf': 'Last ned PDF',
  'pattern.pdfPlaceholder': 'PDF kommer snart — plassholder.',
  'pattern.pdfOwnedOnly': 'PDF er kun tilgjengelig etter at du eier oppskriften.',
  'pattern.pdfError': 'Kunne ikke åpne PDF. Prøv igjen senere.',
  'pattern.match': 'Du har nok garn',
  'pattern.matchSoft': 'Mulig match (ufullstendig data)',
  'pattern.noMatch': 'Ikke nok garn i lageret',
  'pattern.leftoverLead': 'Passer til restegarn / garnlageret ditt:',
  'pattern.demoBanner': 'Demo-oppskrift — ikke endelig betalt produksjon (0 kr).',
  'pattern.claimFree': 'Legg i Mine oppskrifter',
  'pattern.ease': 'Bevegelsesvidde',
  'pattern.sizeCol': 'Str',
  'pattern.chest': 'Bryst',
  'pattern.length': 'Lengde',
  'pattern.sleeve': 'Erme',
  'pattern.head': 'Hode',
  'pattern.finished': 'Ferdig',
  'pattern.hand': 'Hånd',
  'pattern.foot': 'Fot',
  'purchase.title': 'Demo-kjøp',
  'purchase.demo': 'Ikke et ekte kjøp',
  'purchase.lead':
    'Dette er kun en demonstrasjon. Ingen kortopplysninger, ingen betaling.',
  'purchase.confirm': 'Bekreft demo-kjøp',
  'purchase.cancel': 'Avbryt',
  'purchase.done': 'Lagt til i Mine oppskrifter',
  'purchase.already': 'Du eier allerede denne oppskriften',
  'cart.title': 'Handlekurv',
  'cart.lead': 'Oppskrifter klare for kassen — ingen duplikater.',
  'cart.empty': 'Handlekurven er tom.',
  'cart.add': 'Legg i handlekurv',
  'cart.added': 'Lagt i handlekurven',
  'cart.alreadyInCart': 'Allerede i handlekurven',
  'cart.remove': 'Fjern',
  'cart.clear': 'Tøm kurv',
  'cart.continue': 'Fortsett å utforske',
  'cart.checkout': 'Gå til kasse',
  'cart.subtotal': 'Delsum',
  'cart.total': 'Totalt',
  'cart.free': 'Gratis',
  'cart.freeNote': '{count} gratis/demo-linjer — ingen Stripe-belastning.',
  'cart.paidNote': '{count} betalte linjer krever Stripe (ikke koblet ennå).',
  'cart.viewCart': 'Se kurv',
  'checkout.title': 'Kasse',
  'checkout.lead': 'Gratis demo kan hentes nå. Betalte kjøp går via Stripe senere.',
  'checkout.summary': 'Ordresammendrag',
  'checkout.freeTitle': 'Gratis / demo',
  'checkout.freeLead':
    'Disse legges rett i biblioteket ditt. Ingen betaling, ingen Stripe.',
  'checkout.claimFree': 'Hent gratis oppskrifter',
  'checkout.paidTitle': 'Betalte oppskrifter',
  'checkout.stripePending':
    'Stripe Checkout er forberedt i arkitekturen, men ikke koblet til live nøkler ennå.',
  'checkout.secureNote':
    'Eierskap gis kun etter verifisert betaling (webhook) — aldri fra nettleseren alene.',
  'checkout.signInRequired': 'Logg inn for å betale med Stripe.',
  'checkout.payStripe': 'Betal med Stripe',
  'checkout.backCart': 'Tilbake til handlekurv',
  'checkout.claimed': '{count} oppskrifter lagt i Mine oppskrifter',
  'checkout.successTitle': 'Takk!',
  'checkout.successPending':
    'Hvis du betalte, synkes eierskap fra serveren etter webhook — ikke fra denne siden alene.',
  'checkout.successReady': 'Biblioteket ditt er oppdatert.',
  'checkout.successSecure':
    'PDF-tilgang krever eierskap. Last ned fra Mine oppskrifter.',
  'myPatterns.title': 'Mine oppskrifter',
  'myPatterns.lead': 'Kjøpte og hentede oppskrifter — permanent tilgang.',
  'myPatterns.empty': 'Du har ingen oppskrifter ennå. Utforsk butikken!',
  'myPatterns.continue': 'Fortsett der du slapp',
  'myPatterns.purchased': 'Lagt til {date}',
  'reader.resume': 'Fortsett der du slapp',
  'reader.row': 'Rad {row}',
  'reader.section': '{section}',
  'reader.bookmark': 'Lagre fremgang',
  'reader.markRow': 'Marker rad',
  'stash.title': 'Garnlager',
  'stash.lead': 'Det du har hjemme — brukt til å finne oppskrifter som passer.',
  'stash.empty': 'Lageret er tomt. Legg til garn for å få treff.',
  'stash.addKnown': 'Legg til kjent garn',
  'stash.addUnknown': 'Legg til manuelt',
  'stash.search': 'Søk i garnkatalog…',
  'stash.quantity': 'Mengde',
  'stash.unit.skeins': 'nøster',
  'stash.unit.g': 'g',
  'stash.unit.m': 'm',
  'stash.save': 'Lagre i lager',
  'stash.remove': 'Fjern',
  'stash.colour': 'Farge',
  'stash.notes': 'Notater',
  'projects.title': 'Prosjekter',
  'projects.lead': 'Planlagt, pågående og ferdige strikkeprosjekter.',
  'projects.empty': 'Ingen prosjekter ennå.',
  'projects.new': 'Nytt prosjekt',
  'projects.status.planned': 'Planlagt',
  'projects.status.in_progress': 'Pågår',
  'projects.status.finished': 'Ferdig',
  'projects.notes': 'Notater',
  'projects.save': 'Lagre prosjekt',
  'account.title': 'Konto',
  'account.lead': 'Logg inn for å synke kjøp, fremgang og garnlager.',
  'account.email': 'E-post',
  'account.password': 'Passord',
  'account.signIn': 'Logg inn',
  'account.signUp': 'Opprett konto',
  'account.signOut': 'Logg ut',
  'account.language': 'Språk',
  'account.guest': 'Du er ikke innlogget — data lagres lokalt på denne enheten.',
  'account.configuredOff':
    'Supabase er ikke konfigurert. Sett VITE_SUPABASE_URL og VITE_SUPABASE_PUBLISHABLE_KEY (samme som FGTG) i .env.local eller Netlify, og bygg på nytt.',
  'account.demoUser': 'Fortsett som lokal bruker (demo)',
  'lang.chooseTitle': 'Velg språk',
  'lang.chooseLead': 'Du kan endre dette senere under Konto.',
  'lang.no': 'Norsk',
  'lang.en': 'English',
  'admin.gate': 'Sjekker tilgang…',
  'admin.overview': 'Oversikt',
  'admin.innsikt': 'Innsikt',
  'admin.patterns': 'Oppskrifter',
  'admin.yarns': 'Garn',
  'admin.settings': 'Innstillinger',
  'admin.back': 'Tilbake til appen',
  'admin.publish': 'Publisert',
  'admin.draft': 'Utkast',
  'common.loading': 'Laster…',
  'common.close': 'Lukk',
  'common.cancel': 'Avbryt',
  'common.save': 'Lagre',
  'common.delete': 'Slett',
  'common.edit': 'Rediger',
}

const en: Catalog = {
  'nav.explore': 'Explore',
  'nav.myPatterns': 'My Patterns',
  'nav.stash': 'Yarn Stash',
  'nav.projects': 'Projects',
  'nav.account': 'Account',
  'nav.cart': 'Cart',
  'nav.back': 'Back',
  'menu.open': 'Open menu',
  'menu.close': 'Close menu',
  'brand.tagline': 'Knit with what you have — and what you love.',
  'explore.title': 'Explore',
  'explore.lead': 'Original knitting patterns, ready for your needles.',
  'explore.empty': 'No patterns published yet.',
  'explore.price': 'NOK {price}',
  'explore.owned': 'Owned',
  'explore.view': 'View pattern',
  'explore.buy': 'Add to cart',
  'pattern.difficulty.beginner': 'Beginner',
  'pattern.difficulty.easy': 'Easy',
  'pattern.difficulty.intermediate': 'Intermediate',
  'pattern.difficulty.advanced': 'Advanced',
  'pattern.materials': 'Materials',
  'pattern.sizes': 'Sizes',
  'pattern.gauge': 'Gauge',
  'pattern.needles': 'Needles',
  'pattern.needlesSuggested': 'Suggested needles',
  'pattern.yarn': 'Yarn',
  'pattern.techniques': 'Techniques',
  'pattern.techOverview': 'Technical overview',
  'pattern.sizeGuide': 'Size guide',
  'pattern.sizeGuideLead':
    'Choose size from your body measurements and desired ease. Finished measurements are the garment after blocking.',
  'pattern.gaugeCaveat':
    'Gauge affects fit — always check after washing before choosing a size.',
  'pattern.heldTogether': 'Held together',
  'pattern.bodyBust': 'Body bust',
  'pattern.gramsBySize': 'Grams per size',
  'pattern.internalMetres': 'Metres (internal / stash)',
  'pattern.abbreviations': 'Abbreviations',
  'pattern.read': 'Open pattern',
  'pattern.pdf': 'Download PDF',
  'pattern.pdfPlaceholder': 'PDF coming soon — placeholder.',
  'pattern.pdfOwnedOnly': 'PDF is available only after you own the pattern.',
  'pattern.pdfError': 'Could not open PDF. Try again later.',
  'pattern.match': 'You have enough yarn',
  'pattern.matchSoft': 'Possible match (incomplete data)',
  'pattern.noMatch': 'Not enough yarn in stash',
  'pattern.leftoverLead': 'Leftover / stash suitability:',
  'pattern.demoBanner': 'Demo pattern — not final paid production (NOK 0).',
  'pattern.claimFree': 'Add to My Patterns',
  'pattern.ease': 'Ease',
  'pattern.sizeCol': 'Size',
  'pattern.chest': 'Chest',
  'pattern.length': 'Length',
  'pattern.sleeve': 'Sleeve',
  'pattern.head': 'Head',
  'pattern.finished': 'Finished',
  'pattern.hand': 'Hand',
  'pattern.foot': 'Foot',
  'purchase.title': 'Demo purchase',
  'purchase.demo': 'Not a real purchase',
  'purchase.lead':
    'This is a demonstration only. No card details, no payment.',
  'purchase.confirm': 'Confirm demo purchase',
  'purchase.cancel': 'Cancel',
  'purchase.done': 'Added to My Patterns',
  'purchase.already': 'You already own this pattern',
  'cart.title': 'Cart',
  'cart.lead': 'Patterns ready for checkout — no duplicates.',
  'cart.empty': 'Your cart is empty.',
  'cart.add': 'Add to cart',
  'cart.added': 'Added to cart',
  'cart.alreadyInCart': 'Already in cart',
  'cart.remove': 'Remove',
  'cart.clear': 'Clear cart',
  'cart.continue': 'Continue browsing',
  'cart.checkout': 'Go to checkout',
  'cart.subtotal': 'Subtotal',
  'cart.total': 'Total',
  'cart.free': 'Free',
  'cart.freeNote': '{count} free/demo lines — no Stripe charge.',
  'cart.paidNote': '{count} paid lines need Stripe (not connected yet).',
  'cart.viewCart': 'View cart',
  'checkout.title': 'Checkout',
  'checkout.lead': 'Claim free demos now. Paid checkout will use Stripe later.',
  'checkout.summary': 'Order summary',
  'checkout.freeTitle': 'Free / demo',
  'checkout.freeLead':
    'These go straight into your library. No payment, no Stripe.',
  'checkout.claimFree': 'Claim free patterns',
  'checkout.paidTitle': 'Paid patterns',
  'checkout.stripePending':
    'Stripe Checkout is architected but not connected to live keys yet.',
  'checkout.secureNote':
    'Ownership is granted only after verified payment (webhook) — never from the browser alone.',
  'checkout.signInRequired': 'Sign in to pay with Stripe.',
  'checkout.payStripe': 'Pay with Stripe',
  'checkout.backCart': 'Back to cart',
  'checkout.claimed': '{count} patterns added to My Patterns',
  'checkout.successTitle': 'Thank you!',
  'checkout.successPending':
    'If you paid, ownership syncs from the server after the webhook — not from this page alone.',
  'checkout.successReady': 'Your library is up to date.',
  'checkout.successSecure':
    'PDF access requires ownership. Download from My Patterns.',
  'myPatterns.title': 'My Patterns',
  'myPatterns.lead': 'Purchased and claimed patterns — permanent access.',
  'myPatterns.empty': 'No patterns yet. Explore the store!',
  'myPatterns.continue': 'Continue where you left off',
  'myPatterns.purchased': 'Added {date}',
  'reader.resume': 'Continue where you left off',
  'reader.row': 'Row {row}',
  'reader.section': '{section}',
  'reader.bookmark': 'Save progress',
  'reader.markRow': 'Mark row',
  'stash.title': 'Yarn Stash',
  'stash.lead': 'What you have at home — used to find matching patterns.',
  'stash.empty': 'Stash is empty. Add yarn to get matches.',
  'stash.addKnown': 'Add known yarn',
  'stash.addUnknown': 'Add manually',
  'stash.search': 'Search yarn catalog…',
  'stash.quantity': 'Quantity',
  'stash.unit.skeins': 'skeins',
  'stash.unit.g': 'g',
  'stash.unit.m': 'm',
  'stash.save': 'Save to stash',
  'stash.remove': 'Remove',
  'stash.colour': 'Colour',
  'stash.notes': 'Notes',
  'projects.title': 'Projects',
  'projects.lead': 'Planned, in-progress, and finished knits.',
  'projects.empty': 'No projects yet.',
  'projects.new': 'New project',
  'projects.status.planned': 'Planned',
  'projects.status.in_progress': 'In progress',
  'projects.status.finished': 'Finished',
  'projects.notes': 'Notes',
  'projects.save': 'Save project',
  'account.title': 'Account',
  'account.lead': 'Sign in to sync purchases, progress, and stash.',
  'account.email': 'Email',
  'account.password': 'Password',
  'account.signIn': 'Sign in',
  'account.signUp': 'Create account',
  'account.signOut': 'Sign out',
  'account.language': 'Language',
  'account.guest': 'Not signed in — data is stored locally on this device.',
  'account.configuredOff':
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (same as FGTG) in .env.local or Netlify, then rebuild.',
  'account.demoUser': 'Continue as local user (demo)',
  'lang.chooseTitle': 'Choose language',
  'lang.chooseLead': 'You can change this later under Account.',
  'lang.no': 'Norsk',
  'lang.en': 'English',
  'admin.gate': 'Checking access…',
  'admin.overview': 'Overview',
  'admin.innsikt': 'Innsikt',
  'admin.patterns': 'Patterns',
  'admin.yarns': 'Yarns',
  'admin.settings': 'Settings',
  'admin.back': 'Back to app',
  'admin.publish': 'Published',
  'admin.draft': 'Draft',
  'common.loading': 'Loading…',
  'common.close': 'Close',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
}

const catalogs: Record<AppLocale, Catalog> = { no, en }

export type TranslateVars = Record<string, string | number>

export function translate(
  locale: AppLocale,
  key: MessageKey,
  vars?: TranslateVars,
): string {
  let text = catalogs[locale][key] ?? catalogs.no[key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, String(v))
    }
  }
  return text
}
