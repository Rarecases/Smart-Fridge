// Global state
let user = null
let detectedIngredients = []
let currentRecipes = []
let currentRecipe = null
let currentStep = 0
let speechSynthesis = window.speechSynthesis
let isSpeaking = false
let shoppingList = []
let savedRecipeIds = []
let userAvatar = 'chef1'
let cookingHistory = []
let userStats = null
let html5QrcodeScanner = null
let cookingStartTime = null
let stepTimers = {}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  checkAuth()
  loadShoppingList()
})

// Check authentication status
async function checkAuth() {
  try {
    const response = await axios.get('/api/auth/me')
    if (response.data.authenticated) {
      user = response.data.user
      await loadSavedRecipes()
      renderApp()
    } else {
      user = null
      renderAuthScreen()
    }
  } catch (error) {
    user = null
    renderAuthScreen()
  }
}

// Render authentication screen
function renderAuthScreen() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
      <!-- Animated background elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
        <div class="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style="animation-delay: 2s"></div>
        <div class="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style="animation-delay: 4s"></div>
      </div>
      
      <div class="auth-container glass rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full relative z-10">
        <!-- Logo and Title -->
        <div class="text-center mb-8">
          <div class="inline-block p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4 animate-pulse-slow">
            <i class="fas fa-utensils text-4xl text-white"></i>
          </div>
          <h1 class="text-4xl font-bold gradient-text mb-2">Smart Fridge</h1>
          <p class="text-gray-600">Your AI Culinary Assistant</p>
        </div>
        
        <!-- Auth Tabs -->
        <div class="flex gap-4 mb-6">
          <button onclick="showLoginForm()" id="loginTab" class="tab-indicator active flex-1 py-3 font-semibold text-gray-700 transition-colors">
            Login
          </button>
          <button onclick="showSignupForm()" id="signupTab" class="tab-indicator flex-1 py-3 font-semibold text-gray-500 transition-colors">
            Sign Up
          </button>
        </div>
        
        <!-- Login Form -->
        <form id="loginForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" id="loginEmail" required 
              class="input-enhanced w-full px-4 py-3 rounded-xl bg-white focus:outline-none"
              placeholder="your@email.com">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input type="password" id="loginPassword" required 
              class="input-enhanced w-full px-4 py-3 rounded-xl bg-white focus:outline-none"
              placeholder="••••••••">
          </div>
          <button type="submit" 
            class="btn-shimmer w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
            <i class="fas fa-sign-in-alt mr-2"></i> Login
          </button>
        </form>
        
        <!-- Signup Form -->
        <form id="signupForm" class="space-y-4 hidden">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input type="text" id="signupName" required 
              class="input-enhanced w-full px-4 py-3 rounded-xl bg-white focus:outline-none"
              placeholder="John Doe">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" id="signupEmail" required 
              class="input-enhanced w-full px-4 py-3 rounded-xl bg-white focus:outline-none"
              placeholder="your@email.com">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input type="password" id="signupPassword" required 
              class="input-enhanced w-full px-4 py-3 rounded-xl bg-white focus:outline-none"
              placeholder="••••••••" minlength="6">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Dietary Preferences (optional)</label>
            <select id="signupDietary" multiple
              class="input-enhanced w-full px-4 py-3 rounded-xl bg-white focus:outline-none">
              <option value="vegetarian">🥬 Vegetarian</option>
              <option value="vegan">🌱 Vegan</option>
              <option value="keto">🥑 Keto</option>
              <option value="paleo">🥩 Paleo</option>
              <option value="gluten-free">🌾 Gluten-Free</option>
              <option value="low-carb">⚡ Low-Carb</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
          </div>
          <button type="submit" 
            class="btn-shimmer w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
            <i class="fas fa-user-plus mr-2"></i> Create Account
          </button>
        </form>
        
        <div id="authError" class="hidden mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p class="text-red-700 text-sm"></p>
        </div>
      </div>
    </div>
  `
  
  // Attach event listeners
  document.getElementById('loginForm').addEventListener('submit', handleLogin)
  document.getElementById('signupForm').addEventListener('submit', handleSignup)
}

function showLoginForm() {
  document.getElementById('loginForm').classList.remove('hidden')
  document.getElementById('signupForm').classList.add('hidden')
  document.getElementById('loginTab').classList.add('active')
  document.getElementById('signupTab').classList.remove('active')
  document.getElementById('authError').classList.add('hidden')
}

function showSignupForm() {
  document.getElementById('loginForm').classList.add('hidden')
  document.getElementById('signupForm').classList.remove('hidden')
  document.getElementById('loginTab').classList.remove('active')
  document.getElementById('signupTab').classList.add('active')
  document.getElementById('authError').classList.add('hidden')
}

async function handleLogin(e) {
  e.preventDefault()
  
  const email = document.getElementById('loginEmail').value
  const password = document.getElementById('loginPassword').value
  
  try {
    const response = await axios.post('/api/auth/login', { email, password })
    if (response.data.success) {
      user = response.data.user
      await loadSavedRecipes()
      showNotification('Welcome back, ' + user.name + '! 🎉', 'success')
      renderApp()
    }
  } catch (error) {
    showAuthError(error.response?.data?.error || 'Login failed. Please try again.')
  }
}

async function handleSignup(e) {
  e.preventDefault()
  
  const name = document.getElementById('signupName').value
  const email = document.getElementById('signupEmail').value
  const password = document.getElementById('signupPassword').value
  const dietarySelect = document.getElementById('signupDietary')
  const dietaryPreferences = Array.from(dietarySelect.selectedOptions).map(opt => opt.value).join(',')
  
  try {
    const response = await axios.post('/api/auth/signup', { 
      email, password, name, dietaryPreferences 
    })
    if (response.data.success) {
      user = response.data.user
      showNotification('Account created! Welcome, ' + user.name + '! 🎉', 'success')
      renderApp()
    }
  } catch (error) {
    showAuthError(error.response?.data?.error || 'Signup failed. Please try again.')
  }
}

function showAuthError(message) {
  const errorDiv = document.getElementById('authError')
  errorDiv.querySelector('p').textContent = message
  errorDiv.classList.remove('hidden')
}

async function handleLogout() {
  try {
    await axios.post('/api/auth/logout')
    user = null
    savedRecipeIds = []
    detectedIngredients = []
    currentRecipes = []
    showNotification('Logged out successfully', 'success')
    renderAuthScreen()
  } catch (error) {
    showNotification('Logout failed', 'error')
  }
}

// Load saved recipes
async function loadSavedRecipes() {
  try {
    const response = await axios.get('/api/recipes/saved')
    if (response.data.success) {
      savedRecipeIds = response.data.recipeIds
    }
  } catch (error) {
    console.error('Failed to load saved recipes:', error)
  }
}

// Save recipe
async function saveRecipe(recipeId) {
  try {
    const response = await axios.post('/api/recipes/save', { recipeId })
    if (response.data.success) {
      savedRecipeIds.push(recipeId)
      showNotification('Recipe saved! ⭐', 'success')
      renderRecipes(currentRecipes)
    }
  } catch (error) {
    showNotification('Failed to save recipe', 'error')
  }
}

// Render main app
function renderApp() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <!-- Animated Header -->
    <header class="gradient-animate shadow-2xl sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3 animate-slide-in-left">
            <div class="relative">
              <i class="fas fa-utensils text-3xl text-white pulse-icon"></i>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-white neon-glow">Smart Fridge</h1>
              <p class="text-sm text-white/80">AI Culinary Assistant</p>
            </div>
          </div>
          <div class="flex items-center space-x-3 animate-slide-in-right">
            <button onclick="showCookingHistory()" class="relative group hidden md:block">
              <i class="fas fa-history text-2xl text-white hover:scale-110 transition-transform"></i>
            </button>
            <button onclick="showAvatarSelection()" class="relative group">
              <div class="avatar-ring w-10 h-10 rounded-full bg-white/20 flex items-center justify-center current-avatar-display text-2xl">
                👨‍🍳
              </div>
            </button>
            <button onclick="showProfile()" class="relative group">
              <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <i class="fas fa-user text-white"></i>
              </div>
            </button>
            <button onclick="toggleShoppingList()" class="relative">
              <i class="fas fa-shopping-cart text-2xl text-white"></i>
              <span id="cartCount" class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hidden cart-bounce">0</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Mobile Navigation -->
    <div class="md:hidden bg-white/70 backdrop-blur-lg shadow-md sticky top-[72px] z-40">
      <div class="flex">
        <button class="mobile-tab active flex-1 py-3 text-center font-semibold transition-all" data-tab="scan">
          <i class="fas fa-camera mr-1"></i> Scan
        </button>
        <button class="mobile-tab flex-1 py-3 text-center font-semibold transition-all" data-tab="recipes">
          <i class="fas fa-book mr-1"></i> Recipes
        </button>
        <button class="mobile-tab flex-1 py-3 text-center font-semibold transition-all" data-tab="filters">
          <i class="fas fa-filter mr-1"></i> Filters
        </button>
      </div>
    </div>

    <div class="container mx-auto px-4 py-6 md:py-8">
      <div class="flex flex-col md:flex-row gap-6">
        <!-- Sidebar -->
        <aside id="filterSection" class="w-full md:w-64 md:block animate-slide-in-left">
          <div class="glass rounded-2xl shadow-xl p-4 md:p-6 sticky top-24 card-hover">
            <h2 class="text-lg font-bold mb-4 flex items-center gradient-text">
              <i class="fas fa-filter mr-2"></i>
              Dietary Filters
            </h2>
            <div class="space-y-3">
              <label class="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" value="vegetarian" class="dietary-filter w-4 h-4 text-blue-600 rounded transition-transform group-hover:scale-125">
                <span class="text-sm group-hover:text-purple-600 transition-colors">🥬 Vegetarian</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" value="vegan" class="dietary-filter w-4 h-4 text-blue-600 rounded transition-transform group-hover:scale-125">
                <span class="text-sm group-hover:text-purple-600 transition-colors">🌱 Vegan</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" value="keto" class="dietary-filter w-4 h-4 text-blue-600 rounded transition-transform group-hover:scale-125">
                <span class="text-sm group-hover:text-purple-600 transition-colors">🥑 Keto</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" value="paleo" class="dietary-filter w-4 h-4 text-blue-600 rounded transition-transform group-hover:scale-125">
                <span class="text-sm group-hover:text-purple-600 transition-colors">🥩 Paleo</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" value="gluten-free" class="dietary-filter w-4 h-4 text-blue-600 rounded transition-transform group-hover:scale-125">
                <span class="text-sm group-hover:text-purple-600 transition-colors">🌾 Gluten-Free</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" value="low-carb" class="dietary-filter w-4 h-4 text-blue-600 rounded transition-transform group-hover:scale-125">
                <span class="text-sm group-hover:text-purple-600 transition-colors">⚡ Low-Carb</span>
              </label>
            </div>
            <button onclick="clearFilters()" class="mt-4 w-full py-2 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl hover:from-gray-300 hover:to-gray-400 text-sm font-medium transition-all btn-shimmer">
              Clear All
            </button>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 animate-fade-in">
          <!-- Scan Section -->
          <section id="scanSection" class="glass rounded-2xl shadow-xl p-4 md:p-6 mb-6 card-hover">
            <h2 class="text-xl font-bold mb-4 flex items-center gradient-text">
              <i class="fas fa-camera mr-2"></i>
              Scan Your Fridge
            </h2>
            <div class="text-center">
              <div id="uploadArea" class="border-3 border-dashed border-purple-300 rounded-2xl p-8 md:p-12 cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all relative overflow-hidden group">
                <div class="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <i class="fas fa-cloud-upload-alt text-5xl md:text-6xl text-purple-400 mb-4 animate-bounce-slow"></i>
                <p class="text-gray-600 mb-2 text-sm md:text-base font-semibold">Click to upload or take a photo</p>
                <p class="text-gray-400 text-xs md:text-sm">Supports: JPG, PNG, HEIC</p>
                <input type="file" id="fridgeImageInput" accept="image/*" capture="environment" class="hidden">
              </div>
              <div class="flex flex-col sm:flex-row gap-3 mt-4">
                <button onclick="analyzeFridge()" id="scanBtn" disabled
                  class="flex-1 btn-shimmer bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base">
                  <i class="fas fa-search mr-2"></i>
                  Analyze Ingredients
                </button>
                <button onclick="openBarcodeScanner()" 
                  class="flex-1 btn-shimmer bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-2xl transition-all text-sm md:text-base">
                  <i class="fas fa-barcode mr-2"></i>
                  Scan Barcode
                </button>
              </div>
            </div>
            
            <div id="ingredientsResult" class="mt-6 hidden animate-fade-in">
              <h3 class="text-lg font-semibold mb-3 flex items-center">
                <i class="fas fa-check-circle mr-2 text-green-600 checkmark"></i>
                Detected Ingredients
              </h3>
              <div id="ingredientsList" class="flex flex-wrap gap-2"></div>
            </div>
          </section>

          <!-- Recipes Section -->
          <section id="recipesSection" class="md:block">
            <div id="noRecipes" class="glass rounded-2xl shadow-xl p-8 md:p-12 text-center">
              <i class="fas fa-utensils text-5xl md:text-6xl text-purple-300 mb-4 animate-float"></i>
              <h3 class="text-xl font-semibold text-gray-600 mb-2">No recipes yet</h3>
              <p class="text-gray-500 text-sm md:text-base">Scan your fridge to get personalized recipe suggestions</p>
            </div>
            
            <div id="recipesList" class="hidden grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6"></div>
          </section>
        </main>
      </div>
    </div>

    <!-- Profile Modal -->
    <div id="profileModal" class="hidden fixed inset-0 bg-black/50 modal-backdrop z-50 overflow-y-auto">
      <div class="min-h-screen px-4 py-8 flex items-center justify-center">
        <div class="glass rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-in-right">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold gradient-text">Profile</h2>
            <button onclick="closeProfile()" class="text-gray-500 hover:text-gray-700 text-2xl transition-colors">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="text-center mb-6">
            <div class="avatar-ring w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-user text-3xl text-white"></i>
            </div>
            <h3 class="text-xl font-bold">${user?.name || 'User'}</h3>
            <p class="text-gray-600 text-sm">${user?.email || ''}</p>
          </div>
          <div class="space-y-4">
            <div class="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
              <p class="text-sm text-gray-600 mb-2">Dietary Preferences</p>
              <p class="font-semibold">${user?.dietaryPreferences || 'None set'}</p>
            </div>
            <button onclick="handleLogout()" 
              class="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all btn-shimmer">
              <i class="fas fa-sign-out-alt mr-2"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Shopping List Modal -->
    <div id="shoppingListModal" class="hidden fixed inset-0 bg-black/50 modal-backdrop z-50 overflow-y-auto">
      <div class="min-h-screen px-4 py-8 flex items-center justify-center">
        <div class="glass rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-slide-in-right">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold gradient-text flex items-center">
              <i class="fas fa-shopping-cart mr-2"></i>
              Shopping List
            </h2>
            <button onclick="toggleShoppingList()" class="text-gray-500 hover:text-gray-700 text-2xl transition-colors">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div id="shoppingListEmpty" class="text-center py-12">
            <i class="fas fa-shopping-basket text-6xl text-gray-300 mb-4 animate-float"></i>
            <p class="text-gray-500">Your shopping list is empty</p>
          </div>
          
          <div id="shoppingListContent" class="hidden">
            <ul id="shoppingListItems" class="space-y-2 mb-4"></ul>
            <button onclick="clearShoppingList()" 
              class="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:shadow-xl font-medium transition-all btn-shimmer">
              <i class="fas fa-trash mr-2"></i> Clear All
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cooking Mode Modal -->
    <div id="cookingModal" class="hidden fixed inset-0 bg-black/50 modal-backdrop z-50 overflow-y-auto">
      <div class="min-h-screen px-4 py-8">
        <div class="glass rounded-2xl shadow-2xl max-w-3xl mx-auto animate-slide-in-right">
          <div class="p-4 md:p-6 border-b border-white/20 flex justify-between items-center sticky top-0 glass z-10">
            <h2 id="recipeTitle" class="text-xl md:text-2xl font-bold gradient-text">Recipe Name</h2>
            <button onclick="closeCookingMode()" class="text-gray-500 hover:text-gray-700 text-2xl transition-colors">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="p-4 md:p-6">
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
            
            <div id="missingIngredientsAlert" class="hidden mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-xl">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h4 class="font-semibold text-yellow-800 mb-2">Missing Ingredients:</h4>
                  <div id="missingIngredientsList" class="text-sm text-yellow-700"></div>
                </div>
                <button onclick="addMissingToShoppingList()" 
                  class="ml-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-xl hover:shadow-lg text-sm whitespace-nowrap btn-shimmer">
                  <i class="fas fa-plus mr-1"></i> Add to List
                </button>
              </div>
            </div>
            
            <div class="mb-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold gradient-text">Step-by-Step Instructions</h3>
                <button onclick="toggleReadAloud()" id="readAloudBtn"
                  class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:shadow-lg text-sm btn-shimmer">
                  <i class="fas fa-volume-up mr-2"></i>
                  <span id="readAloudText">Read Aloud</span>
                </button>
              </div>
              
              <div id="stepsList" class="space-y-4"></div>
            </div>
            
            <div class="flex gap-4">
              <button onclick="prevStep()" id="prevStepBtn"
                class="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:from-gray-300 hover:to-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-shimmer">
                <i class="fas fa-arrow-left mr-2"></i> Previous
              </button>
              <button onclick="nextStep()" id="nextStepBtn"
                class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-shimmer">
                Next <i class="fas fa-arrow-right ml-2"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
  
  attachEventListeners()
  updateShoppingListUI()
  
  // Load user stats and history
  loadUserStats()
  loadCookingHistory()
  
  // Pre-fill dietary filters from user preferences
  if (user && user.dietaryPreferences) {
    const prefs = user.dietaryPreferences.split(',').map(p => p.trim())
    prefs.forEach(pref => {
      const checkbox = document.querySelector(`.dietary-filter[value="${pref}"]`)
      if (checkbox) checkbox.checked = true
    })
  }
  
  // Update avatar display
  setTimeout(() => {
    const currentAvatar = avatars.find(a => a.id === userAvatar)
    if (currentAvatar) {
      const avatarDisplays = document.querySelectorAll('.current-avatar-display')
      avatarDisplays.forEach(display => {
        display.textContent = currentAvatar.emoji
      })
    }
  }, 100)
}

function attachEventListeners() {
  // Upload area
  document.getElementById('uploadArea')?.addEventListener('click', () => {
    document.getElementById('fridgeImageInput').click()
  })
  
  // File input
  document.getElementById('fridgeImageInput')?.addEventListener('change', handleImageUpload)
  
  // Dietary filters
  document.querySelectorAll('.dietary-filter').forEach(filter => {
    filter.addEventListener('change', () => {
      if (detectedIngredients.length > 0) {
        fetchRecipes()
      }
    })
  })
  
  // Mobile tabs
  document.querySelectorAll('.mobile-tab').forEach(tab => {
    tab.addEventListener('click', handleMobileTab)
  })
}

function handleMobileTab(e) {
  const tabName = e.currentTarget.dataset.tab
  
  document.querySelectorAll('.mobile-tab').forEach(t => t.classList.remove('active'))
  e.currentTarget.classList.add('active')
  
  const scanSection = document.getElementById('scanSection')
  const recipesSection = document.getElementById('recipesSection')
  const filterSection = document.getElementById('filterSection')
  
  if (window.innerWidth < 768) {
    scanSection.classList.add('hidden')
    recipesSection.classList.add('hidden')
    filterSection.classList.add('hidden')
    
    if (tabName === 'scan') scanSection.classList.remove('hidden')
    else if (tabName === 'recipes') recipesSection.classList.remove('hidden')
    else if (tabName === 'filters') filterSection.classList.remove('hidden')
  }
}

function handleImageUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (event) => {
    const uploadArea = document.getElementById('uploadArea')
    uploadArea.innerHTML = `
      <div class="relative">
        <img src="${event.target.result}" alt="Fridge" class="max-h-64 mx-auto rounded-xl shadow-lg mb-3 animate-fade-in">
        <div class="absolute inset-0 bg-gradient-to-t from-green-500/20 to-transparent rounded-xl"></div>
      </div>
      <p class="text-green-600 font-semibold animate-slide-in-right">
        <i class="fas fa-check-circle mr-1 checkmark"></i>
        Image loaded successfully
      </p>
      <p class="text-gray-500 text-sm mt-2">Click "Analyze Ingredients" to continue</p>
    `
    document.getElementById('scanBtn').disabled = false
    
    // Store image data
    window.currentImageData = event.target.result
  }
  reader.readAsDataURL(file)
}

async function analyzeFridge() {
  const btn = document.getElementById('scanBtn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Analyzing with AI...'
  
  try {
    const response = await axios.post('/api/analyze-fridge', {
      imageData: window.currentImageData || 'placeholder'
    })
    
    if (response.data.success) {
      detectedIngredients = response.data.ingredients
      displayIngredients(detectedIngredients)
      await fetchRecipes()
      
      showNotification(response.data.message, 'success')
      
      if (window.innerWidth < 768) {
        document.querySelector('.mobile-tab[data-tab="recipes"]').click()
      }
    }
  } catch (error) {
    console.error('Error analyzing fridge:', error)
    showNotification(error.response?.data?.error || 'Failed to analyze image', 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-search mr-2"></i> Analyze Ingredients'
  }
}

function displayIngredients(ingredients) {
  const resultDiv = document.getElementById('ingredientsResult')
  const listDiv = document.getElementById('ingredientsList')
  
  listDiv.innerHTML = ingredients.map(ing => `
    <span class="ingredient-chip inline-block bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
      <i class="fas fa-check mr-1"></i>${ing}
    </span>
  `).join('')
  
  resultDiv.classList.remove('hidden')
}

async function fetchRecipes() {
  const selectedFilters = Array.from(document.querySelectorAll('.dietary-filter:checked'))
    .map(cb => cb.value)
  
  try {
    const response = await axios.post('/api/get-recipes', {
      ingredients: detectedIngredients,
      dietaryRestrictions: selectedFilters
    })
    
    if (response.data.success) {
      currentRecipes = response.data.recipes
      renderRecipes(currentRecipes)
    }
  } catch (error) {
    console.error('Error fetching recipes:', error)
    showNotification('Failed to fetch recipes', 'error')
  }
}

function renderRecipes(recipes) {
  const noRecipes = document.getElementById('noRecipes')
  const recipesList = document.getElementById('recipesList')
  
  if (recipes.length === 0) {
    noRecipes.classList.remove('hidden')
    recipesList.classList.add('hidden')
    return
  }
  
  noRecipes.classList.add('hidden')
  recipesList.classList.remove('hidden')
  
  recipesList.innerHTML = recipes.map((recipe, index) => {
    const isSaved = savedRecipeIds.includes(recipe.id)
    return `
      <div class="recipe-card glass rounded-2xl shadow-xl overflow-hidden cursor-pointer" onclick="openCookingMode(${recipe.id})" style="animation-delay: ${index * 0.1}s">
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="text-5xl mb-3 animate-float">${recipe.image}</div>
              <h3 class="text-xl font-bold mb-2 gradient-text">${recipe.name}</h3>
            </div>
            <div class="flex flex-col gap-2">
              ${recipe.missingIngredients.length > 0 ? `
                <span class="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-3 py-1 rounded-full shadow-lg badge-animate">
                  ${recipe.missingIngredients.length} missing
                </span>
              ` : `
                <span class="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs px-3 py-1 rounded-full shadow-lg">
                  <i class="fas fa-check mr-1"></i>Complete
                </span>
              `}
              ${isSaved ? `
                <span class="bg-gradient-to-r from-purple-400 to-pink-400 text-white text-xs px-3 py-1 rounded-full shadow-lg">
                  <i class="fas fa-star mr-1"></i>Saved
                </span>
              ` : `
                <button onclick="event.stopPropagation(); saveRecipe(${recipe.id})" 
                  class="bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 text-xs px-3 py-1 rounded-full hover:from-purple-400 hover:to-pink-400 hover:text-white transition-all">
                  <i class="fas fa-star mr-1"></i>Save
                </button>
              `}
            </div>
          </div>
          
          <div class="flex flex-wrap gap-3 text-sm mb-4">
            <div class="flex items-center px-3 py-1 rounded-lg difficulty-${recipe.difficulty.toLowerCase()} text-white shadow-md">
              <i class="fas fa-signal mr-1"></i>
              <span>${recipe.difficulty}</span>
            </div>
            <div class="flex items-center text-gray-600 bg-white/50 px-3 py-1 rounded-lg">
              <i class="fas fa-clock mr-1"></i>
              <span>${recipe.prepTime}</span>
            </div>
            <div class="flex items-center text-gray-600 bg-white/50 px-3 py-1 rounded-lg">
              <i class="fas fa-fire mr-1"></i>
              <span>${recipe.calories} cal</span>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-2 mb-4">
            ${recipe.dietary.map(diet => `
              <span class="bg-gradient-to-r from-blue-100 to-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full">
                ${diet}
              </span>
            `).join('')}
          </div>
          
          <button onclick="event.stopPropagation(); openCookingMode(${recipe.id})"
            class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-2xl transition-all btn-shimmer">
            <i class="fas fa-play mr-2"></i>
            Start Cooking
          </button>
        </div>
      </div>
    `
  }).join('')
}

function openCookingMode(recipeId) {
  currentRecipe = currentRecipes.find(r => r.id === recipeId)
  if (!currentRecipe) return
  
  currentStep = 0
  
  document.getElementById('recipeTitle').textContent = currentRecipe.name
  document.getElementById('recipePrepTime').textContent = currentRecipe.prepTime
  document.getElementById('recipeCalories').textContent = `${currentRecipe.calories} calories`
  document.getElementById('recipeServings').textContent = `${currentRecipe.servings} servings`
  
  const missingAlert = document.getElementById('missingIngredientsAlert')
  const missingList = document.getElementById('missingIngredientsList')
  
  if (currentRecipe.missingIngredients.length > 0) {
    missingAlert.classList.remove('hidden')
    missingList.innerHTML = currentRecipe.missingIngredients.map(ing => `
      <span class="inline-block bg-yellow-200 text-yellow-900 px-3 py-1 rounded-full text-xs mr-2 mb-2 shadow">
        ${ing}
      </span>
    `).join('')
  } else {
    missingAlert.classList.add('hidden')
  }
  
  renderSteps()
  document.getElementById('cookingModal').classList.remove('hidden')
  document.body.style.overflow = 'hidden'
}

function renderSteps() {
  const stepsList = document.getElementById('stepsList')
  
  stepsList.innerHTML = currentRecipe.steps.map((step, index) => `
    <div class="step-card ${index === currentStep ? 'active' : ''} border-2 rounded-xl p-4 transition-all ${index === currentStep ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'}">
      <div class="flex items-start">
        <div class="flex-shrink-0 w-10 h-10 ${index === currentStep ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-400'} text-white rounded-full flex items-center justify-center font-bold mr-3 shadow-lg">
          ${index + 1}
        </div>
        <p class="${index === currentStep ? 'text-lg font-medium' : 'text-gray-600'}">${step}</p>
      </div>
    </div>
  `).join('')
  
  document.getElementById('prevStepBtn').disabled = currentStep === 0
  document.getElementById('nextStepBtn').disabled = currentStep === currentRecipe.steps.length - 1
  
  if (currentStep === currentRecipe.steps.length - 1) {
    document.getElementById('nextStepBtn').innerHTML = '<i class="fas fa-check mr-2"></i> Finish'
  } else {
    document.getElementById('nextStepBtn').innerHTML = 'Next <i class="fas fa-arrow-right ml-2"></i>'
  }
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--
    renderSteps()
    document.querySelector('.step-card.active')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function nextStep() {
  if (currentStep < currentRecipe.steps.length - 1) {
    currentStep++
    renderSteps()
    document.querySelector('.step-card.active')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  } else {
    if (confirm('Congratulations! Did you enjoy this recipe? 🎉')) {
      closeCookingMode()
      showNotification('Recipe completed! Bon appétit! 🍽️', 'success')
    }
  }
}

function toggleReadAloud() {
  if (isSpeaking) {
    speechSynthesis.cancel()
    isSpeaking = false
    document.getElementById('readAloudText').textContent = 'Read Aloud'
  } else {
    const text = currentRecipe.steps[currentStep]
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1
    
    utterance.onstart = () => {
      isSpeaking = true
      document.getElementById('readAloudText').textContent = 'Stop'
    }
    
    utterance.onend = () => {
      isSpeaking = false
      document.getElementById('readAloudText').textContent = 'Read Aloud'
    }
    
    speechSynthesis.speak(utterance)
  }
}

function closeCookingMode() {
  document.getElementById('cookingModal').classList.add('hidden')
  document.body.style.overflow = 'auto'
  
  if (isSpeaking) {
    speechSynthesis.cancel()
    isSpeaking = false
  }
}

function addMissingToShoppingList() {
  if (currentRecipe && currentRecipe.missingIngredients.length > 0) {
    currentRecipe.missingIngredients.forEach(item => {
      if (!shoppingList.includes(item)) {
        shoppingList.push(item)
      }
    })
    saveShoppingList()
    showNotification('Added to shopping list! 🛒', 'success')
  }
}

function toggleShoppingList() {
  const modal = document.getElementById('shoppingListModal')
  if (modal.classList.contains('hidden')) {
    modal.classList.remove('hidden')
    document.body.style.overflow = 'hidden'
  } else {
    modal.classList.add('hidden')
    document.body.style.overflow = 'auto'
  }
}

function updateShoppingListUI() {
  const cartCount = document.getElementById('cartCount')
  const listEmpty = document.getElementById('shoppingListEmpty')
  const listContent = document.getElementById('shoppingListContent')
  const listItems = document.getElementById('shoppingListItems')
  
  if (shoppingList.length > 0) {
    cartCount.textContent = shoppingList.length
    cartCount.classList.remove('hidden')
    listEmpty?.classList.add('hidden')
    listContent?.classList.remove('hidden')
    
    if (listItems) {
      listItems.innerHTML = shoppingList.map((item, index) => `
        <li class="flex items-center justify-between p-4 glass rounded-xl animate-slide-in-right" style="animation-delay: ${index * 0.05}s">
          <span class="flex-1 font-medium">${item}</span>
          <button onclick="removeFromShoppingList(${index})" 
            class="text-red-500 hover:text-red-700 hover:scale-125 transition-all">
            <i class="fas fa-trash"></i>
          </button>
        </li>
      `).join('')
    }
  } else {
    cartCount?.classList.add('hidden')
    listEmpty?.classList.remove('hidden')
    listContent?.classList.add('hidden')
  }
}

function removeFromShoppingList(index) {
  shoppingList.splice(index, 1)
  saveShoppingList()
}

function clearShoppingList() {
  if (confirm('Clear all items from shopping list?')) {
    shoppingList = []
    saveShoppingList()
  }
}

function loadShoppingList() {
  const stored = localStorage.getItem('shoppingList')
  if (stored) {
    shoppingList = JSON.parse(stored)
  }
}

function saveShoppingList() {
  localStorage.setItem('shoppingList', JSON.stringify(shoppingList))
  updateShoppingListUI()
}

function clearFilters() {
  document.querySelectorAll('.dietary-filter').forEach(filter => {
    filter.checked = false
  })
  
  if (detectedIngredients.length > 0) {
    fetchRecipes()
  }
}

function showProfile() {
  document.getElementById('profileModal').classList.remove('hidden')
  document.body.style.overflow = 'hidden'
}

function closeProfile() {
  document.getElementById('profileModal').classList.add('hidden')
  document.body.style.overflow = 'auto'
}

function showNotification(message, type = 'info') {
  const colors = {
    success: 'from-green-500 to-emerald-600',
    error: 'from-red-500 to-pink-600',
    info: 'from-blue-500 to-purple-600'
  }
  
  const notification = document.createElement('div')
  notification.className = `toast-notification fixed top-24 right-4 bg-gradient-to-r ${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-sm`
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-3 text-xl"></i>
      <span class="font-medium">${message}</span>
    </div>
  `
  document.body.appendChild(notification)
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.5s ease-out'
    setTimeout(() => notification.remove(), 500)
  }, 3000)
}

// Close modals on outside click
window.addEventListener('click', (e) => {
  const cookingModal = document.getElementById('cookingModal')
  const shoppingModal = document.getElementById('shoppingListModal')
  const profileModal = document.getElementById('profileModal')
  
  if (e.target === cookingModal) closeCookingMode()
  if (e.target === shoppingModal) toggleShoppingList()
  if (e.target === profileModal) closeProfile()
})

// Handle window resize for mobile tabs
window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) {
    document.getElementById('scanSection')?.classList.remove('hidden')
    document.getElementById('recipesSection')?.classList.remove('hidden')
    document.getElementById('filterSection')?.classList.remove('hidden')
  }
})
