const HABITS = [
  ['Fajr prayer', '🌙', 'recovery', 'purple', 1],
  ['Study session', '📖', 'learning', 'blue', 2],
  ['Screen control', '📵', 'recovery', 'red', 3],
  ['Exercise', '💪', 'health', 'green', 4],
  ['No relapse', '🔒', 'recovery', 'amber', 5],
  ['Sleep 7h+', '😴', 'health', 'cyan', 6],
];

const ROADMAP = {
  name: 'Web Pentesting Path', description: 'From fundamentals to bug bounty', icon: '⬡', color: 'blue',
  groups: [
    { name: 'Web Fundamentals', icon: '🌐', color: 'blue', order: 1, description: 'Core concepts every web hacker must master', items: [
      { name: 'HTTP Deep Dive', description: 'Protocol-level understanding of web communication', diff: 'beginner', hours: 4, tags: 'http,protocol',
        resources: [{ title: 'HTTP MDN Docs', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP', type: 'docs' }, { title: 'PortSwigger Learning Path', url: 'https://portswigger.net/web-security/learning-paths', type: 'course' }],
        labs: [{ title: 'Burp Suite Basics', url: 'https://portswigger.net/web-security/getting-started', platform: 'PortSwigger' }],
        subs: ['HTTP methods (GET,POST,PUT,DELETE)', 'Status codes (2xx,3xx,4xx,5xx)', 'Request/Response structure', 'Headers deep dive', 'HTTP/1.1 vs HTTP/2', 'Keep-alive connections'] },
      { name: 'Authentication & Sessions', description: 'How web apps identify and track users', diff: 'intermediate', hours: 6, tags: 'auth,session,jwt',
        resources: [{ title: 'OWASP Session Management', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html', type: 'reference' }, { title: 'PortSwigger Auth Labs', url: 'https://portswigger.net/web-security/authentication', type: 'course' }],
        labs: [{ title: 'Authentication vulnerabilities', url: 'https://portswigger.net/web-security/authentication', platform: 'PortSwigger' }],
        subs: ['Cookie mechanics', 'Session tokens', 'JWT structure & attacks', 'OAuth 2.0 flow', 'Password storage (hashing)', 'MFA bypass techniques'] },
      { name: 'Cookies & Web Storage', description: 'Client-side data storage security implications', diff: 'beginner', hours: 3, tags: 'cookies,storage',
        resources: [{ title: 'OWASP Cookie Security', url: 'https://owasp.org/www-community/controls/SecureCookieAttribute', type: 'reference' }], labs: [],
        subs: ['Secure, HttpOnly, SameSite flags', 'localStorage vs sessionStorage', 'Cookie scope (Domain/Path)', 'Cookie theft attacks'] },
      { name: 'Same-Origin Policy & CORS', description: 'Browser security model and CORS bypasses', diff: 'intermediate', hours: 4, tags: 'cors,sop',
        resources: [{ title: 'PortSwigger CORS', url: 'https://portswigger.net/web-security/cors', type: 'course' }],
        labs: [{ title: 'CORS vulnerability labs', url: 'https://portswigger.net/web-security/cors', platform: 'PortSwigger' }],
        subs: ['SOP rules', 'CORS headers explained', 'Preflight requests', 'CORS misconfiguration attacks', 'Null origin bypass'] },
    ]},
    { name: 'Client-Side Vulns', icon: '🔥', color: 'red', order: 2, description: 'Attacks executing in the victim\'s browser', items: [
      { name: 'Cross-Site Scripting (XSS)', description: 'Injecting malicious scripts into pages', diff: 'intermediate', hours: 8, tags: 'xss,injection,client-side',
        resources: [{ title: 'PortSwigger XSS', url: 'https://portswigger.net/web-security/cross-site-scripting', type: 'course' }, { title: 'OWASP XSS Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/XSS_Filter_Evasion_Cheat_Sheet.html', type: 'reference' }],
        labs: [{ title: 'Reflected XSS', url: 'https://portswigger.net/web-security/cross-site-scripting/reflected', platform: 'PortSwigger' }, { title: 'Stored XSS', url: 'https://portswigger.net/web-security/cross-site-scripting/stored', platform: 'PortSwigger' }, { title: 'DOM XSS', url: 'https://portswigger.net/web-security/cross-site-scripting/dom-based', platform: 'PortSwigger' }],
        subs: ['Reflected XSS', 'Stored XSS', 'DOM-Based XSS', 'XSS filter bypass', 'Content Security Policy (CSP)', 'XSS to account takeover'] },
      { name: 'CSRF', description: 'Forging cross-site requests on behalf of users', diff: 'intermediate', hours: 4, tags: 'csrf',
        resources: [{ title: 'PortSwigger CSRF', url: 'https://portswigger.net/web-security/csrf', type: 'course' }],
        labs: [{ title: 'CSRF labs', url: 'https://portswigger.net/web-security/csrf', platform: 'PortSwigger' }],
        subs: ['CSRF mechanics', 'Token-based defenses', 'SameSite cookie defense', 'CSRF via XSS', 'JSON CSRF'] },
      { name: 'Clickjacking', description: 'UI redress attacks via invisible iframes', diff: 'beginner', hours: 2, tags: 'clickjacking,ui-redress',
        resources: [{ title: 'PortSwigger Clickjacking', url: 'https://portswigger.net/web-security/clickjacking', type: 'course' }],
        labs: [{ title: 'Clickjacking labs', url: 'https://portswigger.net/web-security/clickjacking', platform: 'PortSwigger' }],
        subs: ['iframe overlay attacks', 'X-Frame-Options', 'CSP frame-ancestors', 'Multistep clickjacking'] },
    ]},
    { name: 'Server-Side Vulns', icon: '⚙️', color: 'amber', order: 3, description: 'Attacks executing on the target server', items: [
      { name: 'SQL Injection', description: 'Manipulating database queries through input', diff: 'intermediate', hours: 10, tags: 'sqli,database',
        resources: [{ title: 'PortSwigger SQLi', url: 'https://portswigger.net/web-security/sql-injection', type: 'course' }, { title: 'SQLi Cheat Sheet', url: 'https://portswigger.net/web-security/sql-injection/cheat-sheet', type: 'reference' }],
        labs: [{ title: 'SQLi Labs (15+)', url: 'https://portswigger.net/web-security/sql-injection', platform: 'PortSwigger' }, { title: 'HackTheBox SQLi', url: 'https://hackthebox.com', platform: 'HackTheBox' }],
        subs: ['In-band SQLi (UNION)', 'Blind Boolean SQLi', 'Time-based SQLi', 'Second-order SQLi', 'WAF bypass', 'SQLmap automation'] },
      { name: 'SSRF', description: 'Making servers fetch internal resources', diff: 'advanced', hours: 6, tags: 'ssrf,server-side',
        resources: [{ title: 'PortSwigger SSRF', url: 'https://portswigger.net/web-security/ssrf', type: 'course' }],
        labs: [{ title: 'SSRF labs', url: 'https://portswigger.net/web-security/ssrf', platform: 'PortSwigger' }],
        subs: ['Basic SSRF to localhost', 'Cloud metadata SSRF', 'Blind SSRF', 'SSRF bypass techniques', 'Protocol smuggling'] },
      { name: 'Path Traversal', description: 'Reading files outside the web root', diff: 'beginner', hours: 3, tags: 'lfi,traversal',
        resources: [{ title: 'PortSwigger Path Traversal', url: 'https://portswigger.net/web-security/file-path-traversal', type: 'course' }],
        labs: [{ title: 'Path traversal labs', url: 'https://portswigger.net/web-security/file-path-traversal', platform: 'PortSwigger' }],
        subs: ['Basic ../ traversal', 'Encoding bypass', 'Null byte bypass', 'Validation bypass patterns'] },
      { name: 'OS Command Injection', description: 'Executing system commands via application', diff: 'intermediate', hours: 5, tags: 'rce,os-injection',
        resources: [{ title: 'PortSwigger Command Injection', url: 'https://portswigger.net/web-security/os-command-injection', type: 'course' }],
        labs: [{ title: 'Command injection labs', url: 'https://portswigger.net/web-security/os-command-injection', platform: 'PortSwigger' }],
        subs: ['Inline injection (;,&&,||)', 'Blind via time delay', 'Out-of-band techniques', 'Filter bypass patterns'] },
    ]},
    { name: 'Recon & Discovery', icon: '🔍', color: 'purple', order: 4, description: 'Finding attack surface before exploitation', items: [
      { name: 'Passive Recon & OSINT', description: 'Gathering info without touching the target', diff: 'beginner', hours: 4, tags: 'osint,passive',
        resources: [{ title: 'OSINT Framework', url: 'https://osintframework.com', type: 'tool' }, { title: 'Shodan', url: 'https://shodan.io', type: 'tool' }, { title: 'Google Dorking Database', url: 'https://www.exploit-db.com/google-hacking-database', type: 'reference' }], labs: [],
        subs: ['Google dorking (GHDB)', 'Shodan/Censys queries', 'Certificate transparency logs', 'GitHub dorking', 'LinkedIn OSINT', 'Wayback Machine'] },
      { name: 'Active Recon & Fuzzing', description: 'Probing the target directly for content', diff: 'intermediate', hours: 5, tags: 'fuzzing,active',
        resources: [{ title: 'ffuf', url: 'https://github.com/ffuf/ffuf', type: 'tool' }, { title: 'SecLists', url: 'https://github.com/danielmiessler/SecLists', type: 'tool' }], labs: [],
        subs: ['Directory fuzzing (ffuf)', 'Parameter fuzzing', 'VHost fuzzing', 'API endpoint discovery', 'Wordlist strategy'] },
      { name: 'Subdomain Enumeration', description: 'Expanding attack surface through subdomains', diff: 'intermediate', hours: 4, tags: 'subdomains,dns',
        resources: [{ title: 'Subfinder', url: 'https://github.com/projectdiscovery/subfinder', type: 'tool' }, { title: 'Amass', url: 'https://github.com/owasp-amass/amass', type: 'tool' }], labs: [],
        subs: ['Passive subdomain sources', 'Brute-force fuzzing', 'DNS takeover identification', 'ASN enumeration', 'Permutation discovery'] },
    ]},
    { name: 'Bug Bounty & Tools', icon: '💰', color: 'green', order: 5, description: 'Professional methodology and essential tools', items: [
      { name: 'Bug Bounty Methodology', description: 'Structured approach to finding and reporting bugs', diff: 'intermediate', hours: 6, tags: 'methodology,bug-bounty',
        resources: [{ title: 'Jason Haddix Methodology', url: 'https://github.com/jhaddix/tbhm', type: 'reference' }, { title: 'HackerOne Hacktivity', url: 'https://hackerone.com/hacktivity', type: 'reference' }], labs: [],
        subs: ['Target selection strategy', 'Scope analysis', 'Recon automation pipeline', 'Vulnerability prioritization', 'WAF/rate-limit bypass'] },
      { name: 'Report Writing', description: 'Communicating vulnerabilities to get paid', diff: 'beginner', hours: 3, tags: 'reporting,writing',
        resources: [{ title: 'HackerOne Report Guide', url: 'https://docs.hackerone.com/hackers/submitting-reports.html', type: 'docs' }, { title: 'CVSS Calculator', url: 'https://www.first.org/cvss/calculator/3.1', type: 'tool' }], labs: [],
        subs: ['Impact-first title framing', 'CVSS severity scoring', 'Step-by-step reproduction', 'PoC screenshots/video', 'Remediation recommendations'] },
      { name: 'Burp Suite Mastery', description: 'Your primary web pentesting proxy', diff: 'intermediate', hours: 8, tags: 'burp,tools',
        resources: [{ title: 'Burp Suite Docs', url: 'https://portswigger.net/burp/documentation', type: 'docs' }],
        labs: [{ title: 'Web Academy (Burp)', url: 'https://portswigger.net/web-security', platform: 'PortSwigger' }],
        subs: ['Intercepting & modifying requests', 'Repeater for manual testing', 'Intruder for fuzzing', 'Collaborator for OOB', 'Turbo Intruder extension'] },
    ]},
  ]
};

const PROJECTS = [
  { name: 'Pentesting Playground', description: 'Local vulnerable lab for practice and tool testing', status: 'active', stage: 'building', tags: 'labs,docker,tools', tech: 'Docker,Linux,DVWA', color: 'red', progress: 20 },
  { name: 'Methodology Vault', description: 'Personal pentesting methodology and checklists', status: 'planning', stage: 'idea', tags: 'methodology,docs', tech: 'Markdown', color: 'blue', progress: 5 },
  { name: 'RedCell OS', description: 'This personal operating system — built in Node.js', status: 'active', stage: 'building', tags: 'nodejs,webdev,portfolio', tech: 'Node.js,SQLite,CSS', color: 'purple', progress: 75 },
];

const NOTE_CATS = [
  { name: 'Web Security', icon: '🔐', color: 'red', parent: null, order: 1 },
  { name: 'Vulnerabilities', icon: '⚡', color: 'amber', parent: 'Web Security', order: 2 },
  { name: 'Tools & Setup', icon: '🛠️', color: 'cyan', parent: null, order: 3 },
  { name: 'University', icon: '🎓', color: 'green', parent: null, order: 4 },
  { name: 'Personal', icon: '📝', color: 'purple', parent: null, order: 5 },
];

module.exports = { HABITS, ROADMAP, PROJECTS, NOTE_CATS };
