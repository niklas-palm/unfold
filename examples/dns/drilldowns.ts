import type { DrilldownDef } from 'unfold-ai'

// --- Full Resolution Sequence (sequence) ---

const resolutionSequence: DrilldownDef = {
  type: 'sequence',
  id: 'resolution-sequence',
  title: 'DNS Resolution — Full Sequence',
  subtitle: 'What happens when you type www.example.com and press Enter',
  actors: [
    { id: 'browser', label: 'Browser', color: 'sage' },
    { id: 'stub', label: 'Stub Resolver', sub: 'OS library', color: 'stone' },
    { id: 'recursive', label: 'Recursive', sub: '1.1.1.1', color: 'sea' },
    { id: 'root', label: 'Root Server', sub: '.', color: 'mist' },
    { id: 'tld', label: 'TLD Server', sub: '.com', color: 'sky' },
    { id: 'auth', label: 'Auth NS', sub: 'ns1.example.com', color: 'blush' },
  ],
  phases: [
    {
      name: 'Local Cache Check',
      messages: [
        { actor: 'browser', text: 'Check browser DNS cache\n→ Miss' },
        { from: 'browser', to: 'stub', label: 'getaddrinfo("www.example.com")' },
        { actor: 'stub', text: 'Check OS DNS cache\n→ Miss' },
      ],
    },
    {
      name: 'Recursive Query',
      messages: [
        { from: 'stub', to: 'recursive', label: 'Recursive query (RD=1)' },
        { actor: 'recursive', text: 'Check resolver cache\n→ Miss or TTL expired' },
      ],
    },
    {
      name: 'Root Server Query',
      messages: [
        { from: 'recursive', to: 'root', label: '"What is www.example.com?"' },
        { from: 'root', to: 'recursive', label: 'Referral: a.gtld-servers.net', dashed: true },
        { actor: 'recursive', text: 'Root says: "I don\'t know,\nbut here are the .com servers"' },
      ],
    },
    {
      name: 'TLD Server Query',
      messages: [
        { from: 'recursive', to: 'tld', label: '"What is www.example.com?"' },
        { from: 'tld', to: 'recursive', label: 'Referral: ns1.example.com', dashed: true },
        { actor: 'recursive', text: 'TLD says: "I don\'t know,\nbut here are example.com\'s nameservers"' },
      ],
    },
    {
      name: 'Authoritative Answer',
      messages: [
        { from: 'recursive', to: 'auth', label: '"What is www.example.com?"' },
        { from: 'auth', to: 'recursive', label: 'A 93.184.216.34 (TTL 300)', dashed: true },
        { actor: 'recursive', text: 'Cache answer for 300 seconds' },
      ],
    },
    {
      name: 'Response Delivery',
      messages: [
        { from: 'recursive', to: 'stub', label: '93.184.216.34', dashed: true },
        { actor: 'stub', text: 'Cache in OS resolver' },
        { from: 'stub', to: 'browser', label: '93.184.216.34', dashed: true },
        { actor: 'browser', text: 'Cache in browser\nOpen TCP connection to 93.184.216.34' },
      ],
    },
  ],
}

// --- Record Types (content) ---

const recordTypes: DrilldownDef = {
  type: 'content',
  id: 'record-types',
  title: 'DNS Record Types',
  subtitle: 'The data stored in authoritative nameservers',
  sections: [
    {
      columns: [
        {
          heading: 'A / AAAA',
          badge: { text: 'Address', color: 'blush' },
          body: 'The most fundamental records. Map a domain to an IPv4 (A) or IPv6 (AAAA) address. A domain can have multiple A records for round-robin load balancing.',
          items: [
            { label: 'A record', detail: 'example.com → 93.184.216.34' },
            { label: 'AAAA record', detail: 'example.com → 2606:2800:220:1:248:1893:25c8:1946' },
            { label: 'Happy Eyeballs', detail: 'Clients with IPv6 prefer AAAA (RFC 8305)' },
          ],
        },
        {
          heading: 'CNAME',
          badge: { text: 'Alias', color: 'sky' },
          body: 'Creates an alias — the resolver restarts the lookup for the target name. Cannot coexist with other record types at the same name.',
          items: [
            { label: 'Example', detail: 'www.example.com → example.com' },
            { label: 'Zone apex restriction', detail: 'Cannot place CNAME at example.com (conflicts with NS/SOA)' },
            { label: 'Workaround', detail: 'Route 53 Alias, Cloudflare CNAME flattening' },
          ],
        },
        {
          heading: 'NS',
          badge: { text: 'Delegation', color: 'mist' },
          body: 'Delegates a zone to specific nameservers. Appears at delegation points in both parent and child zones.',
          items: [
            { label: 'Minimum', detail: '2 nameservers on separate networks' },
            { label: 'Parent vs child', detail: 'Child zone\'s NS records are authoritative' },
          ],
        },
      ],
    },
    {
      columns: [
        {
          heading: 'MX',
          badge: { text: 'Mail', color: 'warm' },
          body: 'Specify mail servers with priority — lower number means preferred. Mail servers try the lowest priority first, falling back to higher values.',
          items: [
            { label: 'Example', detail: '10 mail1.example.com, 20 mail2.example.com' },
            { label: 'Equal priority', detail: 'Enables round-robin between mail servers' },
          ],
        },
        {
          heading: 'TXT',
          badge: { text: 'Text', color: 'slate' },
          body: 'Freeform text used extensively for domain verification and email security (SPF, DKIM, DMARC). Up to 255 characters per string.',
          items: [
            { label: 'SPF', detail: '"v=spf1 include:_spf.google.com ~all"' },
            { label: 'Verification', detail: '"google-site-verification=abc123"' },
          ],
        },
        {
          heading: 'SRV',
          badge: { text: 'Service', color: 'sea' },
          body: 'Encode host, port, priority, and weight for service discovery. Used by SIP, XMPP, LDAP, and Kubernetes internal DNS.',
          items: [
            { label: 'Format', detail: '_service._protocol.domain priority weight port target' },
          ],
        },
      ],
    },
    {
      heading: 'SOA — Start of Authority',
      body: 'Every zone has exactly one SOA record at its apex containing zone-wide parameters: serial number (YYYYMMDDNN), refresh interval, retry interval, expire time, and minimum TTL for negative caching. The admin email is encoded with the first dot replacing @.',
    },
    {
      heading: 'Additional Record Types',
      body: 'PTR records map IPs back to domain names (reverse DNS, used for email spam filtering). CAA records specify which Certificate Authorities may issue certificates for a domain — mandatory checking since September 2017.',
    },
  ],
}

// --- Zone File (code) ---

const zoneFile: DrilldownDef = {
  type: 'code',
  id: 'zone-file',
  title: 'Zone File Format',
  subtitle: 'RFC 1035 master file format — the source of truth for a DNS zone',
  language: 'text',
  code: `$ORIGIN example.com.
$TTL 3600

@   IN  SOA  ns1.example.com. admin.example.com. (
        2026033101  ; Serial (YYYYMMDDNN)
        3600        ; Refresh — secondary checks every hour
        900         ; Retry — if refresh fails, retry in 15 min
        604800      ; Expire — stop serving after 7 days without update
        86400       ; Minimum TTL — negative cache duration
)

; Nameservers
@       IN  NS   ns1.example.com.
@       IN  NS   ns2.example.com.

; A records
@       IN  A    93.184.216.34
www     IN  A    93.184.216.34
api     IN  A    93.184.216.35

; Alias
blog    IN  CNAME  www

; Mail
@       IN  MX   10 mail.example.com.
mail    IN  A    93.184.216.40

; Email security
@       IN  TXT  "v=spf1 ip4:93.184.216.0/24 -all"
@       IN  CAA  0 issue "letsencrypt.org"`,
  callouts: [
    {
      title: 'The @ symbol',
      body: 'Represents the zone origin (example.com. in this case). Relative names like "www" are automatically appended with $ORIGIN, so "www" becomes "www.example.com."',
    },
    {
      title: 'SOA record fields',
      body: 'The serial number conventionally uses YYYYMMDDNN format. The admin email (admin.example.com.) encodes admin@example.com — the first dot replaces @. Refresh, retry, and expire control how secondary nameservers synchronize.',
    },
    {
      title: 'Zone transfers',
      body: 'AXFR transfers the entire zone (full sync). IXFR transfers only changes since a given serial. NOTIFY (RFC 1996) alerts secondaries immediately when the zone changes, avoiding the refresh wait. Transfers use TCP on port 53 and should be restricted by IP or TSIG authentication.',
    },
  ],
}

// --- Root Servers and Anycast (content) ---

const rootServers: DrilldownDef = {
  type: 'content',
  id: 'root-servers',
  title: 'Root Servers and Anycast',
  subtitle: 'The starting point for every DNS resolution',
  sections: [
    {
      body: 'There are exactly 13 root server identities (A through M), operated by 12 independent organizations. The constraint comes from the original DNS packet size limit — 13 NS records with their IPv4 glue records fit within a single 512-byte UDP response.',
    },
    {
      columns: [
        {
          heading: 'Key Operators',
          badge: { text: '12 Organizations', color: 'mist' },
          body: 'Each root server identity is operated independently. Some have hundreds of global instances.',
          items: [
            { label: 'A, J — Verisign', detail: 'Multiple + ~190 instances' },
            { label: 'F — ISC', detail: '~250 instances worldwide' },
            { label: 'K — RIPE NCC', detail: '~75 instances' },
            { label: 'L — ICANN', detail: '~190 instances' },
            { label: 'M — WIDE Project', detail: '~10 instances (Japan)' },
          ],
        },
        {
          heading: 'Anycast',
          badge: { text: '1,700+ Instances', color: 'sea' },
          body: 'Anycast assigns the same IP address to servers in different locations. BGP routing directs each packet to the nearest instance.',
          items: [
            { label: 'Low latency', detail: 'Queries reach the nearest instance automatically' },
            { label: 'DDoS resilience', detail: 'Attack traffic distributed across all instances' },
            { label: 'Auto failover', detail: 'BGP withdraws route if instance goes down' },
            { label: 'No client config', detail: 'Same IP works worldwide' },
          ],
        },
      ],
    },
    {
      heading: 'TLD Servers',
      body: 'Each TLD has its own authoritative nameservers, delegated from the root zone. The .com TLD is the largest — over 160 million registered domains, processing ~40 billion queries per day, operated by Verisign.',
    },
  ],
}

// --- Security Threats (content) ---

const securityThreats: DrilldownDef = {
  type: 'content',
  id: 'security-threats',
  title: 'DNS Security Threats',
  subtitle: 'Attack vectors that exploit DNS infrastructure',
  sections: [
    {
      columns: [
        {
          heading: 'Cache Poisoning',
          badge: { text: 'Spoofing', color: 'clay' },
          body: 'An attacker sends forged DNS responses to inject false records into a resolver\'s cache. The Kaminsky Attack (2008) demonstrated how predictable transaction IDs (16-bit) made this exploitable at scale.',
          items: [
            { label: 'Source port randomization', detail: 'Makes spoofed responses harder to match' },
            { label: 'DNSSEC', detail: 'Cryptographic validation rejects forged responses' },
            { label: '0x20 encoding', detail: 'Randomizes query name case for extra entropy' },
          ],
        },
        {
          heading: 'DDoS Amplification',
          badge: { text: '28-54x', color: 'clay' },
          body: 'DNS responses are much larger than queries. Attackers send small queries with a spoofed source IP, causing resolvers to flood the victim with large responses.',
          items: [
            { label: 'Disable open recursion', detail: 'Only serve known clients' },
            { label: 'Response Rate Limiting', detail: 'Cap responses per source IP' },
            { label: 'BCP38', detail: 'Network ingress filtering prevents IP spoofing' },
          ],
        },
      ],
    },
    {
      columns: [
        {
          heading: 'DNS Hijacking',
          badge: { text: 'Takeover', color: 'clay' },
          body: 'Attackers modify DNS responses or take control of DNS infrastructure through various methods.',
          items: [
            { label: 'Router compromise', detail: 'Change DNS settings on home/office router' },
            { label: 'Registrar hijacking', detail: 'Gain access to registrar, change NS records' },
            { label: 'BGP hijacking', detail: 'Announce routes for DNS server IPs' },
            { label: 'Rogue DHCP', detail: 'Push attacker-controlled resolver to clients' },
          ],
        },
        {
          heading: 'DNS Tunneling',
          badge: { text: 'Exfiltration', color: 'clay' },
          body: 'DNS is used as a covert channel — data encoded in subdomains (queries) and TXT records (responses). DNS traffic is rarely blocked and often uninspected, bypassing firewalls.',
          items: [
            { label: 'Example', detail: 'dGVzdA.tunnel.attacker.com (base64 in subdomain)' },
            { label: 'NXDOMAIN attacks', detail: 'Flood with random subdomains — no cache hits, full resolution each time' },
          ],
        },
      ],
    },
  ],
}

// --- Caching Deep Dive (content) ---

const cachingDeepDive: DrilldownDef = {
  type: 'content',
  id: 'caching-deep-dive',
  title: 'Caching, TTL, and Propagation',
  subtitle: 'How DNS achieves sub-millisecond lookups for cached records',
  sections: [
    {
      columns: [
        {
          heading: 'Low TTL (60-300s)',
          badge: { text: 'Agile', color: 'warm' },
          body: 'Changes propagate in minutes. More queries hit authoritative servers.',
          items: [
            { label: 'Use for', detail: 'Pre-migration, frequently changing records' },
            { label: 'Trade-off', detail: 'Higher query load on authoritative servers' },
            { label: 'Latency', detail: 'More uncached lookups (20-120ms each)' },
          ],
        },
        {
          heading: 'High TTL (3600-86400s)',
          badge: { text: 'Stable', color: 'mist' },
          body: 'Changes take hours to propagate. Fewer queries, better caching performance.',
          items: [
            { label: 'Use for', detail: 'Stable infrastructure, NS records' },
            { label: 'Trade-off', detail: 'Slow propagation on changes' },
            { label: 'Performance', detail: 'Cached lookups at <1ms' },
          ],
        },
      ],
    },
    {
      heading: 'Caching Layers',
      body: 'DNS responses are cached at multiple levels. The browser cache (Chrome: ~1 minute cap) is checked first, then the OS resolver cache, then the recursive resolver cache, and finally any intermediate corporate proxies. Each layer respects TTL independently.',
      items: [
        { label: 'Browser', detail: 'Varies by vendor — Chrome caps at ~1 minute' },
        { label: 'OS resolver', detail: 'Respects TTL — controlled by operating system' },
        { label: 'Recursive resolver', detail: 'Respects TTL — controlled by resolver operator' },
        { label: 'Corporate proxies', detail: 'Varies — controlled by network administrator' },
      ],
    },
    {
      heading: 'Pre-Migration Pattern',
      body: 'Before changing a DNS record (e.g., migrating to a new server), lower the TTL to 60 seconds 24-48 hours in advance. This ensures old caches expire before the change. Make the change. Wait for the old TTL to expire. Then raise the TTL back to its normal value.',
    },
    {
      note: {
        title: 'Propagation is not push',
        body: '"DNS propagation" is misleading — DNS does not push changes to servers. Caches simply expire based on TTL, and resolvers re-query when stale. "Propagation time" is how long until all caches worldwide have expired their old entries.',
      },
    },
  ],
}

export const drilldowns: DrilldownDef[] = [
  resolutionSequence,
  recordTypes,
  zoneFile,
  rootServers,
  securityThreats,
  cachingDeepDive,
]
