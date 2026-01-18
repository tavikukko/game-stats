# Tee otteluseuranta

Mobile-first otteluseuranta (SPA) kahdelle puoliajalle. Data tallentuu localStorageen, ei backendia.

## Kehitys

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages -deploy

Tämä projekti käyttää hash-routeria ja `base: './'` asetusta.

Vaihtoehto A: gh-pages branch
1) Aja build: `npm run build`
2) Julkaise `dist` sisältö gh-pages -branchiin

Vaihtoehto B: GitHub Actions
1) Luo workflow, joka tekee `npm install`, `npm run build`
2) Julkaise `dist` GitHub Pagesiin

Huom: varmista, että Pages-kohteena on `gh-pages` tai workflow-julkaisu.
