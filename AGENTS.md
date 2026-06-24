# Alex Site Instructions

- Preserve the existing dark/gold birthday-site design.
- Keep the gallery wired to the A2 media manifest.
- Use the local manifest snapshot as a fallback if A2 is unavailable.
- Keep image URLs relative-to-A2 and resolve them with the configured media base URL.
- Do not flatten the site into a single page.
- Do not change the public media path structure casually because the gallery depends on it.
- Avoid introducing backend requirements or non-static dependencies.
