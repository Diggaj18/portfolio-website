# Website security

This is a **public, static GitHub Pages website**. Its current code has no server, database, user accounts, API endpoints, admin routes, or contact form. Do not store credentials or private data in HTML, CSS, JavaScript, or any published asset. Browser code cannot keep secrets.

## Safeguards in this repository

- A restrictive Content Security Policy is declared in index.html. It permits this site's files, Google Fonts, and the existing Three.js CDN, and denies network connections and form submissions. The SVG image fallback requires data: images.
- A referrer policy limits what visiting another website reveals about the navigation source.
- JavaScript text used in generated SVG placeholders is XML-escaped.
- A read-only GitHub Actions workflow checks syntax, policy, and common credential patterns in current tracked text files.
- .gitignore reduces accidental commits of secret files. It does **not** hide existing commits or files already uploaded, and it cannot protect values in client-side code.
- The favicon workflow is manual and read-only; it supplies an artifact instead of pushing to the main branch.

## Actions required outside the repository

1. In the GitHub account, enable two-factor authentication or passkeys; review access tokens, connected applications, and collaborators.
2. In Settings > Pages, verify the correct custom domain and **Enforce HTTPS**.
3. In Settings > Code security and analysis, turn on available secret scanning, push protection, and Dependabot alerts where supported.
4. Protect the main branch with required review and successful status checks before merging.
5. Configure **HTTP response headers** at your actual hosting/CDN layer: HTTPS/HSTS, X-Content-Type-Options: nosniff, frame-ancestors 'none' in a CSP **response header**, Referrer-Policy, and an appropriate Permissions-Policy. A static HTML meta tag cannot configure all of these. Confirm real headers using browser developer tools or curl.
6. The current page depends on Three.js r128 from cdnjs. Plan a **separate compatibility-tested upgrade** to a maintained release and add a verified Subresource Integrity (SRI) digest, rather than changing the rendering version blindly.
7. If a credential has ever been exposed, **revoke/rotate it immediately**. Deleting a file or adding .gitignore does not erase public Git history; carefully coordinate history cleanup after key rotation and backups.

## What these checks do not cover

The checks are intentionally lightweight and cannot prove a site is unhackable. They do not inspect hosting-account settings, DNS, TLS certificates, HTTP headers, CDN behavior, third-party code contents, binary metadata, or uncommitted local files. No backend auth, server-side rate limiting, CORS, password hashing, or database permissions are applicable unless you add those systems later. Use a serverless/backend service with server-side authentication/authorization if you add any protected feature; do not simulate admin security with hidden client-side routes.

To review security reports, open GitHub Actions > Static site security checks. Never paste secrets into an issue or a pull request.
