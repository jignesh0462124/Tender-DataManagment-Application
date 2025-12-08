# Netlify Deployment Guide

## Prerequisites
- Node.js and npm installed
- Netlify account
- GitHub account with your repository

## Deployment Steps

### 1. Install Netlify CLI (Optional but recommended)
```bash
npm install -g netlify-cli
```

### 2. Connect to Netlify
```bash
netlify login
```

### 3. Initialize Netlify
```bash
netlify init
```

### 4. Set Environment Variables
Add these in Netlify Dashboard under Site Settings > Build & Deploy > Environment:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_KEY`: Your Supabase public API key

### 5. Deploy from GitHub (Recommended)
1. Push your code to GitHub
2. Go to Netlify Dashboard
3. Click "New site from Git"
4. Select GitHub and authorize
5. Choose your repository
6. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
7. Add environment variables
8. Click "Deploy site"

### 6. Manual Deployment (Alternative)
```bash
npm run build
netlify deploy --prod --dir=dist
```

## Configuration Files

### netlify.toml
- **Build command**: `npm run build`
- **Publish directory**: `dist` (your Vite output)
- **Redirects**: All routes redirect to index.html for React Router

### Environment Variables (.env)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_key
```

## Troubleshooting

### Build Fails
- Check that `npm run build` works locally: `npm run build`
- Verify all dependencies are in package.json
- Check for any environment variable issues

### App Not Loading
- Ensure redirects are configured in netlify.toml
- Check that dist folder is generated correctly

### Environment Variables Not Loading
- Restart the build after setting environment variables
- Verify variable names start with `VITE_` for client-side access

## Post-Deployment

Your application will be available at: `https://your-site-name.netlify.app`

Happy deploying! 🚀
