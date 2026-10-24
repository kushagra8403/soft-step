# Soft Steps — SEO and launch checklist

This checklist maps the 20-item “before launch” SEO list to this repository. The public build is a static HTML site; static pre-rendering is the correct fit for this small catalogue and does not need a server-side rendering framework.

## Status and evidence

1. **Server-side rendering / pre-rendering — suitable static output.** `build_netlify.py` emits a complete `dist/index.html` at build time. The page does not require a client-side framework to render the initial content. Dynamic server-side rendering is not configured or needed for this one-page shop.
2. **robots.txt — generated.** Allows crawling and points to the sitemap.
3. **XML sitemap — generated.** Includes home, contact and privacy pages.
4. **Unique title tags — generated.** Shop, contact, privacy and 404 pages have distinct titles.
5. **Meta descriptions — present.** Shop description comes from the page; contact/privacy descriptions are set in the build-generated pages.
6. **One H1 per page — verify in CI/browser audit before launch.** Support pages each have one H1. Keep the shop's product headings subordinate to its primary H1.
7. **Canonical tags — generated.** Canonical host is configured as `https://softsteps-home.netlify.app/`; update `URL` in `build_netlify.py` if the final production domain changes.
8. **Open Graph image — generated.** `img/og.jpg` is copied and referenced by the shop's Open Graph metadata. Social preview should be checked after deployment.
9. **Custom 404 — generated.** Netlify serves `dist/404.html` for missing pages.
10. **301 redirects — `_redirects` generated.** Includes only the safe legacy `/index.html` → `/` redirect. Add other redirects only when real old URLs are known.
11. **WebP images — available.** The catalogue contains WebP variants and AVIF variants for phone screens. Keep original true-colour product photography; do not convert lossy images blindly.
12. **Lazy loading — existing page behavior should be verified.** Keep below-the-fold catalogue imagery lazy-loaded and reserve eager/high priority for the hero/LCP image. Audit all generated images at mobile and desktop sizes.
13. **Organization / LocalBusiness schema — generated.** The shop emits structured Store data with contact and Vadodara details plus product offers. Validate with Google's Rich Results Test and correct any factual fields before launch.
14. **Breadcrumbs — not necessary for the current one-page shop.** If separate product/category pages are added later, add visible breadcrumbs and matching BreadcrumbList schema then.
15. **Internal links — added.** Shop footer links to Contact and Privacy; support pages link back to the shop and to each other where relevant.
16. **Google Analytics — intentionally not enabled.** Do not invent a measurement ID or collect analytics before the owner selects a property and reviews consent/privacy requirements. Add a real GA4 ID only after owner configuration.
17. **Search Console — owner action after deployment.** Verify the final domain/property, submit `/sitemap.xml`, and inspect the home, contact and privacy URLs. Verification credentials/tokens must never be committed.
18. **Privacy policy — generated.** Review it against the final hosting, form, messaging and analytics configuration; revise if tracking is added.
19. **Working contact form — generated using Netlify Forms.** It requires deployment to Netlify with form detection enabled. After the first deploy, submit a real test enquiry and confirm it appears in Netlify Forms and the notification reaches the owner. Until tested, do not claim the form is operational.
20. **301 redirects / launch checks — build artifact generated.** Test the redirect and 404 behavior on the deployed domain, not just locally.

## Owner-only launch actions

- Deploy the latest successful build to the intended Netlify site and confirm its primary domain is `softsteps-home.netlify.app` (or update the build constant if different).
- In Netlify, confirm form detection and configure a notification recipient for the contact form; send a test submission.
- Create/verify Google Search Console property and submit the sitemap.
- If desired, create a GA4 property, review the applicable consent/privacy requirements, then configure the actual measurement ID. Analytics is not active by default.
- Validate structured data, OG preview, canonical host, mobile layout, links, contact form and 404 after deployment.
- Keep privacy text aligned with actual services and practices. This generated policy is a useful baseline, not legal advice.

## Build and smoke-test

```sh
python3 build_netlify.py work-admin/site dist
test -s dist/index.html
test -s dist/robots.txt
test -s dist/sitemap.xml
test -s dist/contact.html
test -s dist/privacy.html
test -s dist/404.html
test -s dist/_redirects
```

The build should be considered launch-ready only after the checks above and the owner-only deployment checks have been completed.
