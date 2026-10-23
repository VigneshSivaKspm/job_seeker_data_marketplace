# SeekerExchange

A privacy-first **job seeker intake portal** and **recruitment data marketplace**.
React 18 · Vite 5 · Tailwind CSS 3 · React Router 6 · Lucide icons. No backend required.

| Route | What it is |
| --- | --- |
| `/` | Landing page for job seekers |
| `/join` | 4-step profile intake wizard (live "how recruiters see you" preview, profile strength, confetti success) |
| `/marketplace` | Recruiter catalog: masked profiles, filters, bundles, cart, checkout, unmasking, CSV/Excel export |
| `/marketplace/packages` | Bulk contact packages (credits) |\n| `/marketplace/bundles`, `/marketplace/purchases` | Discounted bundles, unlocked purchases + receipts |
| `/admin/login` → `/admin` | Separate admin console: dashboard, pricing & roles, candidates, orders |

## Run locally

    npm install
    npm run dev        # http://localhost:5173
    npm run build && npm run preview

## Deploy to Vercel

1. Push this folder to a Git repository.
2. In Vercel choose **Add New → Project**, import the repo. Framework is auto-detected (Vite);
   build command `npm run build`, output `dist`. No environment variables are needed.
3. Deploy. `vercel.json` already contains the SPA rewrite (so `/admin`, `/join`… work on refresh),
   long-lived caching for hashed assets and basic security headers.

Or from the CLI: `npx vercel --prod`.

## Demo notes

- **Admin login:** `admin@seekerexchange.com` / `Admin@123`. This is a *front-end demo gate only* —
  put real authentication and an API behind `/admin` before handling real data.
- **Data** lives in the browser (`localStorage`, prefix `sx:v2:`) and syncs across tabs, so a profile
  submitted on `/join` in one tab appears in `/admin` in another. Admin → *Reset demo data* restores the seed.
- **Currency:** everything is in Indian rupees (₹). Single profiles cost ₹15–₹130 depending on seniority and industry; admin can change this under *Pricing & Roles*.\n- **Bulk packages:** recruiters buy contact credits — 50 for ₹600, 100 for ₹1,000, 500 for ₹4,000, 1,000 for ₹7,000, 5,000 for ₹30,000 (editable in admin). One credit unlocks one profile, or every filtered match at once.\n- **Promo codes:** `WELCOME10`, `SAVE15` (min ₹200), `HIRE25` (min ₹500).
- **Demo payment:** card `4242 4242 4242 4242`, any future expiry and CVV · UPI `name@okbank` · bank UTR: any 8+ characters. No real charges.
- All candidate names, emails and phone numbers are fictional.