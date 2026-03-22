# 🖼️ BackgroundRemover.dev

> Free online AI-powered image background removal. No downloads, no ads, just clean results.

## 🚀 Features

- **100% Online** - No software to download, works in any browser
- **Fast Processing** - Powered by Remove.bg API
- **No Storage** - Images are processed in-memory, never saved on our servers
- **Mobile Friendly** - Works great on your phone
- **Zero Cost Hosting** - Fully hosted on Cloudflare's free tier

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 + TailwindCSS + ShadCN UI
- **Hosting**: Cloudflare Pages
- **API Proxy**: Cloudflare Workers
- **AI Processing**: Remove.bg API
- **Architecture**: Zero storage, all processing in-memory

## 📦 Project Structure

```
image-background-remover/
├── apps/
│   ├── frontend/                    # Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── about/               # About page
│   │   │   ├── pricing/            # Pricing page
│   │   │   ├── privacy/            # Privacy policy page
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx            # Homepage (upload + process)
│   │   └── ...
│   └── worker/                      # Cloudflare Worker API proxy
│       ├── src/worker.js            # Rate limiting + CORS + proxy
│       └── wrangler.toml            # Worker configuration
├── docs/
│   └── image-bg-remover-mvp.md      # Full MVP requirements
├── .gitignore
├── LICENSE
├── pnpm-workspace.yaml
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Cloudflare account (free)
- Remove.bg API key ([get one here](https://www.remove.bg/api))

### 1. Install dependencies

```bash
# Install frontend dependencies
cd apps/frontend && npm install

# Install worker dependencies
cd ../worker && npm install
```

### 2. Configure environment variables

For frontend (`apps/frontend/.env.local`):
```
NEXT_PUBLIC_WORKER_URL=https://your-worker.your-name.workers.dev
```

For worker (`apps/worker/wrangler.toml`):
```
[vars]
REMOVE_BG_API_KEY = "your_api_key_here"
ALLOWED_ORIGIN = "https://your-frontend.pages.dev"
DAILY_FREE_LIMIT = 3
```

### 3. Develop locally

```bash
# Frontend
cd apps/frontend
npm run dev

# Worker (local dev)
cd apps/worker
npm run dev
```

### 4. Deploy

```bash
# Deploy frontend to Cloudflare Pages
npm run deploy

# Deploy worker
cd apps/worker
npm run deploy
```

## 💲 Pricing

- 🆓 **Free**: 3 images/day for anonymous users
- 🆓 **Free (Logged in)**: 5 images/day
- 💵 **Day Pass**: $0.99 - Unlimited for 24h
- ⭐ **Monthly**: $2.99 - Unlimited per month

## 🔒 Privacy

We **never store** your images. All processing happens in-memory on Cloudflare's edge network and is immediately discarded after processing. Read more in our [Privacy Policy](/privacy).

## 📈 Roadmap

- [x] MVP - Basic upload, process, download
- [ ] IP-based rate limiting
- [ ] Stripe payment integration
- [ ] Google/GitHub OAuth login
- [ ] Before/after comparison slider
- [ ] Batch processing

## 📄 License

MIT © [huangtietuo](https://github.com/huangtietuo)
