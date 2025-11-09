import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// API route to analyze fridge image and identify ingredients
app.post('/api/analyze-fridge', async (c) => {
  try {
    const { imageData } = await c.req.json()
    
    // Simulated AI ingredient detection
    // In production, this would call an AI vision API
    const ingredients = [
      'eggs', 'milk', 'tomatoes', 'chicken breast', 'lettuce',
      'cheese', 'onions', 'garlic', 'bell peppers', 'carrots',
      'butter', 'bread', 'yogurt', 'spinach', 'mushrooms'
    ]
    
    return c.json({
      success: true,
      ingredients: ingredients,
      message: 'Successfully identified ingredients'
    })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to analyze image' }, 500)
  }
})

// API route to get recipe suggestions based on ingredients and filters
app.post('/api/get-recipes', async (c) => {
  try {
    const { ingredients, dietaryRestrictions } = await c.req.json()
    
    // Sample recipe database with comprehensive information
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
    
    // Filter recipes based on available ingredients
    const matchingRecipes = allRecipes.filter(recipe => {
      const hasIngredients = recipe.ingredients.some(ing => 
        ingredients.some((userIng: string) => 
          userIng.toLowerCase().includes(ing.toLowerCase()) || 
          ing.toLowerCase().includes(userIng.toLowerCase())
        )
      )
      
      // Filter by dietary restrictions if provided
      if (dietaryRestrictions && dietaryRestrictions.length > 0) {
        const matchesDiet = dietaryRestrictions.some((diet: string) => 
          recipe.dietary.includes(diet.toLowerCase())
        )
        return hasIngredients && matchesDiet
      }
      
      return hasIngredients
    })
    
    // Calculate missing ingredients for each recipe
    const recipesWithMissing = matchingRecipes.map(recipe => {
      const missing = recipe.ingredients.filter(ing => 
        !ingredients.some((userIng: string) => 
          userIng.toLowerCase().includes(ing.toLowerCase()) || 
          ing.toLowerCase().includes(userIng.toLowerCase())
        )
      )
      
      return {
        ...recipe,
        missingIngredients: missing,
        matchScore: recipe.ingredients.length - missing.length
      }
    })
    
    // Sort by match score (fewer missing ingredients = higher score)
    recipesWithMissing.sort((a, b) => b.matchScore - a.matchScore)
    
    return c.json({
      success: true,
      recipes: recipesWithMissing,
      count: recipesWithMissing.length
    })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch recipes' }, 500)
  }
})

// Main page route
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
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }
          .recipe-card {
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .recipe-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          }
          .difficulty-easy { color: #10b981; }
          .difficulty-medium { color: #f59e0b; }
          .difficulty-hard { color: #ef4444; }
          .step-card {
            transition: all 0.3s;
          }
          .step-card.active {
            border-color: #3b82f6;
            background: #eff6ff;
          }
          .mobile-tab {
            transition: all 0.2s;
          }
          .mobile-tab.active {
            border-bottom: 3px solid #3b82f6;
            color: #3b82f6;
          }
          @media (max-width: 768px) {
            .mobile-hide { display: none; }
          }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- Header -->
        <header class="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
            <div class="container mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-utensils text-3xl"></i>
                        <div>
                            <h1 class="text-2xl font-bold">Smart Fridge</h1>
                            <p class="text-sm text-blue-100">Culinary Assistant</p>
                        </div>
                    </div>
                    <button id="shoppingListBtn" class="relative">
                        <i class="fas fa-shopping-cart text-2xl"></i>
                        <span id="cartCount" class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hidden">0</span>
                    </button>
                </div>
            </div>
        </header>

        <!-- Mobile Navigation Tabs -->
        <div class="md:hidden bg-white shadow-md sticky top-0 z-40">
            <div class="flex">
                <button class="mobile-tab active flex-1 py-3 text-center font-semibold" data-tab="scan">
                    <i class="fas fa-camera mr-1"></i> Scan
                </button>
                <button class="mobile-tab flex-1 py-3 text-center font-semibold" data-tab="recipes">
                    <i class="fas fa-book mr-1"></i> Recipes
                </button>
                <button class="mobile-tab flex-1 py-3 text-center font-semibold" data-tab="filters">
                    <i class="fas fa-filter mr-1"></i> Filters
                </button>
            </div>
        </div>

        <div class="container mx-auto px-4 py-6 md:py-8">
            <div class="flex flex-col md:flex-row gap-6">
                <!-- Left Sidebar - Filters (Desktop) / Tab Content (Mobile) -->
                <aside id="filterSection" class="w-full md:w-64 md:block">
                    <div class="bg-white rounded-lg shadow-md p-4 md:p-6 sticky top-20">
                        <h2 class="text-lg font-bold mb-4 flex items-center">
                            <i class="fas fa-filter mr-2 text-blue-600"></i>
                            Dietary Filters
                        </h2>
                        <div class="space-y-3">
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" value="vegetarian" class="dietary-filter w-4 h-4 text-blue-600 rounded">
                                <span class="text-sm">🥬 Vegetarian</span>
                            </label>
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" value="vegan" class="dietary-filter w-4 h-4 text-blue-600 rounded">
                                <span class="text-sm">🌱 Vegan</span>
                            </label>
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" value="keto" class="dietary-filter w-4 h-4 text-blue-600 rounded">
                                <span class="text-sm">🥑 Keto</span>
                            </label>
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" value="paleo" class="dietary-filter w-4 h-4 text-blue-600 rounded">
                                <span class="text-sm">🥩 Paleo</span>
                            </label>
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" value="gluten-free" class="dietary-filter w-4 h-4 text-blue-600 rounded">
                                <span class="text-sm">🌾 Gluten-Free</span>
                            </label>
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" value="low-carb" class="dietary-filter w-4 h-4 text-blue-600 rounded">
                                <span class="text-sm">⚡ Low-Carb</span>
                            </label>
                        </div>
                        <button id="clearFilters" class="mt-4 w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
                            Clear All
                        </button>
                    </div>
                </aside>

                <!-- Main Content Area -->
                <main class="flex-1">
                    <!-- Scan Section -->
                    <section id="scanSection" class="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
                        <h2 class="text-xl font-bold mb-4 flex items-center">
                            <i class="fas fa-camera mr-2 text-blue-600"></i>
                            Scan Your Fridge
                        </h2>
                        <div class="text-center">
                            <div id="uploadArea" class="border-3 border-dashed border-gray-300 rounded-lg p-8 md:p-12 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                                <i class="fas fa-cloud-upload-alt text-5xl md:text-6xl text-gray-400 mb-4"></i>
                                <p class="text-gray-600 mb-2 text-sm md:text-base">Click to upload or take a photo of your fridge</p>
                                <p class="text-gray-400 text-xs md:text-sm">Supports: JPG, PNG, HEIC</p>
                                <input type="file" id="fridgeImageInput" accept="image/*" capture="environment" class="hidden">
                            </div>
                            <button id="scanBtn" class="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 md:px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base">
                                <i class="fas fa-search mr-2"></i>
                                Analyze Ingredients
                            </button>
                        </div>
                        
                        <!-- Detected Ingredients -->
                        <div id="ingredientsResult" class="mt-6 hidden">
                            <h3 class="text-lg font-semibold mb-3 flex items-center">
                                <i class="fas fa-check-circle mr-2 text-green-600"></i>
                                Detected Ingredients
                            </h3>
                            <div id="ingredientsList" class="flex flex-wrap gap-2"></div>
                        </div>
                    </section>

                    <!-- Recipe Results Section -->
                    <section id="recipesSection" class="md:block">
                        <div id="noRecipes" class="bg-white rounded-lg shadow-md p-8 md:p-12 text-center">
                            <i class="fas fa-utensils text-5xl md:text-6xl text-gray-300 mb-4"></i>
                            <h3 class="text-xl font-semibold text-gray-600 mb-2">No recipes yet</h3>
                            <p class="text-gray-500 text-sm md:text-base">Scan your fridge to get personalized recipe suggestions</p>
                        </div>
                        
                        <div id="recipesList" class="hidden grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6"></div>
                    </section>
                </main>
            </div>
        </div>

        <!-- Cooking Mode Modal -->
        <div id="cookingModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
            <div class="min-h-screen px-4 py-8">
                <div class="bg-white rounded-lg shadow-2xl max-w-3xl mx-auto">
                    <div class="p-4 md:p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                        <h2 id="recipeTitle" class="text-xl md:text-2xl font-bold">Recipe Name</h2>
                        <button id="closeCookingMode" class="text-gray-500 hover:text-gray-700 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="p-4 md:p-6">
                        <!-- Recipe Info -->
                        <div class="mb-6 flex flex-wrap gap-4 text-sm">
                            <div class="flex items-center">
                                <i class="fas fa-clock mr-2 text-blue-600"></i>
                                <span id="recipePrepTime"></span>
                            </div>
                            <div class="flex items-center">
                                <i class="fas fa-fire mr-2 text-orange-600"></i>
                                <span id="recipeCalories"></span>
                            </div>
                            <div class="flex items-center">
                                <i class="fas fa-user-friends mr-2 text-green-600"></i>
                                <span id="recipeServings"></span>
                            </div>
                        </div>
                        
                        <!-- Missing Ingredients Alert -->
                        <div id="missingIngredientsAlert" class="hidden mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <h4 class="font-semibold text-yellow-800 mb-2">Missing Ingredients:</h4>
                                    <div id="missingIngredientsList" class="text-sm text-yellow-700"></div>
                                </div>
                                <button id="addToShoppingList" class="ml-4 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 text-sm whitespace-nowrap">
                                    <i class="fas fa-plus mr-1"></i> Add to List
                                </button>
                            </div>
                        </div>
                        
                        <!-- Step-by-Step Instructions -->
                        <div class="mb-6">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-bold">Step-by-Step Instructions</h3>
                                <button id="readAloudBtn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                                    <i class="fas fa-volume-up mr-2"></i>
                                    <span id="readAloudText">Read Aloud</span>
                                </button>
                            </div>
                            
                            <div id="stepsList" class="space-y-4"></div>
                        </div>
                        
                        <!-- Navigation Buttons -->
                        <div class="flex gap-4">
                            <button id="prevStepBtn" class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                <i class="fas fa-arrow-left mr-2"></i> Previous
                            </button>
                            <button id="nextStepBtn" class="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                Next <i class="fas fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Shopping List Modal -->
        <div id="shoppingListModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
            <div class="min-h-screen px-4 py-8">
                <div class="bg-white rounded-lg shadow-2xl max-w-2xl mx-auto">
                    <div class="p-4 md:p-6 border-b flex justify-between items-center">
                        <h2 class="text-xl md:text-2xl font-bold flex items-center">
                            <i class="fas fa-shopping-cart mr-2 text-blue-600"></i>
                            Shopping List
                        </h2>
                        <button id="closeShoppingList" class="text-gray-500 hover:text-gray-700 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="p-4 md:p-6">
                        <div id="shoppingListEmpty" class="text-center py-12">
                            <i class="fas fa-shopping-basket text-6xl text-gray-300 mb-4"></i>
                            <p class="text-gray-500">Your shopping list is empty</p>
                        </div>
                        
                        <div id="shoppingListContent" class="hidden">
                            <ul id="shoppingListItems" class="space-y-2 mb-4"></ul>
                            <button id="clearShoppingList" class="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium">
                                <i class="fas fa-trash mr-2"></i> Clear All
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
