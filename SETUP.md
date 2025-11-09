# Smart Fridge Setup Guide

## 🔑 API Configuration

### OpenAI API Key Setup

✅ **Status**: Configured and Active

The OpenAI API key has been configured in `.dev.vars` for local development.

#### Current Configuration:
```
OPENAI_API_KEY=REDACTED (configured)
SESSION_SECRET=REDACTED (configured)
NODE_ENV=development
```

### Verify Configuration

Check that the API key is loaded:
```bash
cd /home/user/webapp
pm2 logs webapp --nostream | grep OPENAI_API_KEY
```

You should see: `env.OPENAI_API_KEY ("(hidden)")  Environment Variable  local`

## 🚀 Quick Start

### 1. Start the Development Server

```bash
cd /home/user/webapp

# Build the project
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs

# Check status
pm2 status

# View logs
pm2 logs webapp --nostream
```

### 2. Access the Application

**Local URL**: http://localhost:3000  
**Public URL**: https://3000-i072642sxkn0a8bjo1lju-a402f90a.sandbox.novita.ai

### 3. Test Authentication

```bash
# Create a test user
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{\n    "email": "test@example.com",\n    "password": "test123",\n    "name": "Test User",\n    "dietaryPreferences": "vegetarian,keto"\n  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{\n    "email": "test@example.com",\n    "password": "test123"\n  }'
```

### 4. Test AI Ingredient Detection

The app will now use **real OpenAI Vision API** to detect ingredients from photos!

**In the browser:**
1. Open the app
2. Click "Sign Up" and create an account
3. Upload a photo of your fridge
4. Click "Analyze Ingredients"
5. Watch as AI detects real ingredients! 🤖

## 📁 Database Management

### View Database

```bash
# Open SQLite console
npm run db:console:local

# Example queries
SELECT * FROM users;
SELECT * FROM sessions;
SELECT * FROM saved_recipes;
```

### Reset Database

```bash
# Reset and reapply migrations
npm run db:reset
```

## 🔒 Security Notes

### ⚠️ IMPORTANT

1. **`.dev.vars` is in `.gitignore`** - Never commit API keys!
2. **Change SESSION_SECRET in production** - Use a strong random value
3. **Upgrade password hashing** - Consider bcrypt for production
4. **Rate limit API calls** - Prevent abuse of OpenAI API

## 🌐 Production Deployment

### 1. Create Cloudflare D1 Database

```bash
# Create production database
npx wrangler d1 create webapp-production

# Copy the database_id and update wrangler.jsonc
# Replace: "database_id": "local-db-for-development"
# With: "database_id": "your-actual-database-id"
```

### 2. Apply Migrations to Production

```bash
npm run db:migrate:prod
```

### 3. Set Cloudflare Secrets

```bash
# Set OpenAI API key
npx wrangler pages secret put OPENAI_API_KEY --project-name webapp
# When prompted, paste your OpenAI API key

# Set session secret (use a strong random value)
npx wrangler pages secret put SESSION_SECRET --project-name webapp
# When prompted, paste a strong random secret key (recommended: 256-bit random string)
```

### 4. Deploy to Cloudflare Pages

```bash
# Build and deploy
npm run deploy:prod
```

## 🧪 Testing Features

### Test User Authentication Flow

1. **Signup**: Create account with dietary preferences
2. **Login**: Session persists for 30 days
3. **Profile**: View user info, dietary preferences
4. **Logout**: Clears session and redirects to login

### Test AI Ingredient Detection

1. **Upload Image**: Take/select fridge photo
2. **Analyze**: OpenAI Vision API detects ingredients
3. **View Results**: Animated ingredient chips appear
4. **Get Recipes**: Smart suggestions based on detected items

### Test Recipe Features

1. **Browse**: View recipes sorted by ingredient match
2. **Filter**: Apply dietary restrictions
3. **Save**: Star favorite recipes (saved to D1 database)
4. **Cook**: Step-by-step mode with text-to-speech
5. **Shopping List**: Add missing ingredients

## 🎨 UI Features

### Animations Implemented

- ✅ Floating icons with gentle motion
- ✅ Gradient animations on header
- ✅ Glassmorphism cards with backdrop blur
- ✅ Shimmer effects on button hover
- ✅ 3D transforms on recipe cards
- ✅ Pulse animations for active elements
- ✅ Slide-in notifications
- ✅ Smooth page transitions

### Color System

- **Primary**: Blue-Purple gradient (#667eea → #764ba2)
- **Success**: Green gradient (#10b981 → #34d399)
- **Warning**: Orange gradient (#f59e0b → #fbbf24)
- **Error**: Red-Pink gradient (#ef4444 → #f87171)

## 📊 Performance

### Bundle Sizes

- **Worker**: 42.11 kB (optimized)
- **Static Assets**: Served from CDN
- **Database**: Local SQLite for development

### Optimization Tips

1. Enable Cloudflare caching in production
2. Use image compression for uploads
3. Implement rate limiting on API endpoints
4. Consider response caching for recipes

## 🐛 Troubleshooting

### OpenAI API Not Working

**Check logs:**
```bash
pm2 logs webapp --nostream
```

**Look for:**
- `env.OPENAI_API_KEY ("(hidden)")` - Key is loaded
- OpenAI API errors in logs

**Common issues:**
- Invalid API key format
- API key expired or revoked
- Rate limit exceeded
- Network connectivity issues

### Authentication Issues

**Clear sessions:**
```bash
npm run db:console:local
DELETE FROM sessions;
```

**Reset database:**
```bash
npm run db:reset
```

### Port 3000 in Use

```bash
# Kill process using port 3000
fuser -k 3000/tcp

# Or use npm script
npm run clean-port
```

## 📝 Environment Variables

### Local Development (`.dev.vars`)

```bash
# OpenAI API Key
OPENAI_API_KEY=REDACTED

# Session Secret (change in production)
SESSION_SECRET=REDACTED

# Environment
NODE_ENV=development
```

### Production (Cloudflare Secrets)

Set via Wrangler:
```bash
npx wrangler pages secret put OPENAI_API_KEY
npx wrangler pages secret put SESSION_SECRET
```

## 🎯 Next Steps

1. ✅ OpenAI API key configured
2. ✅ Authentication system ready
3. ✅ Database migrations applied
4. ✅ Enhanced UI with animations
5. ⏳ Test with real fridge photos
6. ⏳ Deploy to production
7. ⏳ Add more recipes to database
8. ⏳ Implement recipe rating system

## 📞 Support

For issues or questions:
- Check logs: `pm2 logs webapp --nostream`
- View README.md for full documentation
- Test API endpoints with curl commands above

---

**Last Updated**: 2025-01-09  
**Version**: 2.0  
**Status**: ✅ Fully Configured with OpenAI API