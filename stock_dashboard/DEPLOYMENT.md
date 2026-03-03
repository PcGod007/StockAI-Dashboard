# Stock Dashboard Deployment Guide

Deploy your Flask + TensorFlow backend on Railway and React frontend on Netlify.

---

## Architecture

```
Frontend (React + Vite)
└─> Netlify (FREE forever)

Backend (Flask + TensorFlow)
└─> Railway (FREE for 30 days, then ~$5/month)
```

---

## Part 1: Deploy Backend on Railway

### Step 1: Push Backend to GitHub

```bash
cd stock_dashboard/backend
git init
git add .
git commit -m "Stock backend"
git remote add origin https://github.com/YOUR_USERNAME/stock-backend.git
git branch -M main
git push -u origin main
```

### Step 2: Create Railway Account

1. Go to https://railway.app
2. Sign up (free tier available)
3. Verify email

### Step 3: Deploy from GitHub

1. Click "New Project"
2. Click "Deploy from GitHub repo"
3. Connect GitHub and select `stock-backend` repo
4. Railway auto-detects Dockerfile ✓
5. Click "Deploy"

Wait 3-5 minutes for deployment to complete.

### Step 4: Add Environment Variables

In Railway dashboard:
1. Select your project
2. Click "Variables"
3. Add:
   ```
   NEWS_API_KEY = your_api_key_from_newsapi.org
   FLASK_ENV = production
   ```
4. Save

### Step 5: Get Your Backend URL

1. Click "Settings"
2. Find "Public URL" - looks like: `https://stock-backend-production.up.railway.app`
3. Copy this URL - you'll need it for Netlify

**Test it**:
```powershell
curl https://your-railway-url/api/stock-data?ticker=AAPL&start=2025-01-01&end=2025-02-01
```

Should return JSON with stock data ✓

---

## Part 2: Deploy Frontend on Netlify

### Step 1: Push Frontend to GitHub

```bash
cd stock_dashboard/frontend
git init
git add .
git commit -m "Stock frontend"
git remote add origin https://github.com/YOUR_USERNAME/stock-frontend.git
git branch -M main
git push -u origin main
```

### Step 2: Create Netlify Account

1. Go to https://netlify.com
2. Sign up (free)
3. Verify email

### Step 3: Deploy from GitHub

1. Click "Import an existing project"
2. Connect GitHub
3. Select your `stock-frontend` repo
4. Build settings show:
   - Build command: `npm run build` ✓
   - Publish directory: `dist` ✓
5. Click "Deploy"

Wait 2-3 minutes for deployment.

### Step 4: Add Environment Variable

After deployment completes:
1. Go to "Site settings"
2. Click "Build & deploy" → "Environment"
3. Add variable:
   ```
   VITE_API_URL = https://your-railway-url
   ```
   (Use the Railway URL from Part 1, Step 5)
4. Save

### Step 5: Trigger Rebuild

Since you added env var after deployment:
1. Go to "Deploys"
2. Click "Trigger deploy" → "Clear cache and redeploy"
3. Wait for deployment to complete

Your frontend is now live at: `https://your-site.netlify.app` ✓

---

## Testing

### Test Backend
```powershell
curl https://your-railway-url/api/stock-data?ticker=AAPL&start=2025-01-01&end=2025-02-01
```

### Test Frontend
1. Visit your Netlify URL
2. Search for "AAPL"
3. Should show predictions and chart
4. Open browser console (F12) - no errors

---

## Environment Variables

### Railway (Backend)
- `NEWS_API_KEY` - From https://newsapi.org (free tier)
- `FLASK_ENV` - Set to `production`

### Netlify (Frontend)
- `VITE_API_URL` - Your Railway backend URL

---

## Cost

- **Railway**: Free trial 30 days ($5 free credits), then ~$5-10/month for hobby tier
- **Netlify**: $0 forever (free tier)
- **Total**: Free for 30 days, then ~$5-10/month if continued

---

## Making Updates

### Update Backend
```bash
cd stock_dashboard/backend
# Make code changes...
git add .
git commit -m "Bug fix"
git push origin main
```
Railway auto-redeploys! (5 min)

### Update Frontend
```bash
cd stock_dashboard/frontend
# Make code changes...
git add .
git commit -m "UI improvement"
git push origin main
```
Netlify auto-redeploys! (2 min)

---

## Troubleshooting

### Backend not connecting to frontend
- Check `VITE_API_URL` in Netlify env vars matches Railway URL
- Redeploy frontend after adding/changing env vars
- Check browser console (F12) for errors

### API returns 502 Bad Gateway
- Check Railway logs: Dashboard → Logs
- Model might not have loaded - wait 1 minute after deployment
- Redeploy: Railway → Deployments → Redeploy

### First request takes 30+ seconds
- Normal! TensorFlow model loading from disk
- Subsequent requests faster (cached)

### CORS errors
- Already configured in `app.py`: `CORS(app)` ✓
- Clear browser cache if persists

---

## Quick Links

- Railway: https://railway.app
- Netlify: https://netlify.com
- newsapi.org: https://newsapi.org (for NEWS_API_KEY)

---

## Next Steps

1. Get NEWS_API_KEY from https://newsapi.org
2. Follow Part 1 (deploy backend on Railway)
3. Copy Railway URL
4. Follow Part 2 (deploy frontend on Netlify)
5. Set VITE_API_URL in Netlify
6. Test! 🚀

Your stock dashboard is now live!
