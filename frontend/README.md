# 💻 Frontend UI Application Client Shell (`/frontend`)

This directory runs our single-page web user interface constructed using Vite + React, React Router v7, and local CSS Module components.

## 📱 Mobile-First Responsive Symmetries
All styling structures utilize CSS Module hashes (`.module.css`) combined with viewport units (`100svh`, `100dvh`). This removes layout scaling issues on compact mobile device webviews (like iOS Safari) and locks touch target layouts to an accessible 44px-48px floor.

## 📁 Custom UI Utilities
* `src/utils/api.js` (`customFetch`): A centralized fetch wrapper that automatically injects user bearer storage tokens and prefixes outgoing paths with our production `VITE_API_URL` when deployed live.
* `vercel.json`: Handles URL route rewrites globally. Instructs the production CDN to route nested path refreshes (like `/conversations/:id`) to `index.html` to keep client-side navigation paths active.
