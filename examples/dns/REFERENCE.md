# How DNS Works — Technical Reference

> The Domain Name System is a hierarchical, distributed naming system that translates human-readable domain names into IP addresses. It is the foundational infrastructure layer of the internet — every web request, email delivery, API call, and certificate validation begins with a DNS lookup. DNS operates as a globally distributed database with no single point of control, using a delegation model where authority flows from 13 root server clusters through top-level domain registries down to individual domain operators.

**Version:** 1.0
**Date:** 2026-03-31

---

## Table of Contents

1. [Why DNS Exists](#1-why-dns-exists)
2. [The DNS Namespace](#2-the-dns-namespace)
3. [DNS Infrastructure](#3-dns-infrastructure)
4. [The Resolution Process](#4-the-resolution-process)
5. [DNS Record Types](#5-dns-record-types)
6. [Caching and TTL](#6-caching-and-ttl)
7. [Zone Files and Zone Transfers](#7-zone-files-and-zone-transfers)
8. [The DNS Protocol](#8-the-dns-protocol)
9. [DNSSEC — Authenticating DNS Responses](#9-dnssec--authenticating-dns-responses)
10. [DNS Privacy — DoT and DoH](#10-dns-privacy--dot-and-doh)
11. [DNS Security Threats](#11-dns-security-threats)
12. [Anycast and DNS Load Distribution](#12-anycast-and-dns-load-distribution)
13. [DNS-Based Load Balancing and Failover](#13-dns-based-load-balancing-and-failover)
14. [Private DNS and Split-Horizon](#14-private-dns-and-split-horizon)
15. [DNS Propagation](#15-dns-propagation)
16. [Email-Related DNS Records](#16-email-related-dns-records)
17. [CDN and Cloud Provider DNS Integration](#17-cdn-and-cloud-provider-dns-integration)
18. [Diagnostic Tools](#18-diagnostic-tools)
- [Appendix A: Technical Constants](#appendix-a-technical-constants)
- [Appendix B: Complete Record Type Reference](#appendix-b-complete-record-type-reference)

---

## 1. Why DNS Exists

Computers communicate using IP addresses — numerical identifiers like `93.184.216.34` (IPv4) or `2606:2800:220:1:248:1893:25c8:1946` (IPv6). Humans cannot remember these for every website and service they use. DNS bridges this gap: type `example.com` and DNS translates it to the correct IP address before the connection is made.

Before DNS, a single file called `HOSTS.TXT` maintained by the Stanford Research Institute (SRI-NIC) mapped every hostname on the ARPANET to its address. Administrators manually downloaded updates. By the early 1980s, the network was growing too fast for a centralized text file. Paul Mockapetris designed DNS in 1983 (RFC 882/883, later replaced by RFC 1034/1035) as a distributed, hierarchical, and automatically updated system.

**DNS is queried before almost everything on the internet:**

| Action | DNS Lookup Required |
|--------|-------------------|
| Opening a website | Yes — browser resolves domain to IP |
| Sending an email | Yes — mail server resolves MX records for recipient domain |
| API call to `api.stripe.com` | Yes — HTTP client resolves domain |
| TLS certificate validation | Yes — CA may check CAA records |
| Loading a CDN asset | Yes — CDN domain resolves to nearest edge via Anycast |
| SSH to `server.company.com` | Yes — SSH client resolves domain |
| Container pulling `gcr.io/image` | Yes — container runtime resolves registry domain |

A typical web page triggers 20–100+ DNS lookups (one for every distinct domain: the site itself, analytics, fonts, CDN, ads, APIs). Modern browsers mitigate this with DNS prefetching and connection reuse, but the lookups still happen.

---

## 2. The DNS Namespace

The DNS namespace is a tree structure, read right to left, with the root at the top.

### 2.1 Hierarchy

```
                        . (root)
                       / | \
                   com   org   uk
                  / |         |
           example google   co
              |     |        |
            www   maps    bbc
```

Every fully qualified domain name (FQDN) is a path from a leaf to the root. The name `www.example.com` is technically `www.example.com.` — the trailing dot represents the root. Most software hides the trailing dot, but it exists in every DNS query.

### 2.2 Label Rules

| Rule | Constraint |
|------|-----------|
| Label length | 1–63 characters per label |
| Total FQDN length | Max 253 characters (255 octets in wire format including length bytes) |
| Character set | Letters (a–z), digits (0–9), hyphens. Case-insensitive. |
| Hyphens | Cannot start or end a label |
| Internationalized domains | Encoded as Punycode (e.g., `münchen.de` → `xn--mnchen-3ya.de`) per RFC 3492 |

### 2.3 Domain Levels

| Level | Example | Who controls it |
|-------|---------|----------------|
| **Root** | `.` | IANA / ICANN (13 root server operators) |
| **Top-Level Domain (TLD)** | `.com`, `.org`, `.uk`, `.io` | Registry operators (Verisign for `.com`, PIR for `.org`) |
| **Second-Level Domain (SLD)** | `example.com` | Registered by individuals or organizations via registrars |
| **Subdomain** | `www.example.com`, `api.example.com` | Controlled by the SLD owner — no registration needed |

**TLD categories:**

| Category | Examples | Count (approx.) |
|----------|---------|-----------------|
| Generic (gTLD) | `.com`, `.net`, `.org`, `.info` | ~1,200 |
| Country-code (ccTLD) | `.uk`, `.de`, `.jp`, `.au` | ~312 |
| Sponsored (sTLD) | `.edu`, `.gov`, `.mil` | ~14 |
| New gTLDs (post-2012) | `.app`, `.dev`, `.cloud`, `.io` | ~1,000+ |
| Infrastructure | `.arpa` (reverse DNS, protocol parameters) | 1 |

The root zone file — maintained by IANA and distributed to all root servers — contains the NS records and glue records for every TLD. As of 2026, it lists approximately 1,500 TLDs.

---

## 3. DNS Infrastructure

### 3.1 Four Types of DNS Servers

The resolution process involves four distinct server roles:

| Server Type | Role | Operates | Example |
|-------------|------|----------|---------|
| **Stub Resolver** | Client library on the end device | On every device (OS-level) | `gethostbyname()` in libc, `getaddrinfo()` |
| **Recursive Resolver** | Accepts queries from stubs, chases referrals, returns final answers | ISP, public (Google, Cloudflare), enterprise | `8.8.8.8` (Google), `1.1.1.1` (Cloudflare) |
| **Authoritative Nameserver** | Holds the actual DNS records for a zone and returns definitive answers | Domain owner or DNS hosting provider | `ns1.example.com`, Route 53, Cloudflare DNS |
| **Root Server** | Returns referrals to TLD servers — the entry point for all resolution | 13 logical clusters (A through M) | `a.root-servers.net` through `m.root-servers.net` |

### 3.2 Root Servers

There are exactly **13 root server identities** (A through M), operated by 12 independent organizations. The constraint comes from the original DNS packet size limit — 13 NS records with their IPv4 glue records fit within a single 512-byte UDP response.

| Letter | Operator | Locations (approx.) |
|--------|----------|-------------------|
| A | Verisign | Multiple |
| B | USC-ISI | 1 |
| C | Cogent | Multiple |
| D | University of Maryland | Multiple |
| E | NASA Ames | Multiple |
| F | ISC (Internet Systems Consortium) | ~250 |
| G | US DoD (DISA) | Multiple |
| H | US Army Research Lab | Multiple |
| I | Netnod (Sweden) | ~70 |
| J | Verisign | ~190 |
| K | RIPE NCC | ~75 |
| L | ICANN | ~190 |
| M | WIDE Project (Japan) | ~10 |

Through **Anycast** (see Section 12), these 13 identities are served by over **1,700 physical instances** worldwide. Any packet addressed to a root server IP reaches the nearest instance.

### 3.3 TLD Servers

Each TLD has its own set of authoritative nameservers. The root zone delegates to them. For example, the root zone contains:

```
com.    172800  IN  NS  a.gtld-servers.net.
com.    172800  IN  NS  b.gtld-servers.net.
...
a.gtld-servers.net.  172800  IN  A  192.5.6.30
```

The `.com` TLD zone is the largest in the world, containing over **160 million** registered domain names. Verisign operates the `.com` registry and processes over **40 billion queries per day**.

### 3.4 Authoritative Nameservers

When you register `example.com`, you point it to authoritative nameservers — either your registrar's, a DNS hosting provider's (Route 53, Cloudflare, Google Cloud DNS), or your own. These servers hold the actual records (A, AAAA, MX, CNAME, etc.) and return definitive answers.

A domain must have at least **two** authoritative nameservers on separate networks for redundancy. Most DNS providers use 3–4. The NS records for a domain appear in two places:

1. **In the parent zone** (the TLD zone) — the delegation point. These are set at the registrar.
2. **In the domain's own zone** — the authoritative copy. These should match the parent.

### 3.5 Recursive Resolvers

The recursive resolver is the workhorse. It accepts a query ("What is the IP of `www.example.com`?"), performs the iterative resolution process (root → TLD → authoritative), caches the result, and returns it to the client. Most end users never interact with DNS servers other than their configured recursive resolver.

**Common public recursive resolvers:**

| Provider | IPv4 | IPv6 | Notable features |
|----------|------|------|-----------------|
| Google Public DNS | `8.8.8.8`, `8.8.4.4` | `2001:4860:4860::8888` | Global Anycast, DNSSEC validation |
| Cloudflare | `1.1.1.1`, `1.0.0.1` | `2606:4700:4700::1111` | Privacy-focused, fastest average latency |
| Quad9 | `9.9.9.9` | `2620:fe::fe` | Threat-blocking, DNSSEC validation |
| OpenDNS (Cisco) | `208.67.222.222` | — | Content filtering options |

---

## 4. The Resolution Process

### 4.1 Full Resolution Walk-Through

When a user types `www.example.com` in a browser, the following happens:

```
Step 1: Browser checks its own DNS cache
        → Miss

Step 2: OS stub resolver checks the system DNS cache
        → Miss

Step 3: Query sent to configured recursive resolver (e.g., 1.1.1.1)
        Recursive resolver checks its cache
        → Miss (or TTL expired)

Step 4: Recursive resolver queries a root server
        "What is the address of www.example.com?"
        Root server responds: "I don't know, but here are the nameservers for .com"
        → Referral: a.gtld-servers.net, b.gtld-servers.net, ...

Step 5: Recursive resolver queries a .com TLD server
        "What is the address of www.example.com?"
        TLD server responds: "I don't know, but here are the nameservers for example.com"
        → Referral: ns1.example.com (93.184.216.34), ns2.example.com

Step 6: Recursive resolver queries ns1.example.com
        "What is the address of www.example.com?"
        Authoritative server responds: "93.184.216.34"
        → Answer (authoritative)

Step 7: Recursive resolver caches the answer (respecting TTL)
        Returns 93.184.216.34 to the stub resolver

Step 8: OS stub resolver caches the answer
        Returns to the browser

Step 9: Browser caches the answer
        Opens TCP connection to 93.184.216.34
```

**Total time for an uncached lookup:** typically 20–120ms, depending on geographic distance to the servers. Cached lookups: <1ms.

### 4.2 Recursive vs. Iterative Queries

| Query Type | Behavior | Used By |
|-----------|----------|---------|
| **Recursive** | "Give me the final answer or an error — don't send me elsewhere" | Stub resolvers → recursive resolvers |
| **Iterative** | "Give me the best answer you have — a referral is acceptable" | Recursive resolvers → root/TLD/authoritative servers |

The stub resolver sends a recursive query to the recursive resolver. The recursive resolver then performs a series of iterative queries to root, TLD, and authoritative servers. At each step, the server either has the answer or returns a referral to the next server in the chain.

### 4.3 Negative Caching

When a domain does not exist, the authoritative server returns an **NXDOMAIN** response. This is also cached by the recursive resolver — a negative cache entry — for the duration specified by the SOA record's `minimum` field (typically 300–3600 seconds). This prevents repeated queries for non-existent domains.

### 4.4 Glue Records

A chicken-and-egg problem: if `example.com` is served by `ns1.example.com`, how do you resolve `ns1.example.com` without already knowing the nameserver for `example.com`? **Glue records** solve this — the parent zone (`.com`) includes the IP addresses of the child's nameservers directly:

```
example.com.     172800  IN  NS   ns1.example.com.
ns1.example.com. 172800  IN  A    93.184.216.1
```

Glue records are required when the nameserver is **within** the domain it serves (in-bailiwick). If nameservers are in a different domain (e.g., `example.com` served by `ns1.dnshost.net`), no glue is needed — the resolver can look up `ns1.dnshost.net` independently.

---

## 5. DNS Record Types

### 5.1 Core Records

| Type | Purpose | Example Value | RFC |
|------|---------|---------------|-----|
| **A** | Maps domain to IPv4 address | `93.184.216.34` | 1035 |
| **AAAA** | Maps domain to IPv6 address | `2606:2800:220:1:248:1893:25c8:1946` | 3596 |
| **CNAME** | Alias — points to another domain name | `www.example.com → example.com` | 1035 |
| **NS** | Delegates a zone to nameservers | `ns1.example.com` | 1035 |
| **SOA** | Start of Authority — zone metadata | Serial, refresh, retry, expire, minimum TTL | 1035 |
| **MX** | Mail exchange — where to deliver email | `10 mail.example.com` | 1035 |
| **TXT** | Arbitrary text data | `"v=spf1 include:_spf.google.com ~all"` | 1035 |
| **SRV** | Service location (host + port) | `_sip._tcp.example.com 10 60 5060 sip.example.com` | 2782 |
| **PTR** | Reverse lookup — IP to domain | `34.216.184.93.in-addr.arpa → example.com` | 1035 |
| **CAA** | Certificate Authority Authorization | `0 issue "letsencrypt.org"` | 8659 |

### 5.2 A and AAAA Records

The most fundamental records. A single domain can have multiple A records — the resolver returns all of them and the client picks one (often in round-robin order for basic load balancing):

```
example.com.  300  IN  A     93.184.216.34
example.com.  300  IN  A     93.184.216.35
example.com.  300  IN  AAAA  2606:2800:220:1:248:1893:25c8:1946
```

Clients with IPv6 connectivity prefer AAAA records (Happy Eyeballs algorithm, RFC 8305).

### 5.3 CNAME Records

A CNAME (Canonical Name) record creates an alias. When a resolver encounters a CNAME, it restarts the lookup for the target name:

```
www.example.com.   300  IN  CNAME  example.com.
example.com.       300  IN  A      93.184.216.34
```

**Critical restrictions:**
- A CNAME **cannot coexist** with any other record type for the same name. You cannot have both a CNAME and an MX record for `example.com`.
- A CNAME **cannot be placed at the zone apex** (`example.com` itself) because the apex always has NS and SOA records, which would conflict.
- **ALIAS/ANAME records** (non-standard, provider-specific) solve the zone apex limitation — Route 53 calls this an "Alias record," Cloudflare calls it "CNAME flattening."

### 5.4 NS Records

Delegate authority for a zone to specific nameservers:

```
example.com.  86400  IN  NS  ns1.example.com.
example.com.  86400  IN  NS  ns2.example.com.
```

NS records appear at delegation points. The parent zone (`.com`) and the child zone (`example.com`) both contain NS records for the delegation. If they disagree, the child zone's records are authoritative once the resolver reaches it.

### 5.5 SOA Record

Every zone has exactly one SOA record at its apex. It contains zone-wide parameters:

```
example.com.  86400  IN  SOA  ns1.example.com. admin.example.com. (
    2026033101  ; Serial number (conventionally YYYYMMDDNN)
    3600        ; Refresh — secondary checks for updates every 3600s
    900         ; Retry — if refresh fails, retry after 900s
    604800      ; Expire — secondary stops serving after 604800s without update
    86400       ; Minimum TTL — negative cache duration
)
```

The `admin.example.com.` field is the zone administrator's email address, with the first `.` replacing `@` (i.e., `admin@example.com`).

### 5.6 MX Records

Specify mail servers for a domain, with priority (lower = preferred):

```
example.com.  300  IN  MX  10 mail1.example.com.
example.com.  300  IN  MX  20 mail2.example.com.
```

Mail servers try the lowest-priority MX first. If it's unreachable, they fall back to higher values. Equal priorities enable round-robin.

### 5.7 TXT Records

Freeform text, used extensively for domain verification and email security:

```
example.com.  300  IN  TXT  "v=spf1 include:_spf.google.com ~all"
example.com.  300  IN  TXT  "google-site-verification=abc123"
```

A single TXT record can hold up to **255 characters per string**, but multiple strings can be concatenated in one record (up to the 65,535-byte UDP limit in practice). A domain can have multiple TXT records.

### 5.8 SRV Records

Encode host, port, priority, and weight for service discovery:

```
_sip._tcp.example.com.  300  IN  SRV  10 60 5060 sip1.example.com.
_sip._tcp.example.com.  300  IN  SRV  20 40 5060 sip2.example.com.
```

Format: `_service._protocol.domain TTL IN SRV priority weight port target`

Used by protocols like SIP, XMPP, LDAP, and Kubernetes internal service discovery.

### 5.9 PTR Records (Reverse DNS)

Map IP addresses back to domain names. The IP is written in reverse under the `.in-addr.arpa` (IPv4) or `.ip6.arpa` (IPv6) zone:

```
34.216.184.93.in-addr.arpa.  300  IN  PTR  example.com.
```

Reverse DNS is primarily used for email spam filtering (mail servers check that the sending IP's PTR record matches the sender's domain), diagnostics, and logging.

### 5.10 CAA Records

Specify which Certificate Authorities are permitted to issue certificates for a domain:

```
example.com.  300  IN  CAA  0 issue "letsencrypt.org"
example.com.  300  IN  CAA  0 issuewild "letsencrypt.org"
example.com.  300  IN  CAA  0 iodef "mailto:security@example.com"
```

| Tag | Meaning |
|-----|---------|
| `issue` | CAs allowed to issue non-wildcard certificates |
| `issuewild` | CAs allowed to issue wildcard certificates |
| `iodef` | Where to report policy violations |

CAs are required to check CAA records before issuing certificates (RFC 8659, mandatory since September 2017).

---

## 6. Caching and TTL

### 6.1 How TTL Works

Every DNS record has a **Time to Live (TTL)** value in seconds. When a recursive resolver caches a record, it counts down the TTL. When it reaches zero, the record is considered stale and must be re-queried.

```
example.com.  300  IN  A  93.184.216.34
              ^^^
              TTL: cache for 300 seconds (5 minutes)
```

### 6.2 Common TTL Values

| TTL | Duration | Typical Use |
|-----|----------|-------------|
| 60 | 1 minute | Records that change frequently, pre-migration |
| 300 | 5 minutes | Standard for most records |
| 3600 | 1 hour | Stable records, MX records |
| 86400 | 1 day | NS records, very stable infrastructure |
| 172800 | 2 days | TLD delegations in the root zone |

### 6.3 Caching Layers

DNS responses are cached at multiple levels:

| Layer | Cache Duration | Controlled By |
|-------|---------------|---------------|
| Browser DNS cache | Varies (Chrome: up to 1 minute) | Browser vendor |
| OS resolver cache | Respects TTL | Operating system |
| Recursive resolver cache | Respects TTL | Resolver operator |
| Intermediate caches (corporate proxies) | Varies | Network administrator |

### 6.4 TTL Trade-offs

| Low TTL (60–300s) | High TTL (3600–86400s) |
|-------------------|----------------------|
| Changes propagate quickly | Changes take hours to propagate |
| More DNS queries (higher load on authoritative servers) | Fewer queries (lower load) |
| Slightly higher latency for uncached lookups | Better performance from caching |
| Necessary before planned migrations | Good for stable infrastructure |

**Pre-migration pattern:** Before changing a record (e.g., migrating to a new server), lower the TTL to 60 seconds 24–48 hours in advance. Make the change. Wait for the old TTL to expire. Then raise the TTL back.

### 6.5 Minimum TTL Enforcement

Some recursive resolvers enforce a minimum TTL (typically 30–60 seconds) regardless of what the authoritative server specifies. A TTL of 0 means "do not cache," but not all resolvers honor it. Conversely, some resolvers cap the maximum TTL (e.g., Cloudflare 1.1.1.1 caps at 1 hour for certain records).

---

## 7. Zone Files and Zone Transfers

### 7.1 Zone File Format

A zone file is a text file following the RFC 1035 master file format:

```
$ORIGIN example.com.
$TTL 3600

@   IN  SOA  ns1.example.com. admin.example.com. (
        2026033101  ; Serial
        3600        ; Refresh
        900         ; Retry
        604800      ; Expire
        86400       ; Minimum TTL
)

; Nameservers
@       IN  NS   ns1.example.com.
@       IN  NS   ns2.example.com.

; A records
@       IN  A    93.184.216.34
www     IN  A    93.184.216.34
api     IN  A    93.184.216.35

; CNAME
blog    IN  CNAME  www

; Mail
@       IN  MX   10 mail.example.com.
mail    IN  A    93.184.216.40

; TXT
@       IN  TXT  "v=spf1 ip4:93.184.216.0/24 -all"
```

The `@` symbol represents the zone origin (`example.com.` in this case). Relative names (like `www`) are automatically appended with `$ORIGIN`.

### 7.2 Zone Transfers

Zone transfers replicate zone data from a primary (master) nameserver to secondary (slave) nameservers.

| Transfer Type | Mechanism | Description |
|---------------|-----------|-------------|
| **AXFR** | Full zone transfer | Secondary downloads the entire zone |
| **IXFR** | Incremental zone transfer | Secondary downloads only changes since a given serial number |

**NOTIFY** (RFC 1996): The primary server sends a NOTIFY message to secondaries when the zone changes. Secondaries then initiate an IXFR/AXFR to pull updates. This avoids waiting for the SOA refresh interval.

Zone transfers use **TCP on port 53** (not UDP) because the data can exceed the UDP packet size limit.

**Security:** Zone transfers should be restricted by IP (ACL) or authenticated with TSIG (Transaction Signatures, RFC 2845). An unrestricted AXFR exposes the entire zone contents to anyone — this is a common DNS misconfiguration.

---

## 8. The DNS Protocol

### 8.1 Transport

| Transport | Port | When Used |
|-----------|------|-----------|
| **UDP** | 53 | Default for queries. Response must fit in a single packet. |
| **TCP** | 53 | Fallback when response exceeds UDP limit, zone transfers (AXFR/IXFR) |
| **DNS over TLS (DoT)** | 853 | Encrypted queries (see Section 10) |
| **DNS over HTTPS (DoH)** | 443 | Encrypted queries over HTTPS (see Section 10) |

Originally, DNS over UDP was limited to **512 bytes** per message. EDNS(0) (Extension Mechanisms for DNS, RFC 6891) extended this to typically **4096 bytes** by advertising a larger buffer size. If the response still doesn't fit, the server sets the TC (Truncated) flag and the client retries over TCP.

### 8.2 Message Format

Every DNS message (query and response) shares the same structure:

```
+---------------------+
|       Header        |  12 bytes: ID, flags, counts
+---------------------+
|      Question       |  What is being asked (QNAME, QTYPE, QCLASS)
+---------------------+
|       Answer        |  Resource records answering the question
+---------------------+
|      Authority      |  NS records pointing to authoritative servers
+---------------------+
|      Additional     |  Glue records, OPT records (EDNS)
+---------------------+
```

**Header flags:**

| Flag | Meaning |
|------|---------|
| **QR** | 0 = query, 1 = response |
| **Opcode** | 0 = standard query, 1 = inverse, 2 = status |
| **AA** | Authoritative Answer — server is authoritative for the zone |
| **TC** | Truncated — response too large for UDP |
| **RD** | Recursion Desired — client wants recursive resolution |
| **RA** | Recursion Available — server supports recursion |
| **AD** | Authenticated Data — DNSSEC validated |
| **CD** | Checking Disabled — client accepts unvalidated data |

**Response codes (RCODE):**

| Code | Name | Meaning |
|------|------|---------|
| 0 | NOERROR | Query succeeded |
| 1 | FORMERR | Malformed query |
| 2 | SERVFAIL | Server failed to process |
| 3 | NXDOMAIN | Domain does not exist |
| 5 | REFUSED | Server refuses to answer (policy) |
| 9 | NOTAUTH | Server not authoritative for zone |

### 8.3 Name Compression

DNS messages use **label compression** to reduce size. If a domain name (or suffix) has already appeared in the message, subsequent occurrences are replaced with a 2-byte pointer to the first occurrence. This is why DNS responses for `www.example.com` don't repeat `.example.com.` for every record.

---

## 9. DNSSEC — Authenticating DNS Responses

### 9.1 The Problem

Standard DNS has no authentication. A recursive resolver has no way to verify that the response it received from an authoritative server is genuine. An attacker who can intercept or spoof DNS responses can redirect traffic to malicious servers (cache poisoning, man-in-the-middle). The response looks identical to a legitimate one.

### 9.2 How DNSSEC Works

DNSSEC (DNS Security Extensions, RFCs 4033–4035) adds cryptographic signatures to DNS records. It does **not encrypt** DNS traffic — it only provides **authentication** (proof of origin) and **integrity** (proof the data wasn't modified in transit).

**Chain of trust:**

```
Root Zone (.)
  │ Signs .com DS record with root KSK
  ▼
.com TLD Zone
  │ Signs example.com DS record with .com KSK
  ▼
example.com Zone
  │ Signs all records with example.com ZSK
  ▼
Individual records (A, AAAA, MX, etc.)
  Each signed → RRSIG record
```

### 9.3 DNSSEC Record Types

| Type | Purpose |
|------|---------|
| **DNSKEY** | Public keys for the zone (KSK and ZSK) |
| **RRSIG** | Signature over a record set (e.g., all A records for a name) |
| **DS** | Delegation Signer — hash of child zone's KSK, stored in parent zone |
| **NSEC / NSEC3** | Authenticated denial of existence — proves a record does NOT exist |

### 9.4 Key Types

| Key | Purpose | Stored In | Rotation |
|-----|---------|-----------|----------|
| **KSK** (Key Signing Key) | Signs DNSKEY records; anchor of trust for the zone | Zone + parent (as DS) | Infrequent (yearly+) |
| **ZSK** (Zone Signing Key) | Signs all other record sets | Zone only | Frequent (monthly–quarterly) |

The KSK is larger (2048-bit RSA or equivalent) and rarely changes. The ZSK is smaller (1024-bit RSA or equivalent) and rotated regularly for operational security.

### 9.5 Validation Flow

1. Resolver obtains the root zone's KSK (configured as a **trust anchor** — hardcoded in the resolver)
2. Resolver verifies the `.com` DS record using the root's signature
3. Resolver verifies `example.com`'s DS record using `.com`'s signature
4. Resolver verifies `example.com`'s DNSKEY using the DS hash
5. Resolver verifies the A record for `www.example.com` using `example.com`'s ZSK
6. If any step fails → **SERVFAIL** (validation failure)

### 9.6 DNSSEC Adoption

As of 2026, DNSSEC is signed on approximately **5–10%** of `.com` domains. The root zone and most TLDs are signed. Validation is performed by most major recursive resolvers (Google Public DNS, Cloudflare, Quad9). The biggest barrier to adoption is operational complexity — key rollovers, signature expiration, and debugging validation failures.

---

## 10. DNS Privacy — DoT and DoH

### 10.1 The Problem

Traditional DNS queries are sent in **plaintext over UDP**. Anyone on the network path (ISP, Wi-Fi operator, corporate proxy) can see which domains a user is resolving. This enables surveillance, censorship, and profiling.

### 10.2 DNS over TLS (DoT)

| Property | Value |
|----------|-------|
| Port | 853 |
| Transport | TLS over TCP |
| RFC | 7858 |
| Encryption | TLS 1.2 or 1.3 |

The client opens a TLS connection to the recursive resolver on port 853 and sends standard DNS messages over the encrypted channel. The resolver authenticates via its TLS certificate.

**Advantage:** Network operators can distinguish DNS traffic (port 853) from HTTPS traffic (port 443), enabling DNS-specific policies.

**Disadvantage:** Port 853 is easily blocked by censors or firewalls.

### 10.3 DNS over HTTPS (DoH)

| Property | Value |
|----------|-------|
| Port | 443 |
| Transport | HTTPS (HTTP/2 or HTTP/3) |
| RFC | 8484 |
| Content-Type | `application/dns-message` (wire format) or `application/dns-json` |

DNS queries are sent as HTTPS requests to a resolver's endpoint (e.g., `https://cloudflare-dns.com/dns-query`). The query is either in the URL (GET) or the body (POST).

**Advantage:** Indistinguishable from normal HTTPS traffic — very difficult to block or detect.

**Disadvantage:** Bypasses local DNS policies (corporate content filtering, parental controls). Centralizes DNS resolution at a few large providers.

### 10.4 Comparison

| Feature | Traditional DNS | DoT | DoH |
|---------|----------------|-----|-----|
| Encryption | None | TLS | TLS (via HTTPS) |
| Port | 53 | 853 | 443 |
| Blockable | Yes | Yes (dedicated port) | Difficult (same port as all HTTPS) |
| Browser support | N/A | OS-level | Firefox, Chrome, Edge, Safari |
| Performance overhead | None | TLS handshake | TLS + HTTP framing |

---

## 11. DNS Security Threats

### 11.1 Cache Poisoning

An attacker sends forged DNS responses to a recursive resolver, hoping to inject a false record into the cache. If successful, all clients using that resolver receive the attacker's IP for the targeted domain.

**The Kaminsky Attack (2008):** Dan Kaminsky demonstrated that by flooding a recursive resolver with queries for random subdomains of a target and racing to inject forged responses, an attacker could poison the cache for an entire domain. The attack exploited the predictability of DNS transaction IDs (16-bit, 65,536 possible values) and source ports.

**Mitigations:**
- **Source port randomization** — makes spoofed responses harder to match (now standard)
- **DNSSEC** — cryptographic validation rejects forged responses
- **0x20 encoding** — randomizes case in query names (e.g., `wWw.eXaMpLe.COM`) and checks that the response preserves the case, adding entropy beyond the transaction ID

### 11.2 DNS Amplification DDoS

DNS servers return responses much larger than the queries. An attacker sends small queries with a spoofed source IP (the victim's IP) to open resolvers. The resolvers send large responses to the victim, amplifying the attack.

**Amplification factor:** DNS can amplify traffic by **28–54x** (a 64-byte query can produce a 3,000+ byte response, especially with DNSSEC or ANY queries).

**Mitigations:**
- Disable open recursion (recursive resolvers should only serve known clients)
- Rate limiting on authoritative servers
- Response Rate Limiting (RRL) — RFC 6891
- BCP38 (network ingress filtering) prevents source IP spoofing

### 11.3 DNS Hijacking

An attacker modifies DNS responses or takes control of DNS infrastructure:

| Method | Mechanism |
|--------|-----------|
| **Router compromise** | Change DNS settings on a home/office router |
| **Registrar hijacking** | Gain access to domain registrar and change NS records |
| **BGP hijacking** | Announce routes for DNS server IPs to intercept traffic |
| **Rogue DHCP** | Push attacker-controlled DNS resolver to clients |
| **Man-in-the-middle** | Intercept and modify DNS responses on the network |

### 11.4 DNS Tunneling

DNS can be used as a covert channel for data exfiltration or command-and-control. Data is encoded in DNS queries (subdomains) and responses (TXT records). Because DNS traffic is rarely blocked and often uninspected, it bypasses many firewalls.

Example: Encoding data in subdomains — `dGVzdA.tunnel.attacker.com` where `dGVzdA` is base64-encoded data. The attacker's authoritative server decodes the subdomain and responds with encoded data in TXT records.

### 11.5 NXDOMAIN Attacks

Flooding a recursive resolver with queries for non-existent domains forces it to perform full resolution for every query (no cache hits), consuming CPU and bandwidth. Also called "random subdomain attacks" or "water torture attacks."

---

## 12. Anycast and DNS Load Distribution

### 12.1 What Anycast Is

Anycast assigns the **same IP address** to multiple servers in different locations. Network routing (BGP) directs each client's packets to the **nearest** instance based on routing topology, not geographic distance.

```
Client in Tokyo
   │
   └── BGP routing ──► Root server instance in Tokyo (same IP as all other instances)

Client in London
   │
   └── BGP routing ──► Root server instance in London (same IP)
```

### 12.2 Anycast in DNS

Every root server uses Anycast. Most major DNS providers (Cloudflare, Google, Route 53) use Anycast for their authoritative and recursive services. Benefits:

| Benefit | How |
|---------|-----|
| **Low latency** | Queries reach the nearest instance |
| **DDoS resilience** | Attack traffic is distributed across all instances |
| **Automatic failover** | If an instance goes down, BGP withdraws its route and traffic shifts |
| **No client configuration** | Same IP works worldwide |

### 12.3 Anycast vs. Unicast

| Property | Unicast | Anycast |
|----------|---------|---------|
| IP-to-server mapping | One-to-one | One-to-many |
| Client configuration | Specific server IP | Same IP, nearest server |
| Failover | Client must switch IP | Automatic via BGP |
| Best for | Persistent connections (TCP) | Stateless/short-lived (DNS over UDP) |

DNS over UDP works well with Anycast because each query-response pair is independent. TCP-based DNS (zone transfers, DoT) requires more care — BGP route changes mid-connection can break the TCP session.

---

## 13. DNS-Based Load Balancing and Failover

### 13.1 Round-Robin DNS

The simplest form: multiple A/AAAA records for the same name. Resolvers and clients rotate through them:

```
api.example.com.  60  IN  A  10.0.1.1
api.example.com.  60  IN  A  10.0.1.2
api.example.com.  60  IN  A  10.0.1.3
```

**Limitations:** No health checking — if `10.0.1.2` goes down, one-third of clients still receive it. No geographic awareness. Caching makes the distribution uneven.

### 13.2 Weighted DNS

Some DNS providers support weighted records (e.g., Route 53, Cloudflare Load Balancing). Assign weights to control traffic distribution:

| Record | Weight | Traffic Share |
|--------|--------|---------------|
| `10.0.1.1` | 70 | 70% |
| `10.0.1.2` | 20 | 20% |
| `10.0.1.3` | 10 | 10% |

Useful for canary deployments, gradual migrations, and capacity management.

### 13.3 GeoDNS

Return different IP addresses based on the client's geographic location (inferred from the resolver's IP or EDNS Client Subnet):

| Client Location | Resolved IP | Data Center |
|----------------|-------------|-------------|
| Europe | `10.0.2.1` | Frankfurt |
| North America | `10.0.3.1` | Virginia |
| Asia-Pacific | `10.0.4.1` | Tokyo |

Used by CDNs and global services to route users to the nearest endpoint.

### 13.4 DNS Health Checks and Failover

Managed DNS providers (Route 53, Cloudflare, NS1) monitor endpoint health and automatically remove unhealthy records from responses:

```
Normal state:
  api.example.com → 10.0.1.1 (healthy), 10.0.1.2 (healthy)

After health check failure:
  api.example.com → 10.0.1.1 (healthy)
  [10.0.1.2 removed from responses]
```

Failover TTL must be low enough for changes to propagate quickly. A TTL of 60 seconds means up to 60 seconds of downtime after a failure is detected.

---

## 14. Private DNS and Split-Horizon

### 14.1 Private DNS Zones

Organizations run internal DNS zones that are not visible on the public internet:

```
Public DNS:      example.com    →  93.184.216.34  (web server)
Internal DNS:    db.internal    →  10.0.5.20      (database, private IP)
                 k8s.internal   →  10.0.6.0/24    (Kubernetes cluster)
```

Private DNS is typically served by internal resolvers (Active Directory DNS, CoreDNS in Kubernetes, Amazon Route 53 Resolver for VPCs).

### 14.2 Split-Horizon DNS

The same domain returns different answers depending on who is asking:

| Requester | Query | Response | Reason |
|-----------|-------|----------|--------|
| External user | `app.example.com` | `93.184.216.34` (public IP, through load balancer) | Standard public access |
| Internal employee | `app.example.com` | `10.0.1.5` (private IP, direct) | Bypass load balancer, lower latency |

Implemented by configuring separate views/zones on the authoritative server — one for internal resolvers, one for external. BIND calls these "views." Cloud providers offer similar features (Route 53 private hosted zones, Azure Private DNS zones).

### 14.3 DNS in Kubernetes

Kubernetes runs its own DNS service (CoreDNS or kube-dns) within the cluster:

```
Service DNS:        my-service.my-namespace.svc.cluster.local
Pod DNS:            10-0-1-5.my-namespace.pod.cluster.local
Headless service:   pod-name.my-service.my-namespace.svc.cluster.local
External:           Falls through to upstream resolver
```

Every pod's `/etc/resolv.conf` points to the cluster DNS service IP. The search domains enable short names — `my-service` resolves to `my-service.my-namespace.svc.cluster.local` within the same namespace.

---

## 15. DNS Propagation

### 15.1 What "Propagation" Really Means

"DNS propagation" is a common but slightly misleading term. DNS does not push changes to servers worldwide. Instead, caches expire based on TTL, and resolvers re-query when the cache entry is stale. "Propagation time" is the duration until all caches worldwide have expired their old entries and fetched the new ones.

### 15.2 What Affects Propagation Time

| Factor | Impact |
|--------|--------|
| **TTL of the old record** | The primary factor — caches hold the old answer until the TTL expires |
| **Recursive resolver behavior** | Some resolvers serve stale data while revalidating (RFC 8767) |
| **Negative cache TTL** | If the record didn't exist before, SOA minimum TTL controls how long NXDOMAIN is cached |
| **NS record TTL** | If changing nameservers, the parent zone's NS TTL matters (often 48 hours for TLDs) |
| **Browser/OS caches** | May not honor TTL exactly (Chrome caps at ~1 minute) |

### 15.3 Propagation Timeline

| Change Type | Typical Propagation | Reason |
|-------------|-------------------|--------|
| A/AAAA record (TTL 300) | 5 minutes | Caches expire within one TTL period |
| A/AAAA record (TTL 86400) | Up to 24 hours | High TTL means long cache lifetime |
| NS record change (registrar) | 24–48 hours | TLD zone NS records have high TTLs |
| New domain (first time) | Minutes | No caches to expire — fresh lookups |

### 15.4 Checking Propagation

Query multiple resolvers worldwide to see if they've picked up the change:

```bash
# Query specific resolvers
dig @8.8.8.8 example.com A
dig @1.1.1.1 example.com A
dig @9.9.9.9 example.com A

# Query authoritative server directly (bypasses caches)
dig @ns1.example.com example.com A
```

---

## 16. Email-Related DNS Records

DNS is fundamental to email delivery. Multiple record types work together for routing, authentication, and spam prevention.

### 16.1 SPF (Sender Policy Framework)

Published as a TXT record. Specifies which IP addresses and servers are authorized to send email for the domain:

```
example.com.  300  IN  TXT  "v=spf1 ip4:93.184.216.0/24 include:_spf.google.com -all"
```

| Mechanism | Meaning |
|-----------|---------|
| `ip4:` / `ip6:` | Allow these IP ranges |
| `include:` | Also allow servers authorized by this other domain's SPF |
| `a` | Allow the domain's own A record IPs |
| `mx` | Allow the domain's MX servers |
| `-all` | Hard fail — reject all others |
| `~all` | Soft fail — accept but mark as suspicious |

### 16.2 DKIM (DomainKeys Identified Mail)

Published as a TXT record under a selector subdomain. Contains the public key used to verify email signatures:

```
selector1._domainkey.example.com.  300  IN  TXT  "v=DKIM1; k=rsa; p=MIGfMA0GCSqGS..."
```

The sending server signs outgoing emails with the private key. Receiving servers look up the public key via DNS and verify the signature.

### 16.3 DMARC (Domain-based Message Authentication, Reporting, and Conformance)

Published as a TXT record under `_dmarc.domain`:

```
_dmarc.example.com.  300  IN  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc@example.com; pct=100"
```

| Tag | Meaning |
|-----|---------|
| `p=none` | Monitor only — don't reject anything |
| `p=quarantine` | Mark failing emails as spam |
| `p=reject` | Reject failing emails entirely |
| `rua=` | Where to send aggregate reports |
| `ruf=` | Where to send forensic (failure) reports |

### 16.4 MTA-STS and DANE

**MTA-STS** (RFC 8461): A TXT record at `_mta-sts.example.com` signals that the domain supports encrypted email delivery. A policy file at `https://mta-sts.example.com/.well-known/mta-sts.txt` specifies the required TLS version and MX servers.

**DANE** (DNS-Based Authentication of Named Entities, RFC 6698): TLSA records in DNSSEC-signed zones bind TLS certificates to specific services, eliminating reliance on Certificate Authorities for email encryption.

---

## 17. CDN and Cloud Provider DNS Integration

### 17.1 CNAME at the Zone Apex Problem

Many cloud services require pointing a domain at a hostname (e.g., `d1234.cloudfront.net`), which normally requires a CNAME. But the zone apex (`example.com`) cannot have a CNAME (it conflicts with NS and SOA records). Providers solve this with proprietary record types:

| Provider | Solution | Name |
|----------|----------|------|
| AWS Route 53 | Alias record (resolved at query time, no CNAME in response) | Alias |
| Cloudflare | CNAME flattening (resolves CNAME to A at the edge) | Flattened CNAME |
| Google Cloud DNS | Routing policies with CNAME-like behavior | N/A |
| DNSimple, NS1 | ALIAS record (resolved server-side) | ALIAS / ANAME |

These records are invisible to the querying client — they receive a standard A/AAAA response.

### 17.2 DNS with CDNs

CDNs use DNS to route users to the nearest edge server:

1. User resolves `assets.example.com`
2. `assets.example.com` has a CNAME → `d1234.cloudfront.net`
3. CloudFront's DNS returns an Anycast IP of the nearest edge location
4. User connects to nearby edge, which serves cached content

The entire routing decision happens in DNS — no redirects, no extra round trips.

### 17.3 DNS with Cloud Load Balancers

Cloud load balancers (AWS ALB/NLB, GCP, Azure) expose DNS names, not static IPs (ALB IPs change). Domains point to the load balancer via CNAME or Alias/ANAME:

```
api.example.com  →  ALIAS  →  my-alb-1234.us-east-1.elb.amazonaws.com
                                    │
                              Route 53 resolves to current ALB IPs
                                    │
                              Returns A record: 10.0.1.50
```

---

## 18. Diagnostic Tools

### 18.1 dig

The standard DNS diagnostic tool. Returns the full DNS response with all sections:

```bash
# Basic lookup
dig example.com A

# Query a specific resolver
dig @8.8.8.8 example.com MX

# Trace the full resolution path (root → TLD → authoritative)
dig +trace example.com A

# Short answer only
dig +short example.com A

# Show all record types
dig example.com ANY

# Check DNSSEC
dig +dnssec example.com A
```

### 18.2 nslookup

Simpler than dig, available on all platforms:

```bash
nslookup example.com
nslookup -type=MX example.com
nslookup example.com 8.8.8.8
```

### 18.3 host

Concise output:

```bash
host example.com
host -t MX example.com
host 93.184.216.34    # Reverse lookup
```

### 18.4 whois

Domain registration information (not DNS per se, but essential for debugging):

```bash
whois example.com
```

Returns registrar, nameservers, registration/expiration dates, and registrant information (if not privacy-protected).

### 18.5 Common Diagnostic Patterns

| Symptom | Diagnostic Command | What to Look For |
|---------|-------------------|-----------------|
| Site unreachable | `dig +trace example.com` | Where the resolution chain breaks |
| Wrong IP returned | `dig @ns1.example.com example.com A` | Check authoritative answer vs cached |
| Email not delivering | `dig example.com MX` then `dig mail.example.com A` | MX exists, mail server resolves |
| SSL certificate error | `dig example.com CAA` | CAA record may block the CA |
| Slow resolution | `dig example.com A +stats` | Check query time at bottom |
| DNSSEC failure | `dig +cd example.com A` (disables validation) | If this works but normal query doesn't → DNSSEC issue |

---

## Appendix A: Technical Constants

| Constant | Value | Context |
|----------|-------|---------|
| Root server identities | 13 (A through M) | Named `a.root-servers.net` through `m.root-servers.net` |
| Root server physical instances | ~1,700+ | Via Anycast |
| DNS UDP port | 53 | Standard queries |
| DNS TCP port | 53 | Zone transfers, large responses |
| DoT port | 853 | DNS over TLS |
| DoH port | 443 | DNS over HTTPS |
| Max label length | 63 characters | Per label (between dots) |
| Max FQDN length | 253 characters (255 octets wire format) | Including dots |
| Original UDP limit | 512 bytes | Pre-EDNS(0) |
| EDNS(0) typical buffer | 4096 bytes | Extended UDP |
| DNS header size | 12 bytes | Fixed for all messages |
| Transaction ID size | 16 bits (65,536 values) | Per-query identifier |
| RCODE field | 4 bits (16 values) | Response status codes |
| Root zone TLD count | ~1,500 | As of 2026 |
| `.com` registered domains | ~160 million | Largest TLD |
| `.com` daily query volume | ~40 billion | Verisign-operated |
| DNSSEC root KSK algorithm | RSA 2048-bit (transitioning to ECDSA) | Trust anchor |
| DNSSEC root KSK rollover | 2018 (first), next TBD | KSK-2017 is current |
| SPF DNS lookup limit | 10 | Per SPF evaluation (RFC 7208) |
| DMARC record location | `_dmarc.domain` | TXT record |
| MTA-STS record location | `_mta-sts.domain` | TXT record |
| DKIM record location | `selector._domainkey.domain` | TXT record |
| Typical uncached lookup time | 20–120ms | Full resolution chain |
| Typical cached lookup time | <1ms | From resolver cache |

---

## Appendix B: Complete Record Type Reference

| Type | Value | RFC | Description |
|------|-------|-----|-------------|
| A | 1 | 1035 | IPv4 address |
| NS | 2 | 1035 | Nameserver delegation |
| CNAME | 5 | 1035 | Canonical name (alias) |
| SOA | 6 | 1035 | Start of Authority — zone parameters |
| PTR | 12 | 1035 | Pointer for reverse lookups |
| MX | 15 | 1035 | Mail exchange |
| TXT | 16 | 1035 | Text data (SPF, DKIM, DMARC, verification) |
| AAAA | 28 | 3596 | IPv6 address |
| SRV | 33 | 2782 | Service locator (host + port + priority + weight) |
| NAPTR | 35 | 3403 | Naming Authority Pointer (ENUM, SIP) |
| DS | 43 | 4034 | Delegation Signer (DNSSEC) |
| SSHFP | 44 | 4255 | SSH public key fingerprint |
| RRSIG | 46 | 4034 | DNSSEC signature |
| NSEC | 47 | 4034 | Next Secure (DNSSEC authenticated denial) |
| DNSKEY | 48 | 4034 | DNSSEC public key |
| NSEC3 | 50 | 5155 | Hashed authenticated denial (DNSSEC) |
| NSEC3PARAM | 51 | 5155 | NSEC3 parameters |
| TLSA | 52 | 6698 | TLS certificate association (DANE) |
| SMIMEA | 53 | 8162 | S/MIME certificate association |
| OPENPGPKEY | 61 | 7929 | OpenPGP public key |
| SVCB | 64 | 9460 | Service Binding (general) |
| HTTPS | 65 | 9460 | HTTPS service binding (ECH, ALPN hints) |
| CAA | 257 | 8659 | Certificate Authority Authorization |
