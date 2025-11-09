// Global state
let detectedIngredients = [];
let currentRecipes = [];
let currentRecipe = null;
let currentStep = 0;
let speechSynthesis = window.speechSynthesis;
let isSpeaking = false;
let shoppingList = [];

// Load shopping list from localStorage
function loadShoppingList() {
    const stored = localStorage.getItem('shoppingList');
    if (stored) {
        shoppingList = JSON.parse(stored);
        updateShoppingListUI();
    }
}

// Save shopping list to localStorage
function saveShoppingList() {
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
    updateShoppingListUI();
}

// Update shopping list UI
function updateShoppingListUI() {
    const cartCount = document.getElementById('cartCount');
    const listEmpty = document.getElementById('shoppingListEmpty');
    const listContent = document.getElementById('shoppingListContent');
    const listItems = document.getElementById('shoppingListItems');
    
    if (shoppingList.length > 0) {
        cartCount.textContent = shoppingList.length;
        cartCount.classList.remove('hidden');
        listEmpty.classList.add('hidden');
        listContent.classList.remove('hidden');
        
        listItems.innerHTML = shoppingList.map((item, index) => `
            <li class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span class="flex-1">${item}</span>
                <button onclick="removeFromShoppingList(${index})" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            </li>
        `).join('');
    } else {
        cartCount.classList.add('hidden');
        listEmpty.classList.remove('hidden');
        listContent.classList.add('hidden');
    }
}

// Add to shopping list
function addToShoppingList(ingredients) {
    const newItems = Array.isArray(ingredients) ? ingredients : [ingredients];
    newItems.forEach(item => {
        if (!shoppingList.includes(item)) {
            shoppingList.push(item);
        }
    });
    saveShoppingList();
    
    // Show notification
    showNotification('Added to shopping list!', 'success');
}

// Remove from shopping list
function removeFromShoppingList(index) {
    shoppingList.splice(index, 1);
    saveShoppingList();
}

// Clear shopping list
function clearShoppingList() {
    if (confirm('Clear all items from shopping list?')) {
        shoppingList = [];
        saveShoppingList();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Simple notification - could be enhanced with a toast library
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };
    
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Mobile tab navigation
document.querySelectorAll('.mobile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        // Update active tab
        document.querySelectorAll('.mobile-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show/hide sections
        const scanSection = document.getElementById('scanSection');
        const recipesSection = document.getElementById('recipesSection');
        const filterSection = document.getElementById('filterSection');
        
        if (window.innerWidth < 768) {
            scanSection.classList.add('hidden');
            recipesSection.classList.add('hidden');
            filterSection.classList.add('hidden');
            
            if (tabName === 'scan') {
                scanSection.classList.remove('hidden');
            } else if (tabName === 'recipes') {
                recipesSection.classList.remove('hidden');
            } else if (tabName === 'filters') {
                filterSection.classList.remove('hidden');
            }
        }
    });
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
        document.getElementById('scanSection').classList.remove('hidden');
        document.getElementById('recipesSection').classList.remove('hidden');
        document.getElementById('filterSection').classList.remove('hidden');
    } else {
        // Show only active tab content on mobile
        const activeTab = document.querySelector('.mobile-tab.active');
        if (activeTab) {
            activeTab.click();
        }
    }
});

// Initialize mobile view
if (window.innerWidth < 768) {
    document.getElementById('recipesSection').classList.add('hidden');
    document.getElementById('filterSection').classList.add('hidden');
}

// Upload area click handler
document.getElementById('uploadArea').addEventListener('click', () => {
    document.getElementById('fridgeImageInput').click();
});

// File input change handler
document.getElementById('fridgeImageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const uploadArea = document.getElementById('uploadArea');
            uploadArea.innerHTML = `
                <img src="${event.target.result}" alt="Fridge" class="max-h-64 mx-auto rounded-lg shadow-md mb-3">
                <p class="text-green-600 font-semibold">
                    <i class="fas fa-check-circle mr-1"></i>
                    Image loaded successfully
                </p>
                <p class="text-gray-500 text-sm mt-2">Click "Analyze Ingredients" to continue</p>
            `;
            document.getElementById('scanBtn').disabled = false;
        };
        reader.readAsDataURL(file);
    }
});

// Scan button handler
document.getElementById('scanBtn').addEventListener('click', async () => {
    const btn = document.getElementById('scanBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Analyzing...';
    
    try {
        const response = await axios.post('/api/analyze-fridge', {
            imageData: 'placeholder' // In production, send actual image data
        });
        
        if (response.data.success) {
            detectedIngredients = response.data.ingredients;
            displayIngredients(detectedIngredients);
            await fetchRecipes();
            
            // Switch to recipes tab on mobile
            if (window.innerWidth < 768) {
                document.querySelector('.mobile-tab[data-tab="recipes"]').click();
            }
        }
    } catch (error) {
        console.error('Error analyzing fridge:', error);
        showNotification('Failed to analyze image. Please try again.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-search mr-2"></i> Analyze Ingredients';
    }
});

// Display detected ingredients
function displayIngredients(ingredients) {
    const resultDiv = document.getElementById('ingredientsResult');
    const listDiv = document.getElementById('ingredientsList');
    
    listDiv.innerHTML = ingredients.map(ing => `
        <span class="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            <i class="fas fa-check mr-1"></i>${ing}
        </span>
    `).join('');
    
    resultDiv.classList.remove('hidden');
}

// Fetch recipes based on ingredients and filters
async function fetchRecipes() {
    const selectedFilters = Array.from(document.querySelectorAll('.dietary-filter:checked'))
        .map(cb => cb.value);
    
    try {
        const response = await axios.post('/api/get-recipes', {
            ingredients: detectedIngredients,
            dietaryRestrictions: selectedFilters
        });
        
        if (response.data.success) {
            currentRecipes = response.data.recipes;
            displayRecipes(currentRecipes);
        }
    } catch (error) {
        console.error('Error fetching recipes:', error);
        showNotification('Failed to fetch recipes. Please try again.', 'error');
    }
}

// Display recipes
function displayRecipes(recipes) {
    const noRecipes = document.getElementById('noRecipes');
    const recipesList = document.getElementById('recipesList');
    
    if (recipes.length === 0) {
        noRecipes.classList.remove('hidden');
        recipesList.classList.add('hidden');
        return;
    }
    
    noRecipes.classList.add('hidden');
    recipesList.classList.remove('hidden');
    
    recipesList.innerHTML = recipes.map(recipe => `
        <div class="recipe-card bg-white rounded-lg shadow-md overflow-hidden cursor-pointer" onclick="openCookingMode(${recipe.id})">
            <div class="p-6">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <div class="text-4xl mb-2">${recipe.image}</div>
                        <h3 class="text-xl font-bold mb-2">${recipe.name}</h3>
                    </div>
                    ${recipe.missingIngredients.length > 0 ? `
                        <span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                            ${recipe.missingIngredients.length} missing
                        </span>
                    ` : `
                        <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            <i class="fas fa-check mr-1"></i>All ingredients
                        </span>
                    `}
                </div>
                
                <div class="flex flex-wrap gap-3 text-sm mb-4">
                    <div class="flex items-center">
                        <i class="fas fa-signal mr-1 difficulty-${recipe.difficulty.toLowerCase()}"></i>
                        <span class="difficulty-${recipe.difficulty.toLowerCase()}">${recipe.difficulty}</span>
                    </div>
                    <div class="flex items-center text-gray-600">
                        <i class="fas fa-clock mr-1"></i>
                        <span>${recipe.prepTime}</span>
                    </div>
                    <div class="flex items-center text-gray-600">
                        <i class="fas fa-fire mr-1"></i>
                        <span>${recipe.calories} cal</span>
                    </div>
                </div>
                
                <div class="flex flex-wrap gap-1 mb-4">
                    ${recipe.dietary.map(diet => `
                        <span class="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                            ${diet}
                        </span>
                    `).join('')}
                </div>
                
                <button class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                    <i class="fas fa-play mr-2"></i>
                    Start Cooking
                </button>
            </div>
        </div>
    `).join('');
}

// Open cooking mode
function openCookingMode(recipeId) {
    currentRecipe = currentRecipes.find(r => r.id === recipeId);
    if (!currentRecipe) return;
    
    currentStep = 0;
    
    // Populate modal
    document.getElementById('recipeTitle').textContent = currentRecipe.name;
    document.getElementById('recipePrepTime').textContent = currentRecipe.prepTime;
    document.getElementById('recipeCalories').textContent = `${currentRecipe.calories} calories`;
    document.getElementById('recipeServings').textContent = `${currentRecipe.servings} servings`;
    
    // Show missing ingredients alert
    const missingAlert = document.getElementById('missingIngredientsAlert');
    const missingList = document.getElementById('missingIngredientsList');
    
    if (currentRecipe.missingIngredients.length > 0) {
        missingAlert.classList.remove('hidden');
        missingList.innerHTML = currentRecipe.missingIngredients.map(ing => `
            <span class="inline-block bg-yellow-200 text-yellow-900 px-2 py-1 rounded text-xs mr-2 mb-2">
                ${ing}
            </span>
        `).join('');
    } else {
        missingAlert.classList.add('hidden');
    }
    
    // Display steps
    displaySteps();
    
    // Show modal
    document.getElementById('cookingModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Display cooking steps
function displaySteps() {
    const stepsList = document.getElementById('stepsList');
    
    stepsList.innerHTML = currentRecipe.steps.map((step, index) => `
        <div class="step-card ${index === currentStep ? 'active' : ''} border-2 rounded-lg p-4 ${index === currentStep ? 'border-blue-500' : 'border-gray-200'}">
            <div class="flex items-start">
                <div class="flex-shrink-0 w-8 h-8 ${index === currentStep ? 'bg-blue-600' : 'bg-gray-400'} text-white rounded-full flex items-center justify-center font-bold mr-3">
                    ${index + 1}
                </div>
                <p class="${index === currentStep ? 'text-lg font-medium' : 'text-gray-600'}">${step}</p>
            </div>
        </div>
    `).join('');
    
    // Update navigation buttons
    document.getElementById('prevStepBtn').disabled = currentStep === 0;
    document.getElementById('nextStepBtn').disabled = currentStep === currentRecipe.steps.length - 1;
    
    if (currentStep === currentRecipe.steps.length - 1) {
        document.getElementById('nextStepBtn').innerHTML = '<i class="fas fa-check mr-2"></i> Finish';
    } else {
        document.getElementById('nextStepBtn').innerHTML = 'Next <i class="fas fa-arrow-right ml-2"></i>';
    }
}

// Previous step
document.getElementById('prevStepBtn').addEventListener('click', () => {
    if (currentStep > 0) {
        currentStep--;
        displaySteps();
        
        // Scroll to active step
        document.querySelector('.step-card.active').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});

// Next step
document.getElementById('nextStepBtn').addEventListener('click', () => {
    if (currentStep < currentRecipe.steps.length - 1) {
        currentStep++;
        displaySteps();
        
        // Scroll to active step
        document.querySelector('.step-card.active').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        // Finish cooking
        if (confirm('Congratulations! Did you enjoy this recipe?')) {
            document.getElementById('closeCookingMode').click();
            showNotification('Recipe completed! Bon appétit! 🍽️', 'success');
        }
    }
});

// Read aloud functionality
document.getElementById('readAloudBtn').addEventListener('click', () => {
    if (isSpeaking) {
        speechSynthesis.cancel();
        isSpeaking = false;
        document.getElementById('readAloudText').textContent = 'Read Aloud';
        return;
    }
    
    const currentStepText = currentRecipe.steps[currentStep];
    const utterance = new SpeechSynthesisUtterance(currentStepText);
    
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => {
        isSpeaking = true;
        document.getElementById('readAloudText').textContent = 'Stop';
    };
    
    utterance.onend = () => {
        isSpeaking = false;
        document.getElementById('readAloudText').textContent = 'Read Aloud';
    };
    
    speechSynthesis.speak(utterance);
});

// Add to shopping list from cooking mode
document.getElementById('addToShoppingList').addEventListener('click', () => {
    addToShoppingList(currentRecipe.missingIngredients);
});

// Close cooking mode
document.getElementById('closeCookingMode').addEventListener('click', () => {
    document.getElementById('cookingModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    
    // Stop speech if playing
    if (isSpeaking) {
        speechSynthesis.cancel();
        isSpeaking = false;
    }
});

// Shopping list modal handlers
document.getElementById('shoppingListBtn').addEventListener('click', () => {
    document.getElementById('shoppingListModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
});

document.getElementById('closeShoppingList').addEventListener('click', () => {
    document.getElementById('shoppingListModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
});

document.getElementById('clearShoppingList').addEventListener('click', clearShoppingList);

// Dietary filter change handlers
document.querySelectorAll('.dietary-filter').forEach(filter => {
    filter.addEventListener('change', () => {
        if (detectedIngredients.length > 0) {
            fetchRecipes();
        }
    });
});

// Clear filters
document.getElementById('clearFilters').addEventListener('click', () => {
    document.querySelectorAll('.dietary-filter').forEach(filter => {
        filter.checked = false;
    });
    
    if (detectedIngredients.length > 0) {
        fetchRecipes();
    }
});

// Initialize
loadShoppingList();

// Close modals on outside click
document.getElementById('cookingModal').addEventListener('click', (e) => {
    if (e.target.id === 'cookingModal') {
        document.getElementById('closeCookingMode').click();
    }
});

document.getElementById('shoppingListModal').addEventListener('click', (e) => {
    if (e.target.id === 'shoppingListModal') {
        document.getElementById('closeShoppingList').click();
    }
});
