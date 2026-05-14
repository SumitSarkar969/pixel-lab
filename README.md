# Pixel Lab

An interactive image processing playground built with React and Vite. Apply and visualize classical image processing operations in real time — from point transforms to frequency-domain filters.

## Features

- **Point transforms** — Gamma correction, log transform, negative, thresholding
- **Histogram operations** — Global equalization, CLAHE
- **Spatial filters** — Gaussian blur, mean (box) filter, median filter, unsharp mask
- **Edge detection** — Sobel (Gx / Gy / magnitude / angle), Laplacian
- **Frequency-domain filters** — Ideal / Butterworth / Gaussian low-pass and high-pass, notch reject, homomorphic filtering
- **Bit-plane slicing** — Inspect and combine up to 8 bit planes with OR / AND / Sum modes
- Live parameter controls with per-section reset
- Scope panel for histogram / DFT inspection

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build |

## Stack

- [React 18](https://react.dev/)
- [Vite 5](https://vitejs.dev/)
