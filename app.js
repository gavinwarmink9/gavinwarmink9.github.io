const STORAGE_KEY = 'lethbridge_pets_data_v10';
const ADMIN_PASS = 'lethbridge2026';
let petModalTimeout = null;
let adoptModalTimeout = null;
let currentPetsCache = []; // Global cache for robustness

/**
 * Initialize application based on current page
 */
function initApp(page) {
    if (page === 'index') {
        setupSidebarToggle();
        loadPets().then(data => {
            currentPetsCache = data;
            renderPets(data);
            setupFilters(data);
        }).catch(err => {
            console.error("Failed to load pets:", err);
            document.getElementById('pets-grid').innerHTML = '<div class="error">Sorry, we couldn\'t load the pets. Please try refreshing!</div>';
        });
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
    currentPetsCache = data;
    renderAdminPets(data);
}

const DEFAULT_PETS = [
  {
    "id": "1",
    "name": "Cinder",
    "species": "Dog",
    "breed": "Heeler mix",
    "age": "Adult",
    "size": "Medium",
    "energy": "High",
    "goodWithAnimals": "No",
    "goodWithChildren": "Yes",
    "description": "Cinder is a working dog who needs someone experienced with heelers. She is loyal to one or two people and requires firm, consistent training.",
    "image": "images/cinder.jpg"
  },
  {
    "id": "2",
    "name": "Ryder",
    "species": "Dog",
    "breed": "Large breed",
    "age": "Adult",
    "size": "Large",
    "energy": "Medium",
    "goodWithAnimals": "Yes",
    "goodWithChildren": "Yes",
    "description": "Ryder is a big, beautiful boy who drools and needs plenty of activity. He is looking for a home with teens or adults.",
    "image": "images/ryder.jpg"
  },
  {
    "id": "3",
    "name": "Finnley",
    "species": "Dog",
    "breed": "Unknown",
    "age": "Adult",
    "size": "Medium",
    "energy": "High",
    "goodWithAnimals": "Yes",
    "goodWithChildren": "Yes",
    "description": "Finnley is a sweet, active girl who loves daily jogs and is not a 'sit around' sort of dog.",
    "image": "images/finnley.jpg"
  },
  {
    "id": "4",
    "name": "Odin",
    "species": "Dog",
    "breed": "Lanky/Silly Puppy",
    "age": "Tween years",
    "size": "Large",
    "energy": "High",
    "goodWithAnimals": "Yes",
    "goodWithChildren": "Yes",
    "description": "Odin is a silly, lanky young dog who loves to run and wag his tail. He needs basic obedience training.",
    "image": "images/odin.jpg"
  },
  {
    "id": "5",
    "name": "Axel",
    "species": "Dog",
    "breed": "Bullheaded breed mix",
    "age": "Adult",
    "size": "Large",
    "energy": "Medium",
    "goodWithAnimals": "No",
    "goodWithChildren": "No",
    "description": "Axel is headstrong and takes life in stride. He has some training and is looking for a home experienced with bullheaded breeds.",
    "image": "images/axel.jpg"
  },
  {
    "id": "6",
    "name": "Tahoe",
    "species": "Cat",
    "breed": "Unknown",
    "age": "Adult",
    "size": "Small",
    "energy": "Medium",
    "goodWithAnimals": "No",
    "goodWithChildren": "Yes",
    "description": "Tahoe is a talkative and bossy boy who lands his jumps like an elephant and sweet-talks for attention.",
    "image": "images/tahoe.jpg"
  },
  {
    "id": "7",
    "name": "Jingles",
    "species": "Cat",
    "breed": "Unknown",
    "age": "Adult",
    "size": "Small",
    "energy": "Low",
    "goodWithAnimals": "No",
    "goodWithChildren": "No",
    "description": "Jingles is a quiet cat who likes to find her own spot with a good toy. She prefers a house without other cats.",
    "image": "images/jingles.jpg"
  },
  {
    "id": "8",
    "name": "Tabitha",
    "species": "Cat",
    "breed": "Unknown",
    "age": "Senior",
    "size": "Small",
    "energy": "Low",
    "goodWithAnimals": "Yes",
    "goodWithChildren": "Yes",
    "description": "Tabitha is a shy girl who loves ribbons and a quiet home. She is described as the reincarnation of a sweet great grandmother.",
    "image": "images/tabitha.jpg"
  },
  {
    "id": "9",
    "name": "Sonny",
    "species": "Cat",
    "breed": "Unknown",
    "age": "Adult",
    "size": "Small",
    "energy": "Medium",
    "goodWithAnimals": "No",
    "goodWithChildren": "No",
    "description": "Sonny is a character who wants to be the center of your world. He is affectionate and prefers to be an only pet.",
    "image": "images/sonny.jpg"
  },
  {
    "id": "10",
    "name": "Quinn",
    "species": "Cat",
    "breed": "Unknown",
    "age": "Adult",
    "size": "Small",
    "energy": "High",
    "goodWithAnimals": "Yes",
    "goodWithChildren": "Yes",
    "description": "Quinn is a beautiful girl with unique markings. She is active, loves toy-rescuing, and has a playful 'fly-by' sense of humor.",
    "image": "images/quinn.jpg"
  }
];

/**
 * Setup Filtering System
 */
function setupFilters(allPets) {
    const filters = ['filter-age', 'filter-breed', 'filter-size', 'filter-energy', 'filter-animals', 'filter-children'];
    const clearBtn = document.getElementById('clear-filters');
    
    filters.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const eventType = el.tagName === 'INPUT' ? 'input' : 'change';
            el.addEventListener(eventType, () => {
                applyFilters(allPets);
                if (clearBtn) clearBtn.classList.remove('hidden');
            });
        }
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            filters.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    if (el.tagName === 'INPUT') el.value = '';
                    else el.value = 'all';
                }
            });
            clearBtn.classList.add('hidden');
            renderPets(allPets);
        });
    }

}

/**
 * Sidebar Toggle Logic - Separated to ensure it runs even if pet loading is slow
 */
function setupSidebarToggle() {
    const toggleBtn = document.getElementById('toggle-sidebar');
    const layout = document.querySelector('.sidebar-layout');
    
    if (!toggleBtn || !layout) return;

    // Use a clean listener and remove any older ones if they exist (though rare in this setup)
    toggleBtn.onclick = null; 
    
    toggleBtn.addEventListener('click', () => {
        layout.classList.toggle('sidebar-collapsed');
        const isCollapsed = layout.classList.contains('sidebar-collapsed');
        
        console.log("Sidebar toggled. Collapsed:", isCollapsed);
        
        const btnText = toggleBtn.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = isCollapsed ? 'Show Filters' : 'Hide Filters';
        }
        
        window.dispatchEvent(new Event('resize'));
    });
}

/**
 * Apply Filters to the pet list
 */
function applyFilters(allPets) {
    const ageEl = document.getElementById('filter-age');
    const breedEl = document.getElementById('filter-breed');
    const sizeEl = document.getElementById('filter-size');
    const energyEl = document.getElementById('filter-energy');
    const animalsEl = document.getElementById('filter-animals');
    const childrenEl = document.getElementById('filter-children');

    if (!ageEl || !breedEl || !sizeEl || !energyEl || !animalsEl || !childrenEl) return;

    const age = ageEl.value.toLowerCase();
    const breed = breedEl.value.toLowerCase();
    const size = sizeEl.value.toLowerCase();
    const energy = energyEl.value.toLowerCase();
    const animals = animalsEl.value.toLowerCase();
    const children = childrenEl.value.toLowerCase();

    const filtered = allPets.filter(pet => {
        const matchAge = age === 'all' || (pet.age && pet.age.toLowerCase().includes(age));
        const matchBreed = breed === '' || (pet.breed && pet.breed.toLowerCase().includes(breed)) || (pet.species && pet.species.toLowerCase().includes(breed));
        const matchSize = size === 'all' || (pet.size && pet.size.toLowerCase() === size);
        const matchEnergy = energy === 'all' || (pet.energy && pet.energy.toLowerCase() === energy);
        const matchAnimals = animals === 'all' || (pet.goodWithAnimals && pet.goodWithAnimals.toLowerCase() === animals);
        const matchChildren = children === 'all' || (pet.goodWithChildren && pet.goodWithChildren.toLowerCase() === children);

        return matchAge && matchBreed && matchSize && matchEnergy && matchAnimals && matchChildren;
    });

    renderPets(filtered);
}

/**
 * Fetch or load pets from storage
 */
async function loadPets() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        const data = JSON.parse(stored);
        currentPetsCache = data;
        return data;
    }

    // If no storage is found, fallback to the DEFAULT_PETS array, avoiding the need for network fetch!
    saveToStorage(DEFAULT_PETS);
    currentPetsCache = DEFAULT_PETS;
    return DEFAULT_PETS;
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
    const imgUrl = pet.image || 'images/placeholder.jpg'; // Changed placeholder to local

    petEl.innerHTML = `
        <div class="pet-image-wrapper">
            <span class="pet-badge">${pet.age}</span>
            <img src="${imgUrl}" alt="${pet.name}" class="pet-image" loading="lazy" onerror="this.src='images/placeholder.jpg'">
        </div>
        <div class="pet-info">
            <div class="pet-header">
                <h3 class="pet-name">${pet.name}</h3>
                <span class="pet-species" title="${pet.species}">${speciesIcon}</span>
            </div>
            <div class="pet-meta">${pet.breed}</div>
            ${isAdmin ? 
                `<p class="pet-desc admin-only-desc">${pet.description}</p>
                 <button class="btn btn-delete" style="background-color: #ff5252; color: white; width: 100%;" onclick="removePet('${pet.id}')">Remove Pet</button>` : 
                `<button class="pet-action" onclick="openPetModal('${pet.id}')">Meet ${pet.name}</button>`
            }
        </div>
    `;
    return petEl;
}

/**
 * Show Pet Modal
 */
async function openPetModal(id) {
    // 1. Clear any pending close transitions
    if (petModalTimeout) {
        clearTimeout(petModalTimeout);
        petModalTimeout = null;
    }

    // 2. Find pet data (using cache for instant access)
    let pet = currentPetsCache.find(p => String(p.id) === String(id));
    if (!pet) {
        console.error("Pet not found in cache. Attempting reload...");
        const freshPets = await loadPets();
        pet = freshPets.find(p => String(p.id) === String(id));
        if (!pet) {
            console.error("Pet still not found after reload:", id);
            return;
        }
    }

    const modal = document.getElementById('pet-modal');
    if (!modal) return;

    // 3. Robustly fill modal data
    try {
        const nameEl = document.getElementById('modal-pet-name');
        const imgEl = document.getElementById('modal-pet-image');
        const breedEl = document.getElementById('modal-pet-breed');
        const ageEl = document.getElementById('modal-pet-age');
        const sizeEl = document.getElementById('modal-pet-size');
        const descEl = document.getElementById('modal-pet-desc');

        if (nameEl) nameEl.textContent = pet.name;
        if (imgEl) {
            imgEl.src = pet.image || 'images/placeholder.jpg';
            imgEl.alt = pet.name;
        }
        if (breedEl) breedEl.textContent = pet.breed;
        if (ageEl) ageEl.textContent = pet.age;
        if (sizeEl) sizeEl.textContent = `${pet.size} Size`;
        if (descEl) descEl.textContent = pet.description;
        
        // Stats section logic
        let statsSection = document.getElementById('modal-stats');
        if (!statsSection) {
            statsSection = document.createElement('div');
            statsSection.id = 'modal-stats';
            statsSection.className = 'modal-stats';
            const descContainer = document.querySelector('.modal-desc');
            if (descContainer && descContainer.parentNode) {
                // Compatible alternative to .before()
                descContainer.parentNode.insertBefore(statsSection, descContainer);
            }
        }
        if (statsSection) {
            statsSection.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Energy</span>
                    <span class="stat-value">${pet.energy}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Other Pets</span>
                    <span class="stat-value">${pet.goodWithAnimals === 'Yes' ? '✅ Friendly' : '🚫 No'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Children</span>
                    <span class="stat-value">${pet.goodWithChildren === 'Yes' ? '✅ Friendly' : '🚫 No'}</span>
                </div>
            `;
        }
    } catch (e) {
        console.error("Critical error building pet modal:", e);
    }

    // 4. Force modal visibility
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Lock scroll
    
    // Tiny delay to ensure browser paints display:flex before adding class for opacity transition
    requestAnimationFrame(() => {
        modal.classList.add('modal-visible');
    });
    
    // Close on overlay click
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
}

/**
 * Close Pet Modal
 */
function closeModal() {
    const modal = document.getElementById('pet-modal');
    if (!modal) return;

    if (petModalTimeout) clearTimeout(petModalTimeout);
    
    modal.classList.remove('modal-visible');
    document.body.style.overflow = ''; // Restore scroll
    
    petModalTimeout = setTimeout(() => {
        modal.style.display = 'none';
        petModalTimeout = null;
    }, 450); // Slightly longer than CSS transition
}

/**
 * Show Adoption Contact Modal
 */
function openAdoptionModal() {
    if (adoptModalTimeout) {
        clearTimeout(adoptModalTimeout);
        adoptModalTimeout = null;
    }

    const modal = document.getElementById('adoption-modal');
    if (!modal) return;

    // Personalize title
    try {
        const petName = document.getElementById('modal-pet-name').textContent || 'this friend';
        const title = document.getElementById('adoption-modal-title');
        if (title) {
            title.innerHTML = `Adopt <span class="accent-text">${petName.trim()}</span>`;
        }
    } catch (e) {
        console.error("Error personalizing adoption modal title:", e);
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Ensure still locked
    
    requestAnimationFrame(() => {
        modal.classList.add('modal-visible');
    });

    // Close on overlay click
    modal.onclick = (e) => {
        if (e.target === modal) closeAdoptionModal();
    };
}

/**
 * Close Adoption Contact Modal
 */
function closeAdoptionModal() {
    const modal = document.getElementById('adoption-modal');
    if (!modal) return;

    if (adoptModalTimeout) clearTimeout(adoptModalTimeout);
    
    modal.classList.remove('modal-visible');
    // Note: We don't restore overflow here if pet-modal is still open, 
    // but the system will restore it if both close or user refreshes.
    
    adoptModalTimeout = setTimeout(() => {
        modal.style.display = 'none';
        adoptModalTimeout = null;
    }, 450);
}

/**
 * Remove a pet from the list
 */
async function removePet(id) {
    if (!confirm('Are you sure you want to remove this pet?')) return;
    
    const pets = await loadPets();
    const updated = pets.filter(p => String(p.id) !== String(id));
    saveToStorage(updated);
    currentPetsCache = updated;
    refreshAdminPets();
}

/**
 * Setup Admin Form Listeners
 */
function setupForm() {
    const form = document.getElementById('add-pet-form');
    const message = document.getElementById('form-message');
    if (!form) return;

    // Remove old listeners
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = newForm.querySelector('.btn-submit');
        if(submitBtn) {
            submitBtn.disabled = true;
            var originalText = submitBtn.innerHTML; // Use var for function scope
            submitBtn.innerHTML = '<span>Saving...</span>';
        } else {
            var originalText = 'Add Pet'; // Fallback if button not found
        }


        const formData = new FormData(newForm);
        const newPet = {
            id: Date.now().toString(),
            name: formData.get('name'),
            species: formData.get('species'),
            age: formData.get('age'),
            breed: formData.get('breed'),
            size: formData.get('size'),
            energy: formData.get('energy'),
            goodWithAnimals: formData.get('goodWithAnimals'),
            goodWithChildren: formData.get('goodWithChildren'),
            image: formData.get('image'),
            description: formData.get('description')
        };

        try {
            const currentPets = await loadPets();
            currentPets.push(newPet);
            saveToStorage(currentPets);
            currentPetsCache = currentPets;
            newForm.reset();
            if(message) {
                message.className = 'form-message form-message-success';
                message.style.display = 'block';
                setTimeout(() => { if(message) message.style.display = 'none'; }, 3000);
            }
            refreshAdminPets();
        } catch (error) {
            console.error("Failed to add pet:", error);
            if(message) {
                message.textContent = '❌ An error occurred while saving.';
                message.style.display = 'block';
            }
        } finally {
            if(submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    });
}

// Explicitly bind to window for global access regardless of context
window.initApp = initApp;
window.openPetModal = openPetModal;
window.closeModal = closeModal;
window.openAdoptionModal = openAdoptionModal;
window.closeAdoptionModal = closeAdoptionModal;
window.removePet = removePet;
