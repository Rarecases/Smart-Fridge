# Smart Fridge & Culinary Assistant

A modern, mobile-friendly cooking assistant app that uses AI to identify ingredients from fridge photos and suggests personalized recipes with step-by-step cooking guidance.

## 🌟 Project Overview

**Name**: Smart Fridge & Culinary Assistant  
**Goal**: Help users discover recipes based on available ingredients, with hands-free cooking guidance  
**Tech Stack**: Hono + TypeScript + TailwindCSS + Cloudflare Pages

## 🔗 URLs

- **Development**: https://3000-i072642sxkn0a8bjo1lju-a402f90a.sandbox.novita.ai
- **API Endpoints**:
  - `POST /api/analyze-fridge` - Analyze fridge photos to identify ingredients
  - `POST /api/get-recipes` - Get recipe suggestions based on ingredients and dietary filters

## ✨ Completed Features

### 1. **Fridge Photo Analysis** 📸
- Upload or capture fridge photos directly from mobile camera
- AI-powered ingredient detection (simulated - ready for production AI integration)
- Visual display of detected ingredients with chips/badges

### 2. **Intelligent Recipe Suggestions** 🍳
- 8+ diverse recipes with comprehensive information:
  - Recipe name and emoji icon
  - Difficulty level (Easy/Medium/Hard) with color coding
  - Preparation time
  - Calorie count
  - Servings
  - Dietary labels (vegetarian, vegan, keto, paleo, gluten-free, low-carb)
  - Missing ingredients indicator
  - Match score sorting (recipes with more available ingredients appear first)

### 3. **Advanced Dietary Filters** 🥗
- Real-time filtering by dietary restrictions:
  - 🥬 Vegetarian
  - 🌱 Vegan
  - 🥑 Keto
  - 🥩 Paleo
  - 🌾 Gluten-Free
  - ⚡ Low-Carb
- Clear all filters button
- Filters persist during recipe refresh

### 4. **Step-by-Step Cooking Mode** 👨‍🍳
- Large, easy-to-read cooking instructions
- Visual step progress with numbered indicators
- Current step highlighted with blue border and background
- Previous/Next navigation buttons
- Completion confirmation dialog
- Recipe information display (prep time, calories, servings)

### 5. **Text-to-Speech (Hands-Free Cooking)** 🔊
- Read aloud button for each cooking step
- Toggle between reading and stopping
- Adjustable speech rate and pitch
- Perfect for hands-free cooking when hands are dirty

### 6. **Shopping List Management** 🛒
- One-click addition of missing ingredients
- Persistent storage using localStorage
- Shopping cart badge with item count
- Remove individual items
- Clear all items functionality
- Modal interface for list management

### 7. **Mobile-Optimized Design** 📱
- Responsive design that works on all screen sizes
- Mobile tab navigation (Scan / Recipes / Filters)
- Touch-friendly buttons and controls
- Camera capture support for mobile devices
- Optimized layouts for portrait and landscape modes
- Hover effects on desktop, tap effects on mobile

### 8. **User Experience Enhancements** ✨
- Smooth animations and transitions
- Color-coded difficulty levels (green/orange/red)
- Recipe cards with hover effects
- Modal overlays for cooking mode and shopping list
- Success notifications for actions
- Empty state messages with helpful icons

## 📊 Data Architecture

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
- **Frontend LocalStorage**: Shopping list persistence
- **In-Memory State**: Current ingredients, recipes, cooking session
- **Future**: Ready for Cloudflare D1 database integration for user preferences and recipe history

## 🎯 User Guide

### Getting Started
1. **Upload a Fridge Photo**
   - Click the upload area or tap on mobile
   - Take a new photo or choose from gallery
   - Wait for the image to load

2. **Analyze Ingredients**
   - Click "Analyze Ingredients" button
   - View detected ingredients as green chips
   - Automatically see recipe suggestions

3. **Filter Recipes** (Optional)
   - Use the sidebar filters (desktop) or Filters tab (mobile)
   - Select dietary restrictions that apply
   - Recipes update automatically

4. **Choose a Recipe**
   - Browse recipe cards with difficulty, time, and calorie info
   - Yellow badge shows missing ingredients count
   - Green badge indicates all ingredients available
   - Click "Start Cooking" on any recipe

5. **Cook with Step-by-Step Mode**
   - Follow numbered instructions
   - Current step highlighted in blue
   - Click "Read Aloud" for hands-free guidance
   - Use Previous/Next buttons to navigate
   - Add missing ingredients to shopping list

6. **Manage Shopping List**
   - Click shopping cart icon in header
   - View all items you need to buy
   - Remove items individually
   - Clear entire list when done shopping

### Mobile Usage Tips
- Use tab navigation at top: Scan | Recipes | Filters
- Swipe through tabs for quick access
- Hold phone in portrait mode for best experience
- Use voice guidance when hands are occupied

## 🚀 Deployment

### Current Status
✅ **Active** - Development server running on sandbox

### Local Development
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start development server
pm2 start ecosystem.config.cjs

# View logs
pm2 logs webapp --nostream

# Stop server
pm2 delete webapp
```

### Production Deployment to Cloudflare Pages

```bash
# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy:prod

# Or use wrangler directly
wrangler pages deploy dist --project-name webapp
```

## 🔮 Future Enhancements

### High Priority
1. **Real AI Integration** 🤖
   - Connect to OpenAI Vision API or Google Cloud Vision
   - Implement actual ingredient recognition from photos
   - Train model on fridge/pantry images

2. **User Accounts & Profiles** 👤
   - Save favorite recipes
   - Track cooking history
   - Personalized recommendations
   - Dietary preference storage

3. **Recipe Database** 📚
   - Expand to 100+ recipes
   - User-contributed recipes
   - Recipe ratings and reviews
   - Cooking tips and variations

### Medium Priority
4. **Advanced Features** 🎨
   - Recipe search by name
   - Ingredient substitution suggestions
   - Meal planning calendar
   - Nutrition facts breakdown
   - Print recipe cards

5. **Social Features** 👥
   - Share recipes via link
   - Social media integration
   - Cooking challenges
   - Community recipe collection

6. **Smart Features** 🧠
   - Timer integration for cooking steps
   - Video tutorials for complex steps
   - Kitchen equipment checker
   - Ingredient expiration tracking

### Low Priority
7. **Integrations** 🔌
   - Grocery delivery API integration
   - Smart appliance connectivity
   - Meal kit service partnerships
   - Restaurant reservation links

## 🛠️ Technical Details

### Frontend Technologies
- **TailwindCSS**: Utility-first CSS framework via CDN
- **Font Awesome**: Icon library for UI elements
- **Axios**: HTTP client for API requests
- **Web Speech API**: Text-to-speech functionality
- **LocalStorage API**: Client-side data persistence

### Backend Technologies
- **Hono**: Lightweight web framework for Cloudflare Workers
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool
- **Wrangler**: Cloudflare deployment CLI

### API Architecture
- RESTful API design
- JSON request/response format
- CORS enabled for cross-origin requests
- Simulated AI responses (ready for production AI)

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Flexbox and Grid layouts
- Touch-optimized interactions

## 📝 Recent Updates

**2025-01-09**: Initial release
- ✅ Complete fridge scanning interface
- ✅ AI ingredient detection (simulated)
- ✅ 8 diverse recipes with full details
- ✅ Dietary filtering system
- ✅ Step-by-step cooking mode
- ✅ Text-to-speech integration
- ✅ Shopping list management
- ✅ Full mobile responsiveness
- ✅ Git repository initialized
- ✅ Deployed to development sandbox

## 🤝 Contributing

To contribute to this project:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both mobile and desktop
5. Submit a pull request

## 📄 License

This project is ready for production use with proper AI API integration.

---

**Built with ❤️ using Hono, TypeScript, and Cloudflare Pages**
