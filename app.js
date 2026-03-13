/**
 * App Logic for Lethbridge Pet Adoption
 */

const STORAGE_KEY = 'lethbridge_pets_data';

/**
 * Initialize application based on current page
 */
function initApp(page) {
    loadPets().then(data => {
        if (page === 'index') {
            renderPets(data);
        } else if (page === 'admin') {
            setupForm();
        }
    });
}

/**
 * Fetch or load pets from storage
 */
async function loadPets() {
    // 1. Check local storage first (includes custom user-added pets)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }

    // 2. Local storage empty, fetch from JSON
    try {
        const response = await fetch('pets.json');
        if (!response.ok) throw new Error('Could not fetch initial pets');
        const data = await response.json();
        
        // Save initial to storage so it's ready for future additions
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

    grid.innerHTML = ''; // clear loading state
    
    pets.forEach(pet => {
        const petEl = document.createElement('div');
        petEl.className = 'pet-card';
        
        const speciesIcon = pet.species.toLowerCase() === 'cat' ? '🐈' : 
                            pet.species.toLowerCase() === 'dog' ? '🐕' : 
                            pet.species.toLowerCase() === 'bird' ? '🦜' : '🐾';

        // Fallback for missing images
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
                <button class="pet-action">Meet ${pet.name}</button>
            </div>
        `;
        
        grid.appendChild(petEl);
    });
}

/**
 * Setup Admin Form Listeners
 */
function setupForm() {
    const form = document.getElementById('add-pet-form');
    const message = document.getElementById('form-message');
    
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Disable submit button during processing
        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.disabled = true;
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Saving...</span>';

        // Gather form data
        const formData = new FormData(form);
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
            // Load existing, append, save back
            const currentPets = await loadPets();
            currentPets.push(newPet);
            saveToStorage(currentPets);

            // Show success
            form.reset();
            message.className = 'form-message form-message-success';
            message.style.backgroundColor = '#e8f5e9';
            message.style.color = '#2e7d32';
            message.style.border = '1px solid #a5d6a7';
            message.style.display = 'block';

            setTimeout(() => {
                message.style.display = 'none';
            }, 3000);

        } catch (error) {
            console.error("Failed to add pet:", error);
            message.textContent = '❌ An error occurred while saving.';
            message.style.backgroundColor = '#ffebee';
            message.style.color = '#c62828';
            message.style.display = 'block';
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}
