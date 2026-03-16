const STORAGE_KEY = 'lethbridge_pets_data_v10';
const ADMIN_PASS = 'lethbridge2026';

// State Management
let petModalTimeout = null;
let adoptModalTimeout = null;
let currentPetsCache = [];

// Fallback image (Gray square 1x1 base64)
const PLACEHOLDER_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/**
 * Global Error Handler for Debugging
 */
window.onerror = function(msg, url, lineNo, columnNo, error) {
    const errorMsg = `Error: ${msg}\nLine: ${lineNo}\nColumn: ${columnNo}\nURL: ${url}`;
    console.error(errorMsg, error);
    // Only alert for non-trivial errors to avoid annoying the user
    if (msg.toLowerCase().indexOf('script error') === -1) {
        // alert("A website error occurred. Please tell the assistant: " + msg);
    }
    return false;
};

/**
 * Initialize application
 */
async function initApp(page) {
    console.log("Initializing app for page:", page);
    setupGlobalListeners();
    
    if (page === 'index') {
        setupSidebarToggle();
        try {
            const data = await loadPets();
            currentPetsCache = data;
            renderPets(data);
            setupFilters(data);
        } catch (err) {
            console.error("Initialization failed:", err);
            const grid = document.getElementById('pets-grid');
            if (grid) grid.innerHTML = '<div class="error">Failed to load pets. Please refresh.</div>';
        }
    } else if (page === 'admin') {
        setupAdmin();
    }
}

/**
 * Setup Event Delegation for the whole document
 */
function setupGlobalListeners() {
    document.addEventListener('click', (e) => {
        const target = e.target;
        
        // Meet Pet Button
        if (target.classList.contains('pet-action')) {
            const petId = target.getAttribute('data-id');
            if (petId) openPetModal(petId);
            return;
        }
        
        // Modal Close Buttons (using data-close-modal attribute)
        if (target.closest('.modal-close') || target.classList.contains('btn-close-modal')) {
            const modal = target.closest('.modal-overlay');
            if (modal) {
                if (modal.id === 'pet-modal') closeModal();
                else if (modal.id === 'adoption-modal') closeAdoptionModal();
            }
            return;
        }

        // Adopt Button
        if (target.classList.contains('adopt-now-btn')) {
            openAdoptionModal();
            return;
        }

        // Overlay Click to Close
        if (target.classList.contains('modal-overlay')) {
            if (target.id === 'pet-modal') closeModal();
            else if (target.id === 'adoption-modal') closeAdoptionModal();
            return;
        }

        // Sidebar Toggle
        if (target.closest('#toggle-sidebar')) {
            toggleSidebar();
            return;
        }

        // Clear Filters
        if (target.id === 'clear-filters') {
            handleClearFilters();
            return;
        }
        
        // Remove Pet (Admin)
        if (target.classList.contains('btn-delete')) {
            const petId = target.getAttribute('data-id');
            if (petId) removePet(petId);
            return;
        }
    });

    // Handle form input/change for filters via delegation
    document.addEventListener('change', (e) => {
        if (e.target.id && e.target.id.startsWith('filter-')) {
            applyFilters(currentPetsCache);
        }
    });
    document.addEventListener('input', (e) => {
        if (e.target.id === 'filter-breed') {
            applyFilters(currentPetsCache);
        }
    });
}

/**
 * Pet Loading Logic
 */
async function loadPets() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const data = JSON.parse(stored);
            currentPetsCache = data;
            return data;
        } catch (e) {
            console.error("Corrupt data in localStorage, resetting...");
            localStorage.removeItem(STORAGE_KEY);
        }
    }
    currentPetsCache = DEFAULT_PETS;
    saveToStorage(DEFAULT_PETS);
    return DEFAULT_PETS;
}

function saveToStorage(petsArray) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(petsArray));
}

/**
 * Rendering Logic
 */
function renderPets(pets) {
    const grid = document.getElementById('pets-grid');
    if (!grid) return;
    
    if (pets.length === 0) {
        grid.innerHTML = '<div class="no-pets">No pets found matching your filters.</div>';
        return;
    }
    
    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();
    pets.forEach(pet => fragment.appendChild(createPetCard(pet, false)));
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
 * Modal Logic
 */
async function openPetModal(id) {
    if (petModalTimeout) {
        clearTimeout(petModalTimeout);
        petModalTimeout = null;
    }

    const pet = currentPetsCache.find(p => String(p.id) === String(id));
    if (!pet) return;

    const modal = document.getElementById('pet-modal');
    if (!modal) return;

    // Fill data
    updateModalContent(pet);

    // Show
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    requestAnimationFrame(() => {
        modal.classList.add('modal-visible');
    });
}

function updateModalContent(pet) {
    try {
        const set = (id, text) => { 
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };
        
        set('modal-pet-name', pet.name);
        set('modal-pet-breed', pet.breed || 'Unknown Breed');
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
        console.error("Modal update error:", e);
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
            <div class="stat-item"><span class="stat-label">Other Pets</span><span class="stat-value">${pet.goodWithAnimals === 'Yes' ? '✅' : '🚫'}</span></div>
            <div class="stat-item"><span class="stat-label">Children</span><span class="stat-value">${pet.goodWithChildren === 'Yes' ? '✅' : '🚫'}</span></div>
        `;
    }
}

function closeModal() {
    const modal = document.getElementById('pet-modal');
    if (!modal) return;
    
    if (petModalTimeout) clearTimeout(petModalTimeout);
    modal.classList.remove('modal-visible');
    
    const adoptionModal = document.getElementById('adoption-modal');
    const isAdoptionVisible = adoptionModal && adoptionModal.classList.contains('modal-visible');
    if (!isAdoptionVisible) document.body.style.overflow = '';

    petModalTimeout = setTimeout(() => {
        modal.style.display = 'none';
        petModalTimeout = null;
    }, 450);
}

function openAdoptionModal() {
    if (adoptModalTimeout) {
        clearTimeout(adoptModalTimeout);
        adoptModalTimeout = null;
    }

    const modal = document.getElementById('adoption-modal');
    if (!modal) return;

    const petName = document.getElementById('modal-pet-name')?.textContent || 'this friend';
    const title = document.getElementById('adoption-modal-title');
    if (title) title.innerHTML = `Adopt <span class="accent-text">${petName}</span>`;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    requestAnimationFrame(() => {
        modal.classList.add('modal-visible');
    });
}

function closeAdoptionModal() {
    const modal = document.getElementById('adoption-modal');
    if (!modal) return;

    if (adoptModalTimeout) clearTimeout(adoptModalTimeout);
    modal.classList.remove('modal-visible');
    
    // Check if pet modal is still visible before restoring scroll
    const petModal = document.getElementById('pet-modal');
    if (!petModal || !petModal.classList.contains('modal-visible')) {
        document.body.style.overflow = '';
    }

    adoptModalTimeout = setTimeout(() => {
        modal.style.display = 'none';
        adoptModalTimeout = null;
    }, 450);
}

/**
 * Filter Management
 */
function setupFilters(allPets) {
    const clearBtn = document.getElementById('clear-filters');
    if (clearBtn) {
        // Shown/hidden inside handleClearFilters and applyFilters
    }
}

function handleClearFilters() {
    const selects = document.querySelectorAll('.filter-group select');
    const search = document.getElementById('filter-breed');
    selects.forEach(s => s.value = 'all');
    if (search) search.value = '';
    
    const clearBtn = document.getElementById('clear-filters');
    if (clearBtn) clearBtn.classList.add('hidden');
    
    renderPets(currentPetsCache);
}

function applyFilters(allPets) {
    const get = (id) => document.getElementById(id)?.value?.toLowerCase() || 'all';
    
    const age = get('filter-age');
    const breed = document.getElementById('filter-breed')?.value?.toLowerCase() || '';
    const size = get('filter-size');
    const energy = get('filter-energy');
    const animals = get('filter-animals');
    const children = get('filter-children');

    const filtered = allPets.filter(pet => {
        const mAge = age === 'all' || (pet.age?.toLowerCase().includes(age));
        const mBreed = breed === '' || pet.breed?.toLowerCase().includes(breed) || pet.species?.toLowerCase().includes(breed);
        const mSize = size === 'all' || pet.size?.toLowerCase() === size;
        const mEnergy = energy === 'all' || pet.energy?.toLowerCase() === energy;
        const mAnim = animals === 'all' || pet.goodWithAnimals?.toLowerCase() === animals;
        const mChild = children === 'all' || pet.goodWithChildren?.toLowerCase() === children;
        return mAge && mBreed && mSize && mEnergy && mAnim && mChild;
    });

    const clearBtn = document.getElementById('clear-filters');
    if (clearBtn) clearBtn.classList.remove('hidden');
    
    renderPets(filtered);
}

/**
 * Sidebar Toggle
 */
function setupSidebarToggle() {} // Deprecated, moved to delegation

function toggleSidebar() {
    const layout = document.querySelector('.sidebar-layout');
    const toggleBtn = document.getElementById('toggle-sidebar');
    if (!layout || !toggleBtn) return;

    layout.classList.toggle('sidebar-collapsed');
    const isCollapsed = layout.classList.contains('sidebar-collapsed');
    const btnText = toggleBtn.querySelector('.btn-text');
    if (btnText) btnText.textContent = isCollapsed ? 'Show Filters' : 'Hide Filters';
    window.dispatchEvent(new Event('resize'));
}

/**
 * Admin Features
 */
function setupAdmin() {
    const loginSection = document.getElementById('admin-login');
    const adminContent = document.getElementById('admin-content');
    const passwordInput = document.getElementById('admin-password');
    const loginBtn = document.getElementById('login-btn');

    if (!loginBtn) return;

    loginBtn.addEventListener('click', () => {
        if (passwordInput.value === ADMIN_PASS) {
            loginSection.classList.add('hidden');
            adminContent.classList.remove('hidden');
            setupAdminForm();
            refreshAdminPets();
        } else {
            document.getElementById('login-error')?.classList.remove('hidden');
            passwordInput.value = '';
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
        
        const msg = document.getElementById('form-message');
        if (msg) {
            msg.style.display = 'block';
            setTimeout(() => { msg.style.display = 'none'; }, 3000);
        }
    };
}

async function removePet(id) {
    if (!confirm('Remove this pet?')) return;
    currentPetsCache = currentPetsCache.filter(p => String(p.id) !== String(id));
    saveToStorage(currentPetsCache);
    refreshAdminPets();
    if (document.getElementById('admin-pets-list')) renderAdminPets(currentPetsCache);
}

function renderAdminPets(pets) {
    const list = document.getElementById('admin-pets-list');
    if (!list) return;
    list.innerHTML = '';
    pets.forEach(pet => list.appendChild(createPetCard(pet, true)));
}

// Data
const DEFAULT_PETS = [{"id":"1","name":"Cinder","species":"Dog","breed":"Heeler mix","age":"Adult","size":"Medium","energy":"High","goodWithAnimals":"No","goodWithChildren":"Yes","description":"Cinder is a working dog who needs someone experienced with heelers.","image":"images/cinder.jpg"},{"id":"2","name":"Ryder","species":"Dog","breed":"Large breed","age":"Adult","size":"Large","energy":"Medium","goodWithAnimals":"Yes","goodWithChildren":"Yes","description":"Ryder is a big, beautiful boy who drools.","image":"images/ryder.jpg"},{"id":"3","name":"Finnley","species":"Dog","breed":"Unknown","age":"Adult","size":"Medium","energy":"High","goodWithAnimals":"Yes","goodWithChildren":"Yes","description":"Finnley is a sweet, active girl.","image":"images/finnley.jpg"},{"id":"4","name":"Odin","species":"Dog","breed":"Lanky/Silly Puppy","age":"Tween years","size":"Large","energy":"High","goodWithAnimals":"Yes","goodWithChildren":"Yes","description":"Odin is a silly, lanky young dog.","image":"images/odin.jpg"},{"id":"5","name":"Axel","species":"Dog","breed":"Bullheaded breed mix","age":"Adult","size":"Large","energy":"Medium","goodWithAnimals":"No","goodWithChildren":"No","description":"Axel is headstrong.","image":"images/axel.jpg"},{"id":"6","name":"Tahoe","species":"Cat","breed":"Unknown","age":"Adult","size":"Small","energy":"Medium","goodWithAnimals":"No","goodWithChildren":"Yes","description":"Tahoe is a talkative boy.","image":"images/tahoe.jpg"},{"id":"7","name":"Jingles","species":"Cat","breed":"Unknown","age":"Adult","size":"Small","energy":"Low","goodWithAnimals":"No","goodWithChildren":"No","description":"Jingles is a quiet cat.","image":"images/jingles.jpg"},{"id":"8","name":"Tabitha","species":"Cat","breed":"Unknown","age":"Senior","size":"Small","energy":"Low","goodWithAnimals":"Yes","goodWithChildren":"Yes","description":"Tabitha is a shy girl.","image":"images/tabitha.jpg"},{"id":"9","name":"Sonny","species":"Cat","breed":"Unknown","age":"Adult","size":"Small","energy":"Medium","goodWithAnimals":"No","goodWithChildren":"No","description":"Sonny is a character.","image":"images/sonny.jpg"},{"id":"10","name":"Quinn","species":"Cat","breed":"Unknown","age":"Adult","size":"Small","energy":"High","goodWithAnimals":"Yes","goodWithChildren":"Yes","description":"Quinn is a beautiful girl.","image":"images/quinn.jpg"}];

window.initApp = initApp;
