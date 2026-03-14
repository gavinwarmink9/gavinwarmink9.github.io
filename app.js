const STORAGE_KEY = 'lethbridge_pets_data_v4';
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

const DEFAULT_PETS = [
  {
    "id": "1",
    "name": "Cinder",
    "species": "Dog",
    "breed": "Heeler mix",
    "age": "Adult",
    "description": "Cinder is a working dog who needs someone experienced with heelers. She is loyal to one or two people and requires firm, consistent training.",
    "image": "images/cinder.jpg"
  },
  {
    "id": "2",
    "name": "Ryder",
    "species": "Dog",
    "breed": "Large breed",
    "age": "Adult",
    "description": "Ryder is a big, beautiful boy who drools and needs plenty of activity. He is looking for a home with teens or adults.",
    "image": "images/ryder.jpg"
  },
  {
    "id": "3",
    "name": "Finnley",
    "species": "Dog",
    "breed": "Unknown",
    "age": "Adult",
    "description": "Finnley is a sweet, active girl who loves daily jogs and is not a 'sit around' sort of dog.",
    "image": "images/finnley.jpg"
  },
  {
    "id": "4",
    "name": "Odin",
    "species": "Dog",
    "breed": "Lanky/Silly Puppy",
    "age": "Tween years",
    "description": "Odin is a silly, lanky young dog who loves to run and wag his tail. He needs basic obedience training.",
    "image": "images/odin.jpg"
  },
  {
    "id": "5",
    "name": "Axel",
    "species": "Dog",
    "breed": "Bullheaded breed mix",
    "age": "Adult",
    "description": "Axel is headstrong and takes life in stride. He has some training and is looking for a home experienced with bullheaded breeds.",
    "image": "images/axel.jpg"
  },
  {
    "id": "6",
    "name": "Tahoe",
    "species": "Cat",
    "breed": "Unknown",
    "age": "Adult",
    "description": "Tahoe is a talkative and bossy boy who lands his jumps like an elephant and sweet-talks for attention.",
    "image": "images/tahoe.jpg"
  },
  {
    "id": "7",
    "name": "Jingles",
    "species": "Cat",
    "breed": "Unknown",
    "age": "Adult",
    "description": "Jingles is a quiet cat who likes to find her own spot with a good toy. She prefers a house without other cats.",
    "image": "images/jingles.jpg"
  },
  {
    "id": "8",
    "name": "Tabitha",
    "species": "Cat",
    "breed": "Unknown",
    "age": "Senior",
    "description": "Tabitha is a shy girl who loves ribbons and a quiet home. She is described as the reincarnation of a sweet great grandmother.",
    "image": "images/tabitha.jpg"
  },
  {
    "id": "9",
    "name": "Sonny",
    "species": "Cat",
    "breed": "Unknown",
    "age": "Adult",
    "description": "Sonny is a character who wants to be the center of your world. He is affectionate and prefers to be an only pet.",
    "image": "images/sonny.jpg"
  },
  {
    "id": "10",
    "name": "Quinn",
    "species": "Cat",
    "breed": "Unknown",
    "age": "Adult",
    "description": "Quinn is a beautiful girl with unique markings. She is active, loves toy-rescuing, and has a playful 'fly-by' sense of humor.",
    "image": "images/quinn.jpg"
  }
];

/**
 * Fetch or load pets from storage
 */
async function loadPets() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);

    // If no storage is found, fallback to the DEFAULT_PETS array, avoiding the need for network fetch!
    saveToStorage(DEFAULT_PETS);
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
/**
 * Show Pet Modal
 */
async function openPetModal(id) {
    const pets = await loadPets();
    const pet = pets.find(p => p.id === id);
    if (!pet) return;

    const modal = document.getElementById('pet-modal');
    if (!modal) return;

    // Fill modal data
    document.getElementById('modal-pet-name').textContent = pet.name;
    document.getElementById('modal-pet-image').src = pet.image || 'https://via.placeholder.com/800x600?text=No+Photo';
    document.getElementById('modal-pet-image').alt = pet.name;
    document.getElementById('modal-pet-breed').textContent = pet.breed;
    document.getElementById('modal-pet-age').textContent = pet.age;
    document.getElementById('modal-pet-desc').textContent = pet.description;

    // Show modal
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('modal-visible');
        document.body.style.overflow = 'hidden'; // Prevent scroll
    }, 10);
    
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
    if (modal) {
        modal.classList.remove('modal-visible');
        document.body.style.overflow = ''; // Restore scroll
        setTimeout(() => {
            modal.style.display = 'none';
        }, 400);
    }
}

/**
 * Show Adoption Contact Modal
 */
function openAdoptionModal() {
    const modal = document.getElementById('adoption-modal');
    if (!modal) return;

    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('modal-visible');
    }, 10);

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
    if (modal) {
        modal.classList.remove('modal-visible');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 400);
    }
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
