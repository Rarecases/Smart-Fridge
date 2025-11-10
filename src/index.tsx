import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'

type Bindings = {
  DB: D1Database
  OPENAI_API_KEY: string
  SESSION_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ==================== AUTHENTICATION ROUTES ====================

// Signup endpoint
app.post('/api/auth/signup', async (c) => {
  try {
    const { email, password, name, dietaryPreferences } = await c.req.json()
    
    // Validate input
    if (!email || !password || !name) {
      return c.json({ success: false, error: 'Missing required fields' }, 400)
    }
    
    // Simple password hashing (in production, use bcrypt or similar)
    const passwordHash = await hashPassword(password)
    
    // Check if user exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first()
    
    if (existing) {
      return c.json({ success: false, error: 'Email already registered' }, 409)
    }
    
    // Create user
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, password_hash, name, dietary_preferences) VALUES (?, ?, ?, ?)'
    ).bind(email, passwordHash, name, dietaryPreferences || '').run()
    
    const userId = result.meta.last_row_id
    
    // Create session
    const sessionToken = generateToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    
    await c.env.DB.prepare(
      'INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)'
    ).bind(userId, sessionToken, expiresAt.toISOString()).run()
    
    // Set cookie
    setCookie(c, 'session_token', sessionToken, {
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: true,
      secure: true,
      sameSite: 'Lax'
    })
    
    return c.json({
      success: true,
      user: { id: userId, email, name, dietaryPreferences }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return c.json({ success: false, error: 'Failed to create account' }, 500)
  }
})

// Login endpoint
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ success: false, error: 'Missing credentials' }, 400)
    }
    
    // Find user
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, password_hash, dietary_preferences FROM users WHERE email = ?'
    ).bind(email).first() as any
    
    if (!user) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401)
    }
    
    // Verify password
    const passwordMatch = await verifyPassword(password, user.password_hash)
    if (!passwordMatch) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401)
    }
    
    // Update last login
    await c.env.DB.prepare(
      'UPDATE users SET last_login = ? WHERE id = ?'
    ).bind(new Date().toISOString(), user.id).run()
    
    // Create session
    const sessionToken = generateToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    
    await c.env.DB.prepare(
      'INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)'
    ).bind(user.id, sessionToken, expiresAt.toISOString()).run()
    
    // Set cookie
    setCookie(c, 'session_token', sessionToken, {
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: true,
      secure: true,
      sameSite: 'Lax'
    })
    
    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        dietaryPreferences: user.dietary_preferences
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ success: false, error: 'Failed to login' }, 500)
  }
})

// Logout endpoint
app.post('/api/auth/logout', async (c) => {
  try {
    const sessionToken = getCookie(c, 'session_token')
    
    if (sessionToken) {
      await c.env.DB.prepare(
        'DELETE FROM sessions WHERE session_token = ?'
      ).bind(sessionToken).run()
    }
    
    deleteCookie(c, 'session_token')
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to logout' }, 500)
  }
})

// Get current user
app.get('/api/auth/me', async (c) => {
  try {
    const sessionToken = getCookie(c, 'session_token')
    
    if (!sessionToken) {
      return c.json({ success: false, authenticated: false }, 401)
    }
    
    // Find session
    const session = await c.env.DB.prepare(
      'SELECT user_id, expires_at FROM sessions WHERE session_token = ?'
    ).bind(sessionToken).first() as any
    
    if (!session || new Date(session.expires_at) < new Date()) {
      deleteCookie(c, 'session_token')
      return c.json({ success: false, authenticated: false }, 401)
    }
    
    // Get user
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, dietary_preferences FROM users WHERE id = ?'
    ).bind(session.user_id).first() as any
    
    return c.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        dietaryPreferences: user.dietary_preferences
      }
    })
  } catch (error) {
    return c.json({ success: false, authenticated: false }, 500)
  }
})

// ==================== RECIPE ROUTES ====================

// Save recipe
app.post('/api/recipes/save', async (c) => {
  try {
    const user = await getAuthenticatedUser(c)
    if (!user) {
      return c.json({ success: false, error: 'Not authenticated' }, 401)
    }
    
    const { recipeId } = await c.req.json()
    
    await c.env.DB.prepare(
      'INSERT OR IGNORE INTO saved_recipes (user_id, recipe_id) VALUES (?, ?)'
    ).bind(user.id, recipeId).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to save recipe' }, 500)
  }
})

// Get saved recipes
app.get('/api/recipes/saved', async (c) => {
  try {
    const user = await getAuthenticatedUser(c)
    if (!user) {
      return c.json({ success: false, error: 'Not authenticated' }, 401)
    }
    
    const saved = await c.env.DB.prepare(
      'SELECT recipe_id FROM saved_recipes WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(user.id).all()
    
    return c.json({
      success: true,
      recipeIds: saved.results.map((r: any) => r.recipe_id)
    })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to get saved recipes' }, 500)
  }
})

// ==================== INGREDIENT ANALYSIS ====================

// Analyze fridge image with OpenAI Vision
app.post('/api/analyze-fridge', async (c) => {
  try {
    const { imageData } = await c.req.json()
    
    // Check if OpenAI API key is configured
    const apiKey = c.env.OPENAI_API_KEY
    if (!apiKey || apiKey === 'your-openai-api-key-here') {
      // Fallback to simulated data if no API key
      return c.json({
        success: true,
        ingredients: [
          'eggs', 'milk', 'tomatoes', 'chicken breast', 'lettuce',
          'cheese', 'onions', 'garlic', 'bell peppers', 'carrots',
          'butter', 'bread', 'yogurt', 'spinach', 'mushrooms'
        ],
        message: 'Using simulated data (OpenAI API key not configured)'
      })
    }
    
    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'You are a food recognition AI. Analyze this image of a refrigerator and list all visible food ingredients. Return ONLY a JSON array of ingredient names, nothing else. Example: ["eggs", "milk", "cheese"]. Be specific and only include items you can clearly see.'
              },
              {
                type: 'image_url',
                image_url: { url: imageData }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    })
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }
    
    const data = await response.json() as any
    const content = data.choices[0]?.message?.content || '[]'
    
    // Parse the JSON array from the response
    let ingredients: string[]
    try {
      ingredients = JSON.parse(content)
    } catch {
      // If parsing fails, extract ingredients from text
      ingredients = content.match(/"([^"]+)"/g)?.map((s: string) => s.replace(/"/g, '')) || []
    }
    
    return c.json({
      success: true,
      ingredients,
      message: 'Successfully identified ingredients using OpenAI Vision'
    })
  } catch (error) {
    console.error('Error analyzing fridge:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to analyze image. Please check your OpenAI API key.' 
    }, 500)
  }
})

// Get recipe suggestions
app.post('/api/get-recipes', async (c) => {
  try {
    const { ingredients, dietaryRestrictions } = await c.req.json()
    
    // Get user preferences if authenticated
    const user = await getAuthenticatedUser(c)
    let userPreferences: string[] = []
    if (user && user.dietaryPreferences) {
      userPreferences = user.dietaryPreferences.split(',').map((p: string) => p.trim())
    }
    
    // Merge with requested filters
    const allFilters = [...new Set([...dietaryRestrictions, ...userPreferences])]
    
    // Sample recipe database
    const allRecipes = [
      {
        id: 1,
        name: 'Classic Omelette',
        ingredients: ['eggs', 'milk', 'cheese', 'butter'],
        difficulty: 'Easy',
        prepTime: '10 mins',
        calories: 320,
        servings: 2,
        dietary: ['vegetarian', 'gluten-free'],
        image: '🍳',
        steps: [
          'Crack 3 eggs into a bowl and whisk with 2 tablespoons of milk',
          'Heat butter in a non-stick pan over medium heat',
          'Pour the egg mixture into the pan and let it cook for 1-2 minutes',
          'Add shredded cheese on one half of the omelette',
          'Fold the omelette in half and cook for another minute',
          'Slide onto a plate and serve hot'
        ]
      },
      {
        id: 2,
        name: 'Chicken Salad',
        ingredients: ['chicken breast', 'lettuce', 'tomatoes', 'onions'],
        difficulty: 'Easy',
        prepTime: '15 mins',
        calories: 280,
        servings: 2,
        dietary: ['keto', 'paleo', 'low-carb'],
        image: '🥗',
        steps: [
          'Grill or pan-fry the chicken breast until fully cooked (about 6-8 minutes per side)',
          'Let the chicken rest for 5 minutes, then slice into strips',
          'Chop lettuce, tomatoes, and onions into bite-sized pieces',
          'Combine all vegetables in a large bowl',
          'Add the sliced chicken on top',
          'Drizzle with your favorite dressing and toss gently'
        ]
      },
      {
        id: 3,
        name: 'Stuffed Bell Peppers',
        ingredients: ['bell peppers', 'chicken breast', 'onions', 'cheese', 'tomatoes'],
        difficulty: 'Medium',
        prepTime: '45 mins',
        calories: 380,
        servings: 4,
        dietary: ['keto', 'low-carb'],
        image: '🫑',
        steps: [
          'Preheat oven to 375°F (190°C)',
          'Cut the tops off bell peppers and remove seeds',
          'Cook ground or diced chicken with chopped onions in a pan',
          'Add diced tomatoes and season with salt, pepper, and herbs',
          'Stuff the bell peppers with the chicken mixture',
          'Top with shredded cheese',
          'Bake for 25-30 minutes until peppers are tender',
          'Let cool for 5 minutes before serving'
        ]
      },
      {
        id: 4,
        name: 'Mushroom Spinach Pasta',
        ingredients: ['mushrooms', 'spinach', 'garlic', 'butter', 'cheese'],
        difficulty: 'Easy',
        prepTime: '20 mins',
        calories: 420,
        servings: 3,
        dietary: ['vegetarian'],
        image: '🍝',
        steps: [
          'Cook pasta according to package directions',
          'In a large pan, melt butter and sauté minced garlic until fragrant',
          'Add sliced mushrooms and cook until golden brown (5-7 minutes)',
          'Add fresh spinach and cook until wilted (2-3 minutes)',
          'Drain pasta and add to the pan',
          'Toss everything together, adding pasta water if needed',
          'Top with grated cheese and serve immediately'
        ]
      },
      {
        id: 5,
        name: 'Veggie Stir-Fry',
        ingredients: ['bell peppers', 'carrots', 'onions', 'garlic', 'mushrooms'],
        difficulty: 'Easy',
        prepTime: '15 mins',
        calories: 210,
        servings: 2,
        dietary: ['vegan', 'vegetarian', 'paleo', 'low-carb'],
        image: '🥘',
        steps: [
          'Heat oil in a wok or large pan over high heat',
          'Add minced garlic and sliced onions, stir-fry for 1 minute',
          'Add sliced bell peppers and carrots, stir-fry for 3-4 minutes',
          'Add sliced mushrooms and continue cooking for 2 minutes',
          'Season with soy sauce, salt, and pepper',
          'Serve hot over rice or enjoy as is'
        ]
      },
      {
        id: 6,
        name: 'Greek Yogurt Parfait',
        ingredients: ['yogurt', 'eggs'],
        difficulty: 'Easy',
        prepTime: '5 mins',
        calories: 250,
        servings: 1,
        dietary: ['vegetarian', 'gluten-free'],
        image: '🥣',
        steps: [
          'Layer Greek yogurt in a glass or bowl',
          'Add your favorite berries or fruit',
          'Sprinkle with granola or nuts',
          'Drizzle with honey if desired',
          'Enjoy immediately or refrigerate for later'
        ]
      },
      {
        id: 7,
        name: 'Cheesy Garlic Bread',
        ingredients: ['bread', 'cheese', 'garlic', 'butter'],
        difficulty: 'Easy',
        prepTime: '12 mins',
        calories: 310,
        servings: 4,
        dietary: ['vegetarian'],
        image: '🥖',
        steps: [
          'Preheat oven to 400°F (200°C)',
          'Mix softened butter with minced garlic',
          'Slice bread and spread the garlic butter generously',
          'Top with shredded cheese',
          'Bake for 8-10 minutes until cheese is melted and bubbly',
          'Serve warm'
        ]
      },
      {
        id: 8,
        name: 'Chicken Veggie Soup',
        ingredients: ['chicken breast', 'carrots', 'onions', 'garlic', 'spinach'],
        difficulty: 'Medium',
        prepTime: '35 mins',
        calories: 240,
        servings: 6,
        dietary: ['paleo', 'low-carb'],
        image: '🍲',
        steps: [
          'In a large pot, heat oil and sauté diced onions and garlic',
          'Add cubed chicken breast and cook until browned',
          'Add diced carrots and cook for 5 minutes',
          'Pour in chicken broth (6 cups) and bring to a boil',
          'Reduce heat and simmer for 20 minutes',
          'Add fresh spinach and cook for 2 more minutes',
          'Season with salt, pepper, and herbs',
          'Serve hot with crusty bread'
        ]
      }
    ]
    
    // Calculate match scores and filter recipes
    const recipesWithScores = allRecipes.map(recipe => {
      // Count how many recipe ingredients the user has
      const matchedIngredients = recipe.ingredients.filter(ing => 
        ingredients.some((userIng: string) => {
          const recipeIngLower = ing.toLowerCase()
          const userIngLower = userIng.toLowerCase()
          // Check for exact matches or partial matches
          return recipeIngLower === userIngLower || 
                 recipeIngLower.includes(userIngLower) || 
                 userIngLower.includes(recipeIngLower)
        })
      )
      
      // Calculate missing ingredients
      const missing = recipe.ingredients.filter(ing => 
        !ingredients.some((userIng: string) => {
          const recipeIngLower = ing.toLowerCase()
          const userIngLower = userIng.toLowerCase()
          return recipeIngLower === userIngLower || 
                 recipeIngLower.includes(userIngLower) || 
                 userIngLower.includes(recipeIngLower)
        })
      )
      
      // Calculate match percentage
      const matchPercentage = (matchedIngredients.length / recipe.ingredients.length) * 100
      const matchScore = matchedIngredients.length
      
      return {
        ...recipe,
        missingIngredients: missing,
        matchScore: matchScore,
        matchPercentage: matchPercentage,
        matchedCount: matchedIngredients.length
      }
    })
    
    // IMPORTANT: Only show recipes where user has at least 50% of ingredients
    // OR recipes with 3 or fewer missing ingredients
    let matchingRecipes = recipesWithScores.filter(recipe => {
      const hasMinimumMatch = recipe.matchPercentage >= 50 || recipe.missingIngredients.length <= 3
      
      // Apply dietary filters if specified
      if (allFilters && allFilters.length > 0) {
        const matchesDiet = allFilters.some((diet: string) => 
          recipe.dietary.includes(diet.toLowerCase())
        )
        return hasMinimumMatch && matchesDiet
      }
      
      return hasMinimumMatch
    })
    
    // Sort by match score (higher = better match)
    matchingRecipes.sort((a, b) => {
      // First prioritize by match percentage
      if (b.matchPercentage !== a.matchPercentage) {
        return b.matchPercentage - a.matchPercentage
      }
      // Then by number of matched ingredients
      return b.matchScore - a.matchScore
    })
    
    return c.json({
      success: true,
      recipes: matchingRecipes,
      count: matchingRecipes.length
    })
  } catch (error) {
    console.error('Error fetching recipes:', error)
    return c.json({ success: false, error: 'Failed to fetch recipes' }, 500)
  }
})

// ==================== BARCODE SCANNING ====================

// Scan barcode and get product info
app.post('/api/barcode/scan', async (c) => {
  try {
    const user = await getAuthenticatedUser(c)
    if (!user) {
      return c.json({ success: false, error: 'Not authenticated' }, 401)
    }
    
    const { barcode } = await c.req.json()
    
    if (!barcode) {
      return c.json({ success: false, error: 'Barcode required' }, 400)
    }
    
    // Call Open Food Facts API for product information
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data = await response.json() as any
    
    if (data.status === 1 && data.product) {
      const product = data.product
      
      // Save to database
      await c.env.DB.prepare(
        `INSERT INTO scanned_products (user_id, barcode, product_name, brand, ingredients, nutritional_info, allergens, expiry_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        user.id,
        barcode,
        product.product_name || 'Unknown Product',
        product.brands || '',
        product.ingredients_text || '',
        JSON.stringify(product.nutriments || {}),
        product.allergens || '',
        ''
      ).run()
      
      return c.json({
        success: true,
        product: {
          name: product.product_name,
          brand: product.brands,
          ingredients: product.ingredients_text,
          image: product.image_url,
          nutritionalInfo: product.nutriments,
          allergens: product.allergens_tags || [],
          categories: product.categories_tags || []
        }
      })
    } else {
      return c.json({
        success: false,
        error: 'Product not found',
        message: 'Try entering product details manually'
      }, 404)
    }
  } catch (error) {
    console.error('Barcode scan error:', error)
    return c.json({ success: false, error: 'Failed to scan barcode' }, 500)
  }
})

// Get scanned products history
app.get('/api/barcode/history', async (c) => {
  try {
    const user = await getAuthenticatedUser(c)
    if (!user) {
      return c.json({ success: false, error: 'Not authenticated' }, 401)
    }
    
    const products = await c.env.DB.prepare(
      'SELECT * FROM scanned_products WHERE user_id = ? ORDER BY scanned_at DESC LIMIT 50'
    ).bind(user.id).all()
    
    return c.json({
      success: true,
      products: products.results
    })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to get history' }, 500)
  }
})

// ==================== COOKING HISTORY ====================

// Save cooking session
app.post('/api/cooking/complete', async (c) => {
  try {
    const user = await getAuthenticatedUser(c)
    if (!user) {
      return c.json({ success: false, error: 'Not authenticated' }, 401)
    }
    
    const { recipeId, recipeName, recipeImage, cookingTimeMinutes, rating, notes } = await c.req.json()
    
    // Save to history
    await c.env.DB.prepare(
      `INSERT INTO cooking_history (user_id, recipe_id, recipe_name, recipe_image, completed, cooking_time_minutes, rating, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(user.id, recipeId, recipeName, recipeImage, 1, cookingTimeMinutes || 0, rating || 0, notes || '').run()
    
    // Update user stats
    await c.env.DB.prepare(
      'UPDATE users SET total_recipes_cooked = total_recipes_cooked + 1 WHERE id = ?'
    ).bind(user.id).run()
    
    // Check for achievements
    const totalCooked = await c.env.DB.prepare(
      'SELECT total_recipes_cooked FROM users WHERE id = ?'
    ).bind(user.id).first() as any
    
    const achievements = []
    
    if (totalCooked.total_recipes_cooked === 1) {
      achievements.push({
        type: 'first_cook',
        name: 'First Recipe!',
        icon: '🎉'
      })
    } else if (totalCooked.total_recipes_cooked === 5) {
      achievements.push({
        type: 'five_recipes',
        name: 'Home Chef',
        icon: '👨‍🍳'
      })
    } else if (totalCooked.total_recipes_cooked === 10) {
      achievements.push({
        type: 'ten_recipes',
        name: 'Cooking Master',
        icon: '⭐'
      })
    }
    
    // Save achievements
    for (const achievement of achievements) {
      await c.env.DB.prepare(
        'INSERT INTO achievements (user_id, achievement_type, achievement_name, achievement_icon) VALUES (?, ?, ?, ?)'
      ).bind(user.id, achievement.type, achievement.name, achievement.icon).run()
    }
    
    return c.json({
      success: true,
      achievements,
      totalCooked: totalCooked.total_recipes_cooked
    })
  } catch (error) {
    console.error('Error saving cooking session:', error)
    return c.json({ success: false, error: 'Failed to save cooking session' }, 500)
  }
})

// Get cooking history
app.get('/api/cooking/history', async (c) => {
  try {
    const user = await getAuthenticatedUser(c)
    if (!user) {
      return c.json({ success: false, error: 'Not authenticated' }, 401)
    }
    
    const history = await c.env.DB.prepare(
      'SELECT * FROM cooking_history WHERE user_id = ? ORDER BY cooked_at DESC LIMIT 50'
    ).bind(user.id).all()
    
    return c.json({
      success: true,
      history: history.results
    })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to get history' }, 500)
  }
})

// Get user stats
app.get('/api/user/stats', async (c) => {
  try {
    const user = await getAuthenticatedUser(c)
    if (!user) {
      return c.json({ success: false, error: 'Not authenticated' }, 401)
    }
    
    const userStats = await c.env.DB.prepare(
      'SELECT total_recipes_cooked, current_streak, best_streak, avatar FROM users WHERE id = ?'
    ).bind(user.id).first() as any
    
    const achievements = await c.env.DB.prepare(
      'SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC'
    ).bind(user.id).all()
    
    const recentHistory = await c.env.DB.prepare(
      'SELECT * FROM cooking_history WHERE user_id = ? ORDER BY cooked_at DESC LIMIT 5'
    ).bind(user.id).all()
    
    return c.json({
      success: true,
      stats: {
        totalRecipesCooked: userStats.total_recipes_cooked || 0,
        currentStreak: userStats.current_streak || 0,
        bestStreak: userStats.best_streak || 0,
        avatar: userStats.avatar || 'chef1'
      },
      achievements: achievements.results,
      recentHistory: recentHistory.results
    })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to get stats' }, 500)
  }
})

// Update user avatar
app.post('/api/user/avatar', async (c) => {
  try {
    const user = await getAuthenticatedUser(c)
    if (!user) {
      return c.json({ success: false, error: 'Not authenticated' }, 401)
    }
    
    const { avatar } = await c.req.json()
    
    await c.env.DB.prepare(
      'UPDATE users SET avatar = ? WHERE id = ?'
    ).bind(avatar, user.id).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to update avatar' }, 500)
  }
})

// ==================== MAIN PAGE ====================

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Smart Fridge & Culinary Assistant</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                animation: {
                  'float': 'float 3s ease-in-out infinite',
                  'slide-in-right': 'slideInRight 0.5s ease-out',
                  'slide-in-left': 'slideInLeft 0.5s ease-out',
                  'fade-in': 'fadeIn 0.5s ease-out',
                  'bounce-slow': 'bounce 2s infinite',
                  'pulse-slow': 'pulse 3s infinite',
                  'shimmer': 'shimmer 2s infinite',
                }
              }
            }
          }
        </script>
    </head>
    <body class="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script type="module" src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
        <script src="/static/features.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

// ==================== HELPER FUNCTIONS ====================

async function getAuthenticatedUser(c: any) {
  try {
    const sessionToken = getCookie(c, 'session_token')
    if (!sessionToken) return null
    
    const session = await c.env.DB.prepare(
      'SELECT user_id, expires_at FROM sessions WHERE session_token = ?'
    ).bind(sessionToken).first() as any
    
    if (!session || new Date(session.expires_at) < new Date()) {
      return null
    }
    
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, dietary_preferences FROM users WHERE id = ?'
    ).bind(session.user_id).first() as any
    
    return user
  } catch {
    return null
  }
}

async function hashPassword(password: string): Promise<string> {
  // Simple hash for demo - in production use bcrypt or Web Crypto API
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password)
  return newHash === hash
}

function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

export default app
