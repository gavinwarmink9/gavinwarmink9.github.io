const STORAGE_KEY = 'lethbridge_pets_data_v10';
const ADMIN_PASS = 'lethbridge2026';

// Data (Moved to top for initialization safety)
const DEFAULT_PETS = [{"id":"1","name":"Cinder","species":"Dog","breed":"Heeler mix","age":"Adult","size":"Medium","energy":"High","goodWithAnimals":"No","goodWithChildren":"Yes","description":"Cinder is a working dog who needs someone experienced with heelers.","image":"images/cinder.jpg"},{"id":"2","name":"Ryder","species":"Dog","breed":"Large breed","age":"Adult","size":"Large","energy":"Medium","goodWithAnimals":"Yes","goodWithChildren":"Yes","description":"Ryder is a big, beautiful boy who drools.","image":"images/ryder.jpg"},{"id":"3","name":"Finnley","species":"Dog","breed":"Unknown","age":"Adult","size":"Medium","energy":"High","goodWithAnimals":"Yes","goodWithChildren":"Yes","description":"Finnley is a sweet, active girl.","image":"images/finnley.jpg"},{"id":"4","name":"Odin","species":"Dog","breed":"Lanky/Silly Puppy","age":"Tween years","size":"Large","energy":"High","goodWithAnimals":"Yes","goodWithChildren":"Yes","description":"Odin is a silly, lanky young dog.","image":"images/odin.jpg"},{"id":"5","name":"Axel","species":"Dog","breed":"Bullheaded breed mix","age":"Adult","size":"Large","energy":"Medium","goodWithAnimals":"No","goodWithChildren":"No","description":"Axel is headstrong.","image":"images/axel.jpg"},{"id":"6","name":"Tahoe","species":"Cat","breed":"Unknown","age":"Adult","size":"Small","energy":"Medium","goodWithAnimals":"No","goodWithChildren":"Yes","description":"Tahoe is a talkative boy.","image":"images/tahoe.jpg"},{"id":"7","name":"Jingles","species":"Cat","breed":"Unknown","age":"Adult","size":"Small","energy":"Low","goodWithAnimals":"No","goodWithChildren":"No","description":"Jingles is a quiet cat.","image":"images/jingles.jpg"},{"id":"8","name":"Tabitha","species":"Cat","breed":"Unknown","age":"Senior","size":"Small","energy":"Low","goodWithAnimals":"Yes","goodWithChildren":"Yes","description":"Tabitha is a shy girl.","image":"images/tabitha.jpg"},{"id":"9","name":"Sonny","species":"Cat","breed":"Unknown","age":"Adult","size":"Small","energy":"Medium","goodWithAnimals":"No","goodWithChildren":"No","description":"Sonny is a character.","image":"images/sonny.jpg"},{"id":"10","name":"Quinn","species":"Cat","breed":"Unknown","age":"Adult","size":"Small","energy":"High","goodWithAnimals":"Yes","goodWithChildren":"Yes","description":"Quinn is a beautiful girl.","image":"images/quinn.jpg"}];

// State Management
let petModalTimeout = null;
let adoptModalTimeout = null;
let currentPetsCache = [];

// Fallback image (Gray square 1x1 base64)
const PLACEHOLDER_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/**
 * Global Error Handler
 */
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error(`[Global Error] ${msg} at ${lineNo}:${columnNo}`, error);
    return false;
};

/**
 * Initialize application
 */
async function initApp(page) {
    console.log("[App] Initializing for page:", page);
    setupGlobalListeners();
    
    if (page === 'index') {
        try {
            const data = await loadPets();
            console.log("[App] Loaded", data.length, "pets.");
            currentPetsCache = data;
            window.currentPetsCache = data;
            renderPets(data);
            setupFilters(data);
        } catch (err) {
            console.error("[App] Initialization failed:", err);
            const grid = document.getElementById('pets-grid');
            if (grid) grid.innerHTML = '<div class="error">Failed to load pets. Please refresh.</div>';
        }
    } else if (page === 'admin') {
        setupAdmin();
    }
}

/**
 * Setup Event Delegation
 */
function setupGlobalListeners() {
    console.log("[App] Setting up global listeners...");
    
    // Unified Click Handler
    document.addEventListener('click', (e) => {
        const target = e.target;
        
        // Meet Pet
        if (target.classList.contains('pet-action')) {
            const petId = target.getAttribute('data-id');
            if (petId) openPetModal(petId);
        }
        
        // Modal Close
        const closeBtn = target.closest('.modal-close') || target.classList.contains('btn-close-modal');
        if (closeBtn) {
            const modal = target.closest('.modal-overlay');
            if (modal) {
                if (modal.id === 'pet-modal') closeModal();
                else if (modal.id === 'adoption-modal') closeAdoptionModal();
            }
        }

        // Adopt
        if (target.classList.contains('adopt-now-btn')) openAdoptionModal();

        // Overlay Close
        if (target.classList.contains('modal-overlay')) {
            if (target.id === 'pet-modal') closeModal();
            else if (target.id === 'adoption-modal') closeAdoptionModal();
        }

        // Sidebar
        if (target.closest('#toggle-sidebar')) toggleSidebar();

        // Clear Filters
        if (target.id === 'clear-filters') handleClearFilters();
        
        // Admin Delete
        if (target.classList.contains('btn-delete')) {
            const petId = target.getAttribute('data-id');
            if (petId) removePet(petId);
        }
    });

    // Unified Input/Change Handler for Filters
    const handleFilterEvent = (e) => {
        if (e.target.id && e.target.id.startsWith('filter-')) {
            console.log("[App] Filter interaction:", e.target.id, "=", e.target.value);
            applyFilters(currentPetsCache);
        }
    };
    
    document.addEventListener('change', handleFilterEvent);
    document.addEventListener('input', handleFilterEvent);
}

/**
 * Loading & Storage
 */
async function loadPets() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            currentPetsCache = data;
            return data;
        }
    } catch (e) {
        console.warn("[App] LocalStorage read failed, using defaults.");
    }
    currentPetsCache = DEFAULT_PETS;
    saveToStorage(DEFAULT_PETS);
    return DEFAULT_PETS;
}

function saveToStorage(petsArray) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(petsArray));
    } catch (e) {
        console.error("[App] Storage save failed:", e);
    }
}

/**
 * Rendering
 */
function renderPets(pets) {
    const grid = document.getElementById('pets-grid');
    if (!grid) return;
    
    if (pets.length === 0) {
        grid.innerHTML = '<div class="no-pets">No pets matching these filters. Try resetting!</div>';
        return;
    }
    
    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();
    pets.forEach(pet => {
        const card = createPetCard(pet, false);
        fragment.appendChild(card);
    });
    grid.appendChild(fragment);
}

function createPetCard(pet, isAdmin) {
    const petEl = document.createElement('div');
    petEl.className = 'pet-card';
    
    const species = (pet.species || 'Other').toLowerCase();
    const speciesIcon = species === 'cat' ? '🐈' : species === 'dog' ? '🐕' : '🐾';
    const imgUrl = pet.image || PLACEHOLDER_IMG;

    petEl.innerHTML = `
        <div class="pet-image-wrapper">
            <span class="pet-badge">${pet.age || 'Adult'}</span>
            <img src="${imgUrl}" alt="${pet.name}" class="pet-image" loading="lazy" onerror="this.src='${PLACEHOLDER_IMG}'">
        </div>
        <div class="pet-info">
            <div class="pet-header">
                <h3 class="pet-name">${pet.name}</h3>
                <span class="pet-species">${speciesIcon}</span>
            </div>
            <div class="pet-meta">${pet.breed || 'Unknown Breed'}</div>
            ${isAdmin ? 
                `<p class="pet-desc admin-only-desc">${pet.description}</p>
                 <button class="btn btn-delete" data-id="${pet.id}">Remove Pet</button>` : 
                `<button class="pet-action" data-id="${pet.id}">Meet ${pet.name}</button>`
            }
        </div>
    `;
    return petEl;
}

/**
 * Modals
 */
async function openPetModal(id) {
    if (petModalTimeout) clearTimeout(petModalTimeout);
    
    const pet = currentPetsCache.find(p => String(p.id) === String(id));
    if (!pet) return;

    const modal = document.getElementById('pet-modal');
    if (!modal) return;

    updateModalContent(pet);

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    requestAnimationFrame(() => {
        modal.classList.add('modal-visible');
    });
}

function updateModalContent(pet) {
    try {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('modal-pet-name', pet.name);
        set('modal-pet-breed', pet.breed || 'Unknown');
        set('modal-pet-age', pet.age || 'Adult');
        set('modal-pet-size', `${pet.size || 'Medium'} Size`);
        set('modal-pet-desc', pet.description || '');
        
        const img = document.getElementById('modal-pet-image');
        if (img) {
            img.src = pet.image || PLACEHOLDER_IMG;
            img.onerror = () => { img.src = PLACEHOLDER_IMG; };
        }
        updateStats(pet);
    } catch (e) {
        console.error("[App] Content update error:", e);
    }
}

function updateStats(pet) {
    let stats = document.getElementById('modal-stats');
    if (!stats) {
        stats = document.createElement('div');
        stats.id = 'modal-stats';
        stats.className = 'modal-stats';
        const desc = document.querySelector('.modal-desc');
        if (desc && desc.parentNode) desc.parentNode.insertBefore(stats, desc);
    }
    if (stats) {
        stats.innerHTML = `
            <div class="stat-item"><span class="stat-label">Energy</span><span class="stat-value">${pet.energy || 'Medium'}</span></div>
            <div class="stat-item"><span class="stat-label">Other Pets</span><span class="stat-value">${pet.goodWithAnimals === 'Yes' ? '✅ Friendly' : '🚫 No'}</span></div>
            <div class="stat-item"><span class="stat-label">Children</span><span class="stat-value">${pet.goodWithChildren === 'Yes' ? '✅ Friendly' : '🚫 No'}</span></div>
        `;
    }
}

function closeModal() {
    const modal = document.getElementById('pet-modal');
    if (!modal) return;
    modal.classList.remove('modal-visible');
    const adopt = document.getElementById('adoption-modal');
    if (!adopt || !adopt.classList.contains('modal-visible')) document.body.style.overflow = '';
    petModalTimeout = setTimeout(() => { modal.style.display = 'none'; }, 450);
}

function openAdoptionModal() {
    const modal = document.getElementById('adoption-modal');
    if (!modal) return;
    const name = document.getElementById('modal-pet-name')?.textContent || 'this friend';
    const title = document.getElementById('adoption-modal-title');
    if (title) title.innerHTML = `Adopt <span class="accent-text">${name}</span>`;
    modal.style.display = 'flex';
    requestAnimationFrame(() => { modal.classList.add('modal-visible'); });
}

function closeAdoptionModal() {
    const modal = document.getElementById('adoption-modal');
    if (!modal) return;
    modal.classList.remove('modal-visible');
    const petMod = document.getElementById('pet-modal');
    if (!petMod || !petMod.classList.contains('modal-visible')) document.body.style.overflow = '';
    adoptModalTimeout = setTimeout(() => { modal.style.display = 'none'; }, 450);
}

/**
 * Filter Logic
 */
function applyFilters(allPets) {
    try {
        const getVal = (id) => {
            const el = document.getElementById(id);
            if (!el) return 'all';
            return el.value.toLowerCase().trim();
        };
        
        const criteria = {
            species: getVal('filter-species'),
            age: getVal('filter-age'),
            breed: document.getElementById('filter-breed')?.value?.toLowerCase()?.trim() || '',
            size: getVal('filter-size'),
            energy: getVal('filter-energy'),
            animals: getVal('filter-animals'),
            children: getVal('filter-children')
        };

        const filtered = allPets.filter(pet => {
            const data = {
                species: (pet.species || "").toLowerCase().trim(),
                age: (pet.age || "").toLowerCase().trim(),
                breed: (pet.breed || "").toLowerCase().trim(),
                size: (pet.size || "").toLowerCase().trim(),
                energy: (pet.energy || "").toLowerCase().trim(),
                animals: (pet.goodWithAnimals || "").toLowerCase().trim(),
                children: (pet.goodWithChildren || "").toLowerCase().trim()
            };

            const matches = {
                species: criteria.species === 'all' || data.species === criteria.species,
                age: criteria.age === 'all' || data.age.includes(criteria.age) || criteria.age.includes(data.age),
                breed: criteria.breed === '' || data.breed.includes(criteria.breed) || data.species.includes(criteria.breed),
                size: criteria.size === 'all' || data.size === criteria.size,
                energy: criteria.energy === 'all' || data.energy === criteria.energy,
                animals: criteria.animals === 'all' || data.animals === criteria.animals,
                children: criteria.children === 'all' || data.children === criteria.children
            };

            return Object.values(matches).every(v => v === true);
        });

        const clearBtn = document.getElementById('clear-filters');
        if (clearBtn) {
            const hasActiveFilters = criteria.species !== 'all' || criteria.age !== 'all' || 
                                     criteria.breed !== '' || criteria.size !== 'all' || 
                                     criteria.energy !== 'all' || criteria.animals !== 'all' || 
                                     criteria.children !== 'all';
            if (hasActiveFilters) clearBtn.classList.remove('hidden');
            else clearBtn.classList.add('hidden');
        }
        renderPets(filtered);
    } catch (e) {
        console.error("[App] Filter Logic Error:", e);
    }
}

function handleClearFilters() {
    const breedInput = document.getElementById('filter-breed');
    if (breedInput) breedInput.value = '';
    
    const selects = document.querySelectorAll('.filters-sidebar select');
    selects.forEach(s => { s.value = 'all'; });
    
    document.getElementById('clear-filters')?.classList.add('hidden');
    renderPets(currentPetsCache);
}

/**
 * Sidebar
 */
function toggleSidebar() {
    const layout = document.querySelector('.sidebar-layout');
    const btn = document.getElementById('toggle-sidebar');
    if (!layout || !btn) return;
    layout.classList.toggle('sidebar-collapsed');
    const isColl = layout.classList.contains('sidebar-collapsed');
    const txt = btn.querySelector('.btn-text');
    if (txt) txt.textContent = isColl ? 'Show Filters' : 'Hide Filters';
    window.dispatchEvent(new Event('resize'));
}

/**
 * Admin
 */
function setupAdmin() {
    const logSection = document.getElementById('admin-login');
    const content = document.getElementById('admin-content');
    const passInput = document.getElementById('admin-password');
    const logBtn = document.getElementById('login-btn');

    if (!logBtn) return;
    logBtn.addEventListener('click', () => {
        if (passInput.value === ADMIN_PASS) {
            logSection.classList.add('hidden');
            content.classList.remove('hidden');
            setupAdminForm();
            refreshAdminPets();
        } else {
            document.getElementById('login-error')?.classList.remove('hidden');
            passInput.value = '';
        }
    });
}

function setupAdminForm() {
    const form = document.getElementById('add-pet-form');
    if (!form) return;
    form.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const newPet = {
            id: Date.now().toString(),
            name: fd.get('name'),
            species: fd.get('species'),
            age: fd.get('age'),
            breed: fd.get('breed'),
            size: fd.get('size'),
            energy: fd.get('energy'),
            goodWithAnimals: fd.get('goodWithAnimals'),
            goodWithChildren: fd.get('goodWithChildren'),
            image: fd.get('image'),
            description: fd.get('description')
        };
        currentPetsCache.push(newPet);
        saveToStorage(currentPetsCache);
        form.reset();
        refreshAdminPets();
    };
}

async function refreshAdminPets() {
    const data = await loadPets();
    const list = document.getElementById('admin-pets-list');
    if (list) {
        list.innerHTML = '';
        data.forEach(p => list.appendChild(createPetCard(p, true)));
    }
}

async function removePet(id) {
    if (!confirm('Remove?')) return;
    currentPetsCache = currentPetsCache.filter(p => String(p.id) !== String(id));
    saveToStorage(currentPetsCache);
    refreshAdminPets();
}

/**
 * Initialization Helpers
 */
function setupFilters() {} // Placeholder for index flow

// Final Export
window.initApp = initApp;
