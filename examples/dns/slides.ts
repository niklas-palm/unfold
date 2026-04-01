import type { DiagramSlide, SlideDef } from 'unfoldjs'
import { carry } from 'unfoldjs'

// ============================================================
// Layout Strategy
//
// Pre-compact (slides 1-3): large nodes, progressive introduction
//   Slide 1: [User] solo
//   Slide 2: [User] --> [Stub Resolver]
//   Slide 3: [User] --> [Stub] --> [Recursive Resolver]
//
// Post-compact (slide 4+): h:48 nodes, three rows
//   Row 0 (y:55):  [User] [Stub Resolver]         client side
//   Row 1 (y:140): [Recursive Resolver]            the workhorse
//   Row 2 (y:310): [Root] [TLD] [Auth NS]          authority chain
//                  in "DNS Hierarchy" region
//
// After the single compact transition, nodes stay fixed.
// Only arrows, annotations, and focus change per slide.
// Right panel (x:560+) reserved for annotations.
// ============================================================

// --- Slide 0: Title ---
const slide0: SlideDef = {
  type: 'title',
  title: 'How DNS Works',
  subtitle: 'The internet\'s directory service — from URL to IP in milliseconds',
  hint: 'Use arrow keys to navigate',
  notes: 'DNS is the foundational infrastructure layer of the internet. Every web request, email delivery, API call, and certificate validation begins with a DNS lookup.',
}

// --- Slide 1: The problem ---
const slide1: DiagramSlide = {
  type: 'diagram',
  heading: 'Names vs. numbers',
  subheading: 'Humans think in names, computers think in addresses',
  nodes: [
    { id: 'user', label: 'User', sub: 'types example.com', x: 180, y: 200, w: 200, h: 80, color: 'sage' },
  ],
  annotations: [
    {
      type: 'text-block', x: 450, y: 170, w: 370,
      text: 'Computers communicate using IP addresses like **93.184.216.34**. DNS translates human-readable domain names into these addresses before any connection is made.',
    },
    {
      type: 'text-block', x: 450, y: 290, w: 370,
      text: 'Before DNS, a single file called **HOSTS.TXT** mapped every hostname on the ARPANET. By the 1980s, the network outgrew a centralized text file.',
    },
  ],
  notes: 'Paul Mockapetris designed DNS in 1983 (RFC 1034/1035) as a distributed, hierarchical system. A typical web page triggers 20-100+ DNS lookups.',
}

// --- Slide 2: Stub resolver ---
const slide2 = carry(slide1, {
  heading: 'Your device asks first',
  subheading: 'The stub resolver is a tiny client built into every OS',
  nodes: [
    { id: 'user', label: 'User', sub: 'types example.com', x: 100, y: 200, w: 180, h: 75, color: 'sage' },
    { id: 'stub', label: 'Stub Resolver', sub: 'OS library', x: 430, y: 200, w: 210, h: 75, color: 'stone' },
  ],
  arrows: [
    { from: 'user', to: 'stub', label: 'getaddrinfo()' },
  ],
  annotations: [
    {
      type: 'text-block', x: 430, y: 310, w: 350,
      text: 'Every device has a stub resolver — a minimal client that forwards queries. It checks the **OS DNS cache** first, then sends the query onward.',
    },
  ],
  notes: 'The stub resolver (gethostbyname/getaddrinfo in libc) is the first thing that runs. It does not resolve names itself — it delegates to a recursive resolver.',
})

// --- Slide 3: Recursive resolver ---
const slide3 = carry(slide2, {
  heading: 'The recursive resolver',
  subheading: 'The workhorse that chases down answers',
  nodes: [
    { id: 'user', label: 'User', x: 100, y: 120, w: 180, h: 75, color: 'sage' },
    { id: 'stub', label: 'Stub Resolver', sub: 'OS library', x: 430, y: 120, w: 210, h: 75, color: 'stone' },
    { id: 'recursive', label: 'Recursive Resolver', sub: 'e.g. 1.1.1.1', x: 270, y: 350, w: 240, h: 65, color: 'sea' },
  ],
  arrows: [
    { from: 'user', to: 'stub', label: 'getaddrinfo()' },
    { from: 'stub', to: 'recursive', label: 'recursive query' },
  ],
  annotations: [
    {
      type: 'chip-list', x: 560, y: 350, color: 'sea',
      chips: ['8.8.8.8 Google', '1.1.1.1 Cloudflare', '9.9.9.9 Quad9'],
    },
    {
      type: 'text-block', x: 560, y: 380, w: 300,
      text: 'The recursive resolver does the hard work — it walks the DNS tree from root to authoritative, following referrals until it gets an answer.',
    },
  ],
  notes: 'Most end users never interact with DNS servers other than their configured recursive resolver. ISPs provide one by default; users can switch to public ones like Google or Cloudflare.',
})

// --- Slide 4: COMPACT TRANSITION — full infrastructure ---
const slide4 = carry(slide3, {
  heading: 'The authority chain',
  subheading: 'Three layers of nameservers delegate authority top-down',
  nodes: [
    // Compact existing nodes
    { id: 'user', label: 'User', sub: '', x: 60, y: 55, w: 110, h: 48, color: 'sage' },
    { id: 'stub', label: 'Stub Resolver', sub: 'OS', x: 220, y: 55, w: 145, h: 48, color: 'stone' },
    { id: 'recursive', label: 'Recursive Resolver', sub: '', x: 130, y: 140, w: 160, h: 48, color: 'sea' },
    // New: authority chain
    { id: 'root', label: 'Root Server', sub: '.', x: 20, y: 310, w: 105, h: 48, color: 'mist' },
    { id: 'tld', label: 'TLD Server', sub: '.com', x: 205, y: 310, w: 105, h: 48, color: 'sky' },
    { id: 'auth', label: 'Auth NS', sub: 'ns1.example.com', x: 390, y: 310, w: 140, h: 48, color: 'blush' },
  ],
  arrows: [
    { from: 'user', to: 'stub' },
    { from: 'stub', to: 'recursive' },
    { from: 'recursive', to: 'root', label: 'iterative', labelOffset: { dy: -12 } },
    { from: 'recursive', to: 'tld', label: 'iterative' },
    { from: 'recursive', to: 'auth', label: 'iterative', labelOffset: { dy: 12 } },
  ],
  regions: [
    { id: 'hierarchy', label: 'DNS Hierarchy', contains: ['root', 'tld', 'auth'], padding: 28 },
  ],
  annotations: [
    {
      type: 'numbered-list', x: 560, y: 80, color: 'sky',
      items: [
        { title: 'Root (.)', detail: 'IANA/ICANN — 13 server identities' },
        { title: 'TLD (.com, .org)', detail: 'Registry operators (Verisign, PIR)' },
        { title: 'SLD (example.com)', detail: 'Registered by organizations' },
        { title: 'Subdomain (www.)', detail: 'Controlled by domain owner' },
      ],
    },
  ],
  notes: 'The DNS namespace is a tree: root delegates to TLDs, TLDs delegate to second-level domains, and domain owners create subdomains freely. Authority flows downward through NS records at each level.',
})

// --- Slide 5: Root servers ---
const slide5 = carry(slide4, {
  heading: 'Root servers',
  subheading: '13 identities, 1,700+ physical instances worldwide',
  arrows: [
    { from: 'user', to: 'stub' },
    { from: 'stub', to: 'recursive' },
    { from: 'recursive', to: 'root', label: 'where is .com?' },
  ],
  annotations: [
    {
      type: 'card-list', x: 560, y: 80, direction: 'column',
      cards: [
        { label: 'A through M', detail: '13 identities run by 12 organizations' },
        { label: '1,700+ instances', detail: 'Deployed worldwide via Anycast' },
        { label: '512-byte constraint', detail: '13 NS records fit in one UDP packet' },
      ],
    },
    {
      type: 'text-block', x: 560, y: 310, w: 300,
      text: 'Explore **root server operators and Anycast**',
      onClick: 'root-servers',
    },
  ],
  notes: 'Through Anycast, the same IP address is announced from multiple locations. BGP routing directs each query to the nearest physical instance. If one goes down, traffic automatically shifts.',
})

// --- Slide 6: Resolution — following referrals ---
const slide6 = carry(slide5, {
  heading: 'Following the referrals',
  subheading: 'The recursive resolver walks the tree step by step',
  arrows: [
    { from: 'user', to: 'stub' },
    { from: 'stub', to: 'recursive' },
    { from: 'recursive', to: 'root', label: '1. "where is .com?"', labelOffset: { dy: -14 } },
    { from: 'recursive', to: 'tld', label: '2. "where is example.com?"' },
    { from: 'recursive', to: 'auth', label: '3. "what is www?"', labelOffset: { dy: 14 } },
  ],
  annotations: [
    {
      type: 'numbered-list', x: 560, y: 80, color: 'sea',
      items: [
        { title: 'Query root', detail: 'Referral to .com TLD servers' },
        { title: 'Query TLD', detail: 'Referral to ns1.example.com' },
        { title: 'Query authoritative', detail: 'Returns the actual IP address' },
      ],
    },
    {
      type: 'text-block', x: 560, y: 290, w: 300,
      text: 'View the **full 9-step resolution sequence**',
      onClick: 'resolution-sequence',
    },
  ],
  notes: 'Each query is iterative — the server either has the answer or returns a referral to the next server in the chain. The recursive resolver follows these referrals until it reaches the authoritative nameserver.',
})

// --- Slide 7: The answer arrives ---
const slide7 = carry(slide6, {
  heading: 'The answer arrives',
  subheading: 'Response flows back through the chain and is cached at every layer',
  arrows: [
    { from: 'recursive', to: 'root', label: '1. referral', dashed: true, labelOffset: { dy: -14 } },
    { from: 'recursive', to: 'tld', label: '2. referral', dashed: true },
    { from: 'recursive', to: 'auth', label: '3. query', labelOffset: { dy: 14 } },
    { from: { id: 'auth', side: 'top' }, to: { id: 'recursive', side: 'right' }, label: '93.184.216.34', dashed: true, color: 'blush' },
    { from: 'recursive', to: 'stub', label: 'answer', dashed: true, color: 'sea' },
    { from: 'stub', to: 'user', label: 'answer', dashed: true, color: 'sage' },
  ],
  annotations: [
    {
      type: 'text-block', x: 560, y: 80, w: 300,
      text: 'The authoritative nameserver returns the definitive answer. Each layer **caches** the result according to the record\'s TTL.',
    },
    {
      type: 'card-list', x: 560, y: 200, direction: 'column',
      cards: [
        { label: 'Uncached lookup', detail: '20-120ms (full chain)' },
        { label: 'Cached lookup', detail: '<1ms (from any cache layer)' },
      ],
    },
  ],
  notes: 'Total time for an uncached lookup is typically 20-120ms depending on geographic distance. Cached lookups return in under 1ms. The answer is cached at the recursive resolver, OS, and browser levels.',
})

// --- Slide 8: DNS record types (focus expand) ---
const slide8 = carry(slide7, {
  heading: 'DNS record types',
  subheading: 'The data stored in authoritative nameservers',
  arrows: [],
  annotations: [],
  focus: {
    nodeId: 'auth',
    x: 200, y: 60,
    w: 420, h: 430,
    items: [
      { label: 'A / AAAA', sub: 'IPv4 and IPv6 addresses', color: 'sea' },
      { label: 'CNAME', sub: 'Alias to another domain name', color: 'sky' },
      { label: 'MX', sub: 'Mail exchange servers with priority', color: 'warm' },
      { label: 'NS', sub: 'Nameserver delegation records', color: 'mist' },
      { label: 'TXT', sub: 'SPF, DKIM, domain verification', color: 'slate' },
      { label: 'SOA', sub: 'Zone metadata (serial, refresh, expire)', color: 'stone' },
    ],
    footnote: 'Click for full record type reference',
    footnoteOnClick: 'record-types',
  },
  notes: 'The authoritative nameserver holds the actual DNS records for its zone. A single domain can have dozens of records across different types — addresses, mail routing, verification, delegation, and metadata.',
})

// --- Slide 9: Caching and TTL ---
const slide9 = carry(slide8, {
  heading: 'Caching and TTL',
  subheading: 'Every DNS response is cached — multiple layers, controlled by TTL',
  arrows: [
    { from: 'user', to: 'stub' },
    { from: 'stub', to: 'recursive' },
    { from: 'recursive', to: 'auth', label: 'query', dashed: true },
  ],
  annotations: [
    {
      type: 'card-list', x: 560, y: 70, direction: 'column',
      cards: [
        { label: '60s', detail: 'Pre-migration, frequently changing records', borderColor: 'warm' },
        { label: '300s (5 min)', detail: 'Standard for most records', borderColor: 'warm' },
        { label: '3600s (1 hour)', detail: 'Stable records, MX records', borderColor: 'warm' },
        { label: '86400s (1 day)', detail: 'NS records, very stable infrastructure', borderColor: 'warm' },
      ],
    },
    {
      type: 'text-block', x: 560, y: 360, w: 300,
      text: 'Explore **caching layers and TTL trade-offs**',
      onClick: 'caching-deep-dive',
    },
  ],
  notes: 'TTL = Time to Live in seconds. When a resolver caches a record, it counts down the TTL. At zero, the record is stale and must be re-queried. Lower TTL means faster propagation but more queries.',
})

// --- Slide 10: DNSSEC ---
const slide10 = carry(slide9, {
  heading: 'DNSSEC',
  subheading: 'Cryptographic signatures prove DNS answers are genuine',
  arrows: [
    { from: 'user', to: 'stub' },
    { from: 'stub', to: 'recursive', label: 'verify' },
    { from: { id: 'root', side: 'right' }, to: { id: 'tld', side: 'left' }, label: 'DS record', dashed: true, labelOffset: { dy: -10 } },
    { from: { id: 'tld', side: 'right' }, to: { id: 'auth', side: 'left' }, label: 'DS record', dashed: true, labelOffset: { dy: -10 } },
  ],
  annotations: [
    {
      type: 'numbered-list', x: 560, y: 70, color: 'sand',
      items: [
        { title: 'Root KSK', detail: 'Trust anchor hardcoded in resolvers' },
        { title: 'DS records', detail: 'Each parent signs child zone\'s key hash' },
        { title: 'ZSK signs records', detail: 'RRSIG attached to every record set' },
        { title: 'Chain validated', detail: 'Root to leaf — any break = SERVFAIL' },
      ],
    },
    {
      type: 'text-block', x: 560, y: 340, w: 300,
      text: 'DNSSEC provides **authentication** and **integrity**, not encryption. Only ~5-10% of .com domains are signed.',
    },
  ],
  notes: 'DNSSEC adds cryptographic signatures to DNS records. The chain of trust flows from the root KSK (trust anchor) through DS records at each delegation point. If any link in the chain fails validation, the resolver returns SERVFAIL.',
})

// --- Slide 11: Security threats ---
const slide11 = carry(slide10, {
  heading: 'DNS under attack',
  subheading: 'Attack vectors that exploit DNS infrastructure',
  arrows: [
    { from: 'user', to: 'stub' },
    { from: 'stub', to: 'recursive' },
    { from: 'recursive', to: 'root' },
    { from: 'recursive', to: 'auth' },
  ],
  annotations: [
    {
      type: 'card-list', x: 560, y: 70, direction: 'column',
      cards: [
        { label: 'Cache Poisoning', detail: 'Inject false records into resolver cache', borderColor: 'clay' },
        { label: 'DDoS Amplification', detail: '28-54x traffic amplification via spoofed queries', borderColor: 'clay' },
        { label: 'DNS Hijacking', detail: 'Compromise router, registrar, or BGP routes', borderColor: 'clay' },
        { label: 'DNS Tunneling', detail: 'Encode data in queries for covert exfiltration', borderColor: 'clay' },
      ],
    },
    {
      type: 'text-block', x: 560, y: 370, w: 300,
      text: 'Explore **attack vectors and mitigations**',
      onClick: 'security-threats',
    },
  ],
  notes: 'The Kaminsky Attack (2008) demonstrated cache poisoning at scale by exploiting predictable 16-bit transaction IDs. DNS amplification can multiply attack traffic by 28-54x. DNS tunneling bypasses most firewalls since DNS traffic is rarely blocked.',
})

// --- Slide 12: DNS privacy ---
const slide12 = carry(slide11, {
  heading: 'DNS privacy',
  subheading: 'Traditional DNS is plaintext — DoT and DoH add encryption',
  arrows: [
    { from: 'user', to: 'stub' },
    { from: 'stub', to: 'recursive', label: 'encrypted', color: 'sea' },
    { from: 'recursive', to: 'root' },
    { from: 'recursive', to: 'tld' },
    { from: 'recursive', to: 'auth' },
  ],
  annotations: [
    {
      type: 'card-list', x: 560, y: 70, direction: 'column',
      cards: [
        { label: 'Traditional DNS', detail: 'Plaintext UDP on port 53 — visible to anyone on the path' },
        { label: 'DNS over TLS (DoT)', detail: 'TLS on port 853 — encrypted but blockable' },
        { label: 'DNS over HTTPS (DoH)', detail: 'HTTPS on port 443 — indistinguishable from web traffic' },
      ],
    },
    {
      type: 'text-block', x: 560, y: 310, w: 300,
      text: 'DoH looks like normal HTTPS traffic. Network operators **cannot distinguish** it from web browsing — very difficult to block or censor.',
    },
  ],
  notes: 'DoT uses dedicated port 853 (easy to block). DoH uses port 443 (same as all HTTPS — nearly impossible to block). Both encrypt the query between stub and recursive resolver. The recursive-to-authoritative leg remains unencrypted.',
})

// --- Slide 13: The complete picture ---
const slide13 = carry(slide12, {
  heading: 'The complete picture',
  subheading: 'All components working together',
  arrows: [
    { from: 'user', to: 'stub' },
    { from: 'stub', to: 'recursive', label: 'recursive query' },
    { from: 'recursive', to: 'root', label: 'iterative', labelOffset: { dy: -12 } },
    { from: 'recursive', to: 'tld', label: 'iterative' },
    { from: 'recursive', to: 'auth', label: 'iterative', labelOffset: { dy: 12 } },
    { from: { id: 'auth', side: 'top' }, to: { id: 'recursive', side: 'right' }, label: 'answer', dashed: true, color: 'blush' },
  ],
  regions: [
    { id: 'client', label: 'Client', contains: ['user', 'stub'], padding: 20 },
    { id: 'hierarchy', label: 'DNS Hierarchy', contains: ['root', 'tld', 'auth'], padding: 28 },
  ],
  annotations: [
    {
      type: 'text-block', x: 560, y: 70, w: 300,
      text: 'View **full resolution sequence**',
      onClick: 'resolution-sequence',
    },
    {
      type: 'text-block', x: 560, y: 120, w: 300,
      text: 'Browse **DNS record types**',
      onClick: 'record-types',
    },
    {
      type: 'text-block', x: 560, y: 170, w: 300,
      text: 'Explore **caching and TTL**',
      onClick: 'caching-deep-dive',
    },
    {
      type: 'text-block', x: 560, y: 220, w: 300,
      text: 'Read about **zone files and transfers**',
      onClick: 'zone-file',
    },
    {
      type: 'text-block', x: 560, y: 270, w: 300,
      text: 'Understand **security threats**',
      onClick: 'security-threats',
    },
    {
      type: 'text-block', x: 560, y: 320, w: 300,
      text: 'Explore **root servers and Anycast**',
      onClick: 'root-servers',
    },
  ],
  notes: 'The full DNS architecture: user queries the stub resolver, which delegates to a recursive resolver, which iteratively queries root, TLD, and authoritative nameservers. The answer flows back through the chain, cached at every layer.',
})

// --- Slide 14: Key Takeaways ---
const slide14: SlideDef = {
  type: 'list',
  eyebrow: 'Summary',
  heading: 'Key Takeaways',
  items: [
    { title: 'Hierarchical namespace', desc: 'A tree from root (.) through TLDs to domains — authority delegated at each level via NS records' },
    { title: 'Four server types', desc: 'Stub resolver, recursive resolver, TLD servers, and authoritative nameservers each play a distinct role' },
    { title: 'Iterative resolution', desc: 'The recursive resolver walks the tree: root, TLD, authoritative — following referrals until it gets an answer' },
    { title: 'Caching is everything', desc: 'Multiple cache layers (browser, OS, resolver) with TTL controlling freshness — cached lookups return in under 1ms' },
    { title: 'Security is layered', desc: 'DNSSEC authenticates responses, DoT/DoH encrypt queries, but adoption remains partial' },
    { title: '13 root identities, 1700+ instances', desc: 'Anycast distributes root server traffic to the nearest physical instance worldwide' },
  ],
  notes: 'Six key points from the walkthrough. Each maps to a specific part of the DNS architecture covered in the presentation.',
}

export const slides: SlideDef[] = [
  slide0, slide1, slide2, slide3, slide4, slide5, slide6, slide7,
  slide8, slide9, slide10, slide11, slide12, slide13, slide14,
]
