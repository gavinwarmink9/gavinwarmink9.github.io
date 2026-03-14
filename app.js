const STORAGE_KEY = 'lethbridge_pets_data_v2';
const ADMIN_PASS = 'lethbridge2026';

/**
 * Initialize application based on current page
 */
function initApp(page) {
    if (page === 'index') {
        loadPets().then(data => renderPets(data));
    } else if (page === 'admin') {
        setupAdmin();
    }
}

/**
 * Setup Admin Page Logic
 */
function setupAdmin() {
    const loginSection = document.getElementById('admin-login');
    const adminContent = document.getElementById('admin-content');
    const passwordInput = document.getElementById('admin-password');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');

    loginBtn.addEventListener('click', () => {
        if (passwordInput.value === ADMIN_PASS) {
            loginSection.classList.add('hidden');
            adminContent.classList.remove('hidden');
            setupForm();
            refreshAdminPets();
        } else {
            loginError.classList.remove('hidden');
            passwordInput.value = '';
        }
    });

    // Handle Enter key for login
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loginBtn.click();
    });
}

/**
 * Refresh the management list in admin
 */
async function refreshAdminPets() {
    const data = await loadPets();
    renderAdminPets(data);
}

/**
 * Fetch or load pets from storage
 */
async function loadPets() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);

    try {
        const response = await fetch('pets.json');
        if (!response.ok) throw new Error('Could not fetch initial pets');
        const data = await response.json();
        saveToStorage(data);
        return data;
    } catch (error) {
        console.error("Error loading pets:", error);
        return [];
    }
}

/**
 * Save array of pets back to local storage
 */
function saveToStorage(petsArray) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(petsArray));
}

/**
 * Render pets to the index grid
 */
function renderPets(pets) {
    const grid = document.getElementById('pets-grid');
    if (!grid) return;
    if (pets.length === 0) {
        grid.innerHTML = '<div class="no-pets">No pets available right now. Check back later!</div>';
        return;
    }
    grid.innerHTML = '';
    
    pets.forEach(pet => grid.appendChild(createPetCard(pet, false)));
}

/**
 * Render pets to the admin management list
 */
function renderAdminPets(pets) {
    const grid = document.getElementById('admin-pets-list');
    if (!grid) return;
    grid.innerHTML = '';
    pets.forEach(pet => grid.appendChild(createPetCard(pet, true)));
}

/**
 * Create a pet card element
 */
function createPetCard(pet, isAdmin) {
    const petEl = document.createElement('div');
    petEl.className = 'pet-card';
    const speciesIcon = pet.species.toLowerCase() === 'cat' ? '🐈' : 
                        pet.species.toLowerCase() === 'dog' ? '🐕' : 
                        pet.species.toLowerCase() === 'bird' ? '🦜' : '🐾';
    const imgUrl = pet.image || 'https://via.placeholder.com/400x300?text=No+Photo+Available';

    petEl.innerHTML = `
        <div class="pet-image-wrapper">
            <span class="pet-badge">${pet.age}</span>
            <img src="${imgUrl}" alt="${pet.name}" class="pet-image" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=No+Photo+Available'">
        </div>
        <div class="pet-info">
            <div class="pet-header">
                <h3 class="pet-name">${pet.name}</h3>
                <span class="pet-species" title="${pet.species}">${speciesIcon}</span>
            </div>
            <div class="pet-meta">${pet.breed}</div>
            <p class="pet-desc">${pet.description}</p>
            ${isAdmin ? 
                `<button class="btn btn-delete" style="background-color: #ff5252; color: white; width: 100%;" onclick="removePet('${pet.id}')">Remove Pet</button>` : 
                `<button class="pet-action">Meet ${pet.name}</button>`
            }
        </div>
    `;
    return petEl;
}

/**
 * Remove a pet from the list
 */
async function removePet(id) {
    if (!confirm('Are you sure you want to remove this pet?')) return;
    
    const pets = await loadPets();
    const updated = pets.filter(p => p.id !== id);
    saveToStorage(updated);
    refreshAdminPets();
}

/**
 * Setup Admin Form Listeners
 */
function setupForm() {
    const form = document.getElementById('add-pet-form');
    const message = document.getElementById('form-message');
    if (!form) return;

    // Remove old listeners if any (though setupForm is called once after login)
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = newForm.querySelector('.btn-submit');
        submitBtn.disabled = true;
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Saving...</span>';

        const formData = new FormData(newForm);
        const newPet = {
            id: Date.now().toString(),
            name: formData.get('name'),
            species: formData.get('species'),
            age: formData.get('age'),
            breed: formData.get('breed'),
            image: formData.get('image'),
            description: formData.get('description')
        };

        try {
            const currentPets = await loadPets();
            currentPets.push(newPet);
            saveToStorage(currentPets);
            newForm.reset();
            message.className = 'form-message form-message-success';
            message.style.display = 'block';
            setTimeout(() => { message.style.display = 'none'; }, 3000);
            refreshAdminPets();
        } catch (error) {
            console.error("Failed to add pet:", error);
            message.textContent = '❌ An error occurred while saving.';
            message.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}
