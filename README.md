# Smart Fridge & Culinary Assistant

A modern, AI-powered cooking assistant app with user authentication, real ingredient detection using OpenAI Vision, and stunning animated UI.

## 🌟 Project Overview

**Name**: Smart Fridge & Culinary Assistant  
**Goal**: Help users discover recipes based on available ingredients with AI-powered ingredient detection and personalized recommendations  
**Tech Stack**: Hono + TypeScript + TailwindCSS + Cloudflare Pages + D1 Database + OpenAI Vision API

## 🔗 URLs

- **Development**: https://3000-i072642sxkn0a8bjo1lju-a402f90a.sandbox.novita.ai
- **API Endpoints**:
  - `POST /api/auth/signup` - Create new user account
  - `POST /api/auth/login` - User login
  - `POST /api/auth/logout` - User logout
  - `GET /api/auth/me` - Get current user
  - `POST /api/analyze-fridge` - Analyze fridge photos with OpenAI Vision
  - `POST /api/get-recipes` - Get recipe suggestions with filtering
  - `POST /api/recipes/save` - Save favorite recipes
  - `GET /api/recipes/saved` - Get user's saved recipes

## ✨ Completed Features

### 🔐 **Authentication System**
- **User Signup & Login** with secure password hashing
- **Session-based authentication** using HTTP-only cookies
- **User profiles** with dietary preferences
- **Protected routes** for authenticated users
- **Persistent sessions** (30-day expiration)
- **Logout functionality** with session cleanup

### 🤖 **AI-Powered Ingredient Detection**
- **OpenAI Vision API integration** for real ingredient recognition
- **Smart image analysis** that identifies food items in fridge photos
- **Fallback to simulated data** if API key not configured
- **Detailed ingredient list** with visual chips/badges
- **Support for various image formats** (JPG, PNG, HEIC)

### 🎨 **Enhanced UI/UX**
- **Glassmorphism effects** with backdrop blur
- **Gradient animations** on headers and buttons
- **Smooth transitions** and microinteractions
- **Floating animations** for icons and elements
- **Hover effects** with 3D transforms
- **Shimmer effects** on buttons
- **Pulse animations** for active elements
- **Toast notifications** with slide-in animations
- **Loading states** with spinners
- **Custom scrollbar** with gradient
- **Responsive animations** that respect user preferences

### 📱 **Mobile-First Design**
- **Tab navigation** for mobile (Scan / Recipes / Filters)
- **Touch-optimized** buttons and controls
- **Camera capture** support for mobile devices
- **Responsive grid layouts** adapting to all screen sizes
- **Portrait and landscape** optimization
- **Swipe-friendly** interfaces

### 🍳 **Recipe Features**
- **8+ diverse recipes** with comprehensive information
- **Smart filtering** by dietary restrictions:
  - 🥬 Vegetarian
  - 🌱 Vegan
  - 🥑 Keto
  - 🥩 Paleo
  - 🌾 Gluten-Free
  - ⚡ Low-Carb
- **Match score sorting** - recipes with more available ingredients rank higher
- **Missing ingredients indicator** with badge count
- **Save favorite recipes** (authenticated users)
- **Dietary preference sync** from user profile
- **Color-coded difficulty** levels (Easy/Medium/Hard)
- **Calorie counts** and servings information
- **Preparation time** estimates

### 👨‍🍳 **Cooking Mode**
- **Step-by-step instructions** with visual progress
- **Active step highlighting** with blue border and background
- **Previous/Next navigation** buttons
- **Text-to-speech integration** for hands-free cooking
- **Toggle play/stop** for voice guidance
- **Recipe information display** (time, calories, servings)
- **Completion confirmation** dialog
- **Missing ingredients alert** with one-click shopping list

### 🛒 **Shopping List**
- **One-click addition** of missing ingredients
- **Persistent storage** using localStorage
- **Badge counter** on cart icon
- **Individual item removal**
- **Clear all functionality**
- **Modal interface** with smooth animations
- **Auto-save** on every change

### 👤 **User Profile**
- **Profile modal** with user information
- **Avatar with animated ring**
- **Dietary preferences display**
- **Logout button**
- **Saved recipes count** (coming soon)
- **Cooking history** (coming soon)

## 📊 Data Architecture

### Database Schema (Cloudflare D1)

```sql
-- Users table
users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  name TEXT,
  dietary_preferences TEXT,
  created_at DATETIME,
  last_login DATETIME
)

-- Sessions table
sessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  session_token TEXT UNIQUE,
  expires_at DATETIME,
  created_at DATETIME
)

-- Saved recipes table
saved_recipes (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  recipe_id INTEGER,
  created_at DATETIME
)

-- Cooking history table
cooking_history (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  recipe_id INTEGER,
  completed BOOLEAN,
  cooked_at DATETIME
)
```

### Recipe Data Model
```javascript
{
  id: number,
  name: string,
  ingredients: string[],
  difficulty: 'Easy' | 'Medium' | 'Hard',
  prepTime: string,
  calories: number,
  servings: number,
  dietary: string[],
  image: string (emoji),
  steps: string[],
  missingIngredients: string[],
  matchScore: number
}
```

### Storage Services
- **Cloudflare D1 Database**: User accounts, sessions, saved recipes
- **LocalStorage**: Shopping list persistence
- **HTTP-only Cookies**: Session tokens
- **In-Memory State**: Current ingredients, recipes, cooking session

## 🎯 User Guide

### Getting Started

#### 1. **Create an Account**
- Click "Sign Up" on the welcome screen
- Enter your name, email, and password
- Optionally select dietary preferences
- Click "Create Account"

#### 2. **Login**
- Enter your email and password
- Click "Login"
- Session persists for 30 days

#### 3. **Scan Your Fridge**
- Click the upload area
- Take a photo or select from gallery
- Click "Analyze Ingredients"
- AI will detect ingredients using OpenAI Vision

#### 4. **Browse Recipes**
- View personalized recipe suggestions
- Recipes sorted by ingredient match
- Yellow badge shows missing ingredients
- Green badge means all ingredients available
- Star icon to save favorites

#### 5. **Filter by Diet**
- Use sidebar filters (desktop)
- Or Filters tab (mobile)
- Select dietary restrictions
- Recipes update in real-time

#### 6. **Start Cooking**
- Click "Start Cooking" on any recipe
- Follow step-by-step instructions
- Current step highlighted in blue
- Use "Read Aloud" for voice guidance
- Navigate with Previous/Next buttons

#### 7. **Shopping List**
- Click shopping cart icon
- Add missing ingredients
- View and manage items
- Clear when done shopping

#### 8. **Profile Management**
- Click profile icon in header
- View your information
- See dietary preferences
- Logout when needed

## 🚀 Deployment

### Current Status
✅ **Active** - Running on development sandbox with D1 database

### Local Development

```bash
# Install dependencies
npm install

# Apply database migrations
npm run db:migrate:local

# Build the project
npm run build

# Start development server
pm2 start ecosystem.config.cjs

# View logs
pm2 logs webapp --nostream

# Stop server
pm2 delete webapp
```

### Environment Setup

Create `.dev.vars` file (not committed to git):
```bash
# OpenAI API Key for ingredient detection
OPENAI_API_KEY=sk-your-api-key-here

# Session secret for JWT tokens
SESSION_SECRET=your-random-secret-key

# Environment
NODE_ENV=development
```

### Production Deployment to Cloudflare Pages

#### 1. Set up Cloudflare API Key
```bash
# Call setup_cloudflare_api_key in the sandbox
# Or set CLOUDFLARE_API_TOKEN environment variable
```

#### 2. Create D1 Database
```bash
# Create production database
npx wrangler d1 create webapp-production

# Update wrangler.jsonc with database_id
# Apply migrations
npm run db:migrate:prod
```

#### 3. Set Secrets
```bash
# Set OpenAI API key
npx wrangler pages secret put OPENAI_API_KEY --project-name webapp

# Set session secret
npx wrangler pages secret put SESSION_SECRET --project-name webapp
```

#### 4. Deploy
```bash
# Build and deploy
npm run deploy:prod

# Or manually
npm run build
npx wrangler pages deploy dist --project-name webapp
```

## 🎨 UI/UX Design Features

### Visual Effects
- **Glassmorphism**: Frosted glass effect with backdrop blur
- **Gradient Animations**: Animated color transitions on backgrounds
- **Floating Elements**: Gentle up-down motion for icons
- **Shimmer Effects**: Light sweep across buttons on hover
- **Pulse Animations**: Breathing effect for active elements
- **3D Transforms**: Rotate and lift on hover
- **Smooth Transitions**: Easing functions for natural motion

### Color Palette
- **Primary Gradient**: Blue (#667eea) to Purple (#764ba2)
- **Success**: Green (#10b981) to Emerald (#34d399)
- **Warning**: Yellow (#f59e0b) to Orange (#fbbf24)
- **Error**: Red (#ef4444) to Pink (#f87171)
- **Background**: Indigo/Purple/Pink gradient mesh

### Typography
- **Headers**: Bold, gradient text with glow effects
- **Body**: Clean, readable sans-serif
- **Interactive**: Medium weight with hover animations

## 🔮 Future Enhancements

### High Priority
1. **Advanced AI Features**
   - Better ingredient recognition accuracy
   - Portion size estimation
   - Expiration date detection
   - Recipe generation from scratch

2. **Social Features**
   - Share recipes with friends
   - Community recipe contributions
   - Rating and review system
   - Cooking challenges

3. **Extended Recipe Database**
   - 100+ professional recipes
   - Video tutorials
   - Chef tips and variations
   - Nutritional analysis

### Medium Priority
4. **Smart Features**
   - Meal planning calendar
   - Weekly meal prep suggestions
   - Leftover management
   - Kitchen inventory tracking

5. **Integrations**
   - Grocery delivery APIs
   - Smart appliance connectivity
   - Fitness app sync
   - Calendar integration

6. **Enhanced User Experience**
   - Recipe search by name
   - Advanced filters (cuisine, cooking time)
   - Ingredient substitutions
   - Print recipe cards

### Low Priority
7. **Analytics & Insights**
   - Cooking statistics
   - Popular recipes
   - Dietary goal tracking
   - Cost analysis

## 🛠️ Technical Details

### Frontend Technologies
- **TailwindCSS**: Utility-first CSS with custom animations
- **Custom CSS**: Advanced animations, glassmorphism, gradients
- **Font Awesome**: Icon library
- **Axios**: HTTP client
- **Web Speech API**: Text-to-speech
- **LocalStorage API**: Client-side persistence

### Backend Technologies
- **Hono**: Lightweight web framework
- **Cloudflare Workers**: Edge runtime
- **Cloudflare D1**: SQLite database
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool
- **Wrangler**: Cloudflare CLI

### AI Integration
- **OpenAI GPT-4O-mini Vision**: Image analysis
- **Custom prompts**: Optimized for food detection
- **Fallback system**: Graceful degradation without API key

### Security
- **Password hashing**: SHA-256 (upgrade to bcrypt recommended)
- **HTTP-only cookies**: Prevent XSS attacks
- **Session expiration**: 30-day limit
- **CORS enabled**: Secure cross-origin requests
- **Input validation**: Server-side checks

### Performance
- **Edge deployment**: Global CDN distribution
- **Lazy loading**: On-demand resource loading
- **Optimized images**: Efficient encoding
- **Minimal bundle**: Small Worker size
- **Database indexes**: Fast queries

## 📝 Recent Updates

**2025-01-09**: Major update with authentication and enhanced UI
- ✅ User authentication system with D1 database
- ✅ OpenAI Vision API integration
- ✅ Complete UI overhaul with animations
- ✅ Glassmorphism and gradient effects
- ✅ User profiles and saved recipes
- ✅ Session management with cookies
- ✅ Enhanced mobile responsiveness
- ✅ Advanced CSS animations
- ✅ Toast notifications
- ✅ Dietary preference sync

## 🔑 API Key Configuration

To enable real AI ingredient detection:

1. Get an OpenAI API key from https://platform.openai.com/api-keys
2. Update `.dev.vars` file (local development):
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
3. For production, set as Cloudflare secret:
   ```bash
   npx wrangler pages secret put OPENAI_API_KEY --project-name webapp
   ```

Without an API key, the app falls back to simulated ingredient detection.

## 🤝 Contributing

To contribute to this project:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both mobile and desktop
5. Submit a pull request

## 📄 License

This project is ready for production use with proper API integration and security hardening.

---

**Built with ❤️ using Hono, TypeScript, Cloudflare Pages, D1 Database, and OpenAI Vision API**

🎨 **Designed with modern UI/UX principles**  
🔒 **Secured with authentication and session management**  
🤖 **Powered by AI for intelligent ingredient detection**  
📱 **Optimized for mobile and desktop**
