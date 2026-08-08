# Postal data tooling

`build-postal-data.mjs` scrapes the free [GeoNames postal-code dumps](https://download.geonames.org/export/zip/)
and bakes them into chunked static JSON under `public/postal/`, which Vite copies
into `dist/` at build time. The live site resolves every ZIP / postal code lookup
from its **own origin** — no runtime API calls, no keys, works offline once cached.

## Usage

```
npm run postal:build            # standard: ~95 countries + full-resolution Canada
node tools/build-postal-data.mjs --full CA,GB   # add full UK unit postcodes (large!)
node tools/build-postal-data.mjs --force        # re-download dumps
node tools/build-postal-data.mjs --dry-run      # parse + report, write nothing
```

Downloads are cached in `tools/.cache/` (not committed). The generated
`public/postal/` **is committed**, so Cloudflare Pages builds never depend on
geonames.org being up.

## Output format

- `public/postal/manifest.json` — `{ countries: { CC: { name, count, split, sample } } }`
  - `split` = 0: whole country in `CC.json`; 1 or 2: chunked as `CC/<prefix>.json`
    where prefix is the first 1–2 chars of the normalized code.
- Each chunk maps normalized code → `[lat, lon, placeName, region]`.
- Normalization (must match `src/pilgrimage.js`): uppercase, strip all non-alphanumerics.
  `"K1A 1A1"` → `K1A1A1`, `"100-0001"` → `1000001`.

## Notes

- Canada ships full six-character codes (`--full CA`) because half of Chick's
  pilgrimage traffic is from across the border; other countries use GeoNames'
  standard granularity (US = 5-digit ZIP, UK = outward codes, etc.).
- Coordinates are rounded to 3 decimals (~100 m) — plenty for "how far is the drive".
- Data license: **CC BY 4.0, © GeoNames** — the attribution line in the
  PilgrimageFinder widget is required, don't remove it.
- Countries not covered by GeoNames (e.g. full mainland China) simply aren't in
  the manifest; the UI only offers what the dataset actually has.
