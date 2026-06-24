# Alex Deployment Notes

Expected public URL:

`https://happy-alex.netlify.app/`

## Gallery Data

- Live manifest: `https://happy-alex-2.netlify.app/data/manifest.json`
- Media base: `https://happy-alex-2.netlify.app/`
- Local fallback: `data/manifest.snapshot.json`

## Publish Checklist

1. Deploy the site to Netlify.
2. Confirm `gallery.html` loads the live A2 manifest.
3. Confirm the fallback snapshot still works if A2 is offline.
4. Confirm image URLs resolve correctly in the browser.
5. Keep the dark/gold visual style intact when editing the gallery.
