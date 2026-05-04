<div align="center">
  <h1>Winetoast</h1>
  <p>A physics-based toast component for React.</p>
</div>


### Installation

```bash
npm i winetoast
```

### Getting Started

```tsx
import { winetoast, Toaster } from "winetoast";

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <YourApp />
    </>
  );
}
```

### Docs Site

```bash
bun install
bun run docs:dev
```

The docs and playground live in `site/` and deploy to GitHub Pages from `.github/workflows/deploy-pages.yml`.
