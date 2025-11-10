// ==================== BARCODE SCANNER ====================

let barcodeScanner = null
let isScanningBarcode = false

async function initBarcodeScanner() {
  const { Html5QrcodeScanner } = await import('https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js')
  
  const scannerDiv = document.getElementById('barcodeScannerDiv')
  if (!scannerDiv) return
  
  barcodeScanner = new Html5QrcodeScanner(
    "barcodeScannerDiv",
    { 
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128
      ]
    },
    false
  )
  
  barcodeScanner.render(onScanSuccess, onScanFailure)
}

async function onScanSuccess(decodedText, decodedResult) {
  if (isScanningBarcode) return
  isScanningBarcode = true
  
  // Stop scanner
  if (barcodeScanner) {
    barcodeScanner.clear()
  }
  
  // Show loading
  showNotification('Scanning product...', 'info')
  
  try {
    const response = await axios.post('/api/barcode/scan', {
      barcode: decodedText
    })
    
    if (response.data.success) {
      displayProductInfo(response.data.product)
      showNotification('Product found! 🎉', 'success')
    } else {
      showNotification(response.data.message || 'Product not found', 'error')
    }
  } catch (error) {
    console.error('Barcode scan error:', error)
    showNotification('Failed to scan product', 'error')
  } finally {
    isScanningBarcode = false
    closeBarcodeScanner()
  }
}

function onScanFailure(error) {
  // Ignore scan failures (they happen constantly)
}

function displayProductInfo(product) {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 modal-backdrop z-50 flex items-center justify-center p-4'
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove()
  }
  
  modal.innerHTML = `
    <div class="glass rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-slide-in-right max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-start mb-4">
        <h2 class="text-2xl font-bold gradient-text">Product Info</h2>
        <button onclick="this.closest('.modal-backdrop').remove()" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times text-2xl"></i>
        </button>
      </div>
      
      ${product.image ? `
        <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover rounded-xl mb-4">
      ` : ''}
      
      <div class="space-y-4">
        <div>
          <h3 class="text-xl font-bold">${product.name}</h3>
          ${product.brand ? `<p class="text-gray-600">${product.brand}</p>` : ''}
        </div>
        
        ${product.ingredients ? `
          <div class="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
            <h4 class="font-semibold mb-2 flex items-center">
              <i class="fas fa-list mr-2 text-green-600"></i>
              Ingredients
            </h4>
            <p class="text-sm">${product.ingredients}</p>
          </div>
        ` : ''}
        
        ${product.nutritionalInfo && Object.keys(product.nutritionalInfo).length > 0 ? `
          <div class="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
            <h4 class="font-semibold mb-2 flex items-center">
              <i class="fas fa-chart-bar mr-2 text-blue-600"></i>
              Nutrition (per 100g)
            </h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
              ${product.nutritionalInfo.energy ? `<div>Energy: ${product.nutritionalInfo.energy} kcal</div>` : ''}
              ${product.nutritionalInfo.proteins ? `<div>Protein: ${product.nutritionalInfo.proteins}g</div>` : ''}
              ${product.nutritionalInfo.carbohydrates ? `<div>Carbs: ${product.nutritionalInfo.carbohydrates}g</div>` : ''}
              ${product.nutritionalInfo.fat ? `<div>Fat: ${product.nutritionalInfo.fat}g</div>` : ''}
            </div>
          </div>
        ` : ''}
        
        ${product.allergens && product.allergens.length > 0 ? `
          <div class="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl">
            <h4 class="font-semibold mb-2 flex items-center text-red-700">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              Allergens
            </h4>
            <div class="flex flex-wrap gap-2">
              ${product.allergens.map(allergen => `
                <span class="bg-red-200 text-red-800 px-3 py-1 rounded-full text-xs">${allergen}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <button onclick="addProductIngredientsToList('${product.name}')" 
          class="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all btn-shimmer">
          <i class="fas fa-plus mr-2"></i> Add Ingredients to Pantry
        </button>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
}

function addProductIngredientsToList(productName) {
  if (!detectedIngredients.includes(productName)) {
    detectedIngredients.push(productName)
    displayIngredients(detectedIngredients)
    fetchRecipes()
  }
  showNotification('Added to your ingredients!', 'success')
}

function openBarcodeScanner() {
  const modal = document.createElement('div')
  modal.id = 'barcodeScannerModal'
  modal.className = 'fixed inset-0 bg-black/90 z-50 flex flex-col'
  
  modal.innerHTML = `
    <div class="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold flex items-center">
          <i class="fas fa-barcode mr-2"></i>
          Scan Barcode
        </h2>
        <button onclick="closeBarcodeScanner()" class="text-white hover:text-gray-200">
          <i class="fas fa-times text-2xl"></i>
        </button>
      </div>
      <p class="text-sm text-white/80 mt-2">Point your camera at the barcode</p>
    </div>
    
    <div class="flex-1 flex items-center justify-center p-4">
      <div id="barcodeScannerDiv" class="w-full max-w-md"></div>
    </div>
    
    <div class="p-4 bg-white/10 backdrop-blur-lg">
      <p class="text-white text-center text-sm">
        <i class="fas fa-info-circle mr-1"></i>
        Supported: UPC, EAN, Code 128
      </p>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // Initialize scanner after modal is rendered
  setTimeout(() => initBarcodeScanner(), 100)
}

function closeBarcodeScanner() {
  if (barcodeScanner) {
    barcodeScanner.clear()
    barcodeScanner = null
  }
  
  const modal = document.getElementById('barcodeScannerModal')
  if (modal) {
    modal.remove()
  }
  
  isScanningBarcode = false
}

// ==================== COOKING AVATARS ====================

const avatars = [
  { id: 'chef1', emoji: '👨‍🍳', name: 'Master Chef', color: 'from-blue-500 to-purple-500' },
  { id: 'chef2', emoji: '👩‍🍳', name: 'Chef Marie', color: 'from-pink-500 to-red-500' },
  { id: 'chef3', emoji: '🧑‍🍳', name: 'Chef Alex', color: 'from-green-500 to-teal-500' },
  { id: 'chef4', emoji: '🍜', name: 'Ramen Master', color: 'from-orange-500 to-yellow-500' },
  { id: 'chef5', emoji: '🍕', name: 'Pizza Pro', color: 'from-red-500 to-orange-500' },
  { id: 'chef6', emoji: '🍰', name: 'Pastry Chef', color: 'from-purple-500 to-pink-500' },
  { id: 'chef7', emoji: '🥗', name: 'Health Guru', color: 'from-green-400 to-emerald-400' },
  { id: 'chef8', emoji: '🌮', name: 'Taco Master', color: 'from-yellow-500 to-orange-400' }
]

function showAvatarSelection() {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 modal-backdrop z-50 flex items-center justify-center p-4'
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove()
  }
  
  modal.innerHTML = `
    <div class="glass rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-slide-in-right">
      <div class="mb-6">
        <h2 class="text-2xl font-bold gradient-text mb-2">Choose Your Cooking Avatar</h2>
        <p class="text-gray-600">Pick a character to guide you through recipes</p>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        ${avatars.map(avatar => `
          <button onclick="selectAvatar('${avatar.id}')" 
            class="avatar-option p-6 bg-gradient-to-br ${avatar.color} rounded-2xl hover:scale-105 transition-transform shadow-lg ${userAvatar === avatar.id ? 'ring-4 ring-white' : ''}">
            <div class="text-6xl mb-2 animate-float">${avatar.emoji}</div>
            <p class="text-white font-semibold text-sm">${avatar.name}</p>
            ${userAvatar === avatar.id ? '<div class="mt-2"><i class="fas fa-check-circle text-white"></i></div>' : ''}
          </button>
        `).join('')}
      </div>
      
      <button onclick="this.closest('.modal-backdrop').remove()" 
        class="w-full py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl font-semibold hover:from-gray-300 hover:to-gray-400 transition-all">
        Close
      </button>
    </div>
  `
  
  document.body.appendChild(modal)
}

async function selectAvatar(avatarId) {
  userAvatar = avatarId
  
  try {
    await axios.post('/api/user/avatar', { avatar: avatarId })
    showNotification('Avatar updated! 🎭', 'success')
    
    // Update avatar display
    const currentAvatar = avatars.find(a => a.id === avatarId)
    if (currentAvatar) {
      const avatarDisplays = document.querySelectorAll('.current-avatar-display')
      avatarDisplays.forEach(display => {
        display.textContent = currentAvatar.emoji
      })
    }
    
    // Close modal
    document.querySelectorAll('.modal-backdrop').forEach(m => m.remove())
  } catch (error) {
    showNotification('Failed to update avatar', 'error')
  }
}

// ==================== COOKING HISTORY ====================

async function loadCookingHistory() {
  try {
    const response = await axios.get('/api/cooking/history')
    if (response.data.success) {
      cookingHistory = response.data.history
    }
  } catch (error) {
    console.error('Failed to load history:', error)
  }
}

async function loadUserStats() {
  try {
    const response = await axios.get('/api/user/stats')
    if (response.data.success) {
      userStats = response.data.stats
      userAvatar = userStats.avatar || 'chef1'
    }
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

function showCookingHistory() {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 modal-backdrop z-50 overflow-y-auto'
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove()
  }
  
  modal.innerHTML = `
    <div class="min-h-screen px-4 py-8 flex items-center justify-center">
      <div class="glass rounded-2xl shadow-2xl max-w-3xl w-full p-6 animate-slide-in-right">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-2xl font-bold gradient-text">Cooking History</h2>
            <p class="text-gray-600">Your culinary journey</p>
          </div>
          <button onclick="this.closest('.modal-backdrop').remove()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        
        ${userStats ? `
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl text-center">
              <div class="text-3xl font-bold gradient-text">${userStats.totalRecipesCooked}</div>
              <div class="text-sm text-gray-600 mt-1">Recipes Cooked</div>
            </div>
            <div class="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl text-center">
              <div class="text-3xl font-bold text-green-600">${userStats.currentStreak}</div>
              <div class="text-sm text-gray-600 mt-1">Current Streak</div>
            </div>
            <div class="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl text-center">
              <div class="text-3xl font-bold text-orange-600">${userStats.bestStreak}</div>
              <div class="text-sm text-gray-600 mt-1">Best Streak</div>
            </div>
          </div>
        ` : ''}
        
        <div class="space-y-3 max-h-96 overflow-y-auto">
          ${cookingHistory.length > 0 ? cookingHistory.map(item => `
            <div class="p-4 glass rounded-xl flex items-center gap-4 hover:shadow-lg transition-shadow">
              <div class="text-4xl">${item.recipe_image || '🍽️'}</div>
              <div class="flex-1">
                <h3 class="font-semibold">${item.recipe_name}</h3>
                <div class="flex gap-3 text-sm text-gray-600 mt-1">
                  <span><i class="fas fa-clock mr-1"></i>${item.cooking_time_minutes || 0} min</span>
                  ${item.rating ? `<span><i class="fas fa-star mr-1 text-yellow-500"></i>${item.rating}/5</span>` : ''}
                  <span><i class="fas fa-calendar mr-1"></i>${new Date(item.cooked_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          `).join('') : `
            <div class="text-center py-12">
              <i class="fas fa-history text-6xl text-gray-300 mb-4"></i>
              <p class="text-gray-500">No cooking history yet</p>
              <p class="text-sm text-gray-400 mt-2">Start cooking to build your history!</p>
            </div>
          `}
        </div>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
}

async function completeCookingSession(recipe, rating, notes) {
  const cookingTime = cookingStartTime ? Math.floor((Date.now() - cookingStartTime) / 60000) : 0
  
  try {
    const response = await axios.post('/api/cooking/complete', {
      recipeId: recipe.id,
      recipeName: recipe.name,
      recipeImage: recipe.image,
      cookingTimeMinutes: cookingTime,
      rating: rating || 0,
      notes: notes || ''
    })
    
    if (response.data.success) {
      // Show achievements if any
      if (response.data.achievements && response.data.achievements.length > 0) {
        showAchievements(response.data.achievements)
      }
      
      // Reload stats
      await loadUserStats()
      await loadCookingHistory()
      
      showNotification('Cooking session saved! 🎉', 'success')
    }
  } catch (error) {
    console.error('Failed to save cooking session:', error)
  }
}

function showAchievements(achievements) {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/70 modal-backdrop z-50 flex items-center justify-center p-4'
  
  modal.innerHTML = `
    <div class="glass rounded-2xl shadow-2xl max-w-md w-full p-8 animate-slide-in-right text-center">
      <div class="mb-6">
        <div class="text-6xl mb-4 animate-bounce">🏆</div>
        <h2 class="text-3xl font-bold gradient-text mb-2">Achievement Unlocked!</h2>
      </div>
      
      <div class="space-y-4 mb-6">
        ${achievements.map(achievement => `
          <div class="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
            <div class="text-4xl mb-2 animate-pulse">${achievement.icon}</div>
            <h3 class="font-bold text-lg">${achievement.name}</h3>
          </div>
        `).join('')}
      </div>
      
      <button onclick="this.closest('.modal-backdrop').remove()" 
        class="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all btn-shimmer">
        Awesome! 🎉
      </button>
    </div>
  `
  
  document.body.appendChild(modal)
}

// Export functions to global scope
window.initBarcodeScanner = initBarcodeScanner
window.openBarcodeScanner = openBarcodeScanner
window.closeBarcodeScanner = closeBarcodeScanner
window.showAvatarSelection = showAvatarSelection
window.selectAvatar = selectAvatar
window.showCookingHistory = showCookingHistory
window.completeCookingSession = completeCookingSession
window.addProductIngredientsToList = addProductIngredientsToList
