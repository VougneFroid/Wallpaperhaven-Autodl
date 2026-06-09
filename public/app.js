const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const searchBtn = document.getElementById('searchBtn');
const gallery = document.getElementById('gallery');
const loader = document.getElementById('loader');
const galleryInfo = document.getElementById('galleryInfo');
const resultCount = document.getElementById('resultCount');
const actionBar = document.getElementById('actionBar');
const selectedCount = document.getElementById('selectedCount');
const downloadBtn = document.getElementById('downloadBtn');
const toast = document.getElementById('toast');

const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const downloadDirInput = document.getElementById('downloadDirInput');
const browseFolderBtn = document.getElementById('browseFolderBtn');

let selectedWallpapers = new Map(); // id -> data
let isDownloading = false;

// Infinite scroll state
let currentPage = 1;
let isLoading = false;
let hasMore = true;

let downloadHistory = new Set();

// Search function
async function performSearch(isLoadMore = false) {
    if (isLoading || (!hasMore && isLoadMore)) return;

    const query = searchInput.value.trim();
    const sort = sortSelect.value;
    
    if (!isLoadMore) {
        currentPage = 1;
        hasMore = true;
        gallery.innerHTML = '';
        resultCount.textContent = 'Searching...';
    }
    
    isLoading = true;
    loader.style.display = 'block';
    
    // Build query params
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    params.append('sorting', sort);
    params.append('page', currentPage);
    
    try {
        const response = await fetch(`/api/search?${params.toString()}`);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        if (data.data.length === 0) {
            hasMore = false;
        } else {
            renderGallery(data.data, isLoadMore);
            if (!isLoadMore) {
                resultCount.textContent = `Found ${data.meta.total} wallpapers`;
            }
        }
    } catch (error) {
        console.error('Search error:', error);
        if (!isLoadMore) {
            resultCount.textContent = 'Error fetching wallpapers. Make sure API limit is not exceeded.';
        }
        showToast('Error fetching data');
    } finally {
        isLoading = false;
        loader.style.display = 'none';
    }
}

// Render Gallery
function renderGallery(wallpapers, isLoadMore) {
    if (!isLoadMore && (!wallpapers || wallpapers.length === 0)) {
        gallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No wallpapers found. Try a different search.</p>';
        return;
    }
    
    wallpapers.forEach(wp => {
        const card = document.createElement('div');
        card.className = 'wallpaper-card';
        if (selectedWallpapers.has(wp.id)) {
            card.classList.add('selected');
        }
        
        let badgeHtml = '';
        if (downloadHistory.has(wp.id)) {
            badgeHtml = '<div class="downloaded-badge">DOWNLOADED</div>';
        }

        card.innerHTML = `
            <img src="${wp.thumbs.large}" alt="Wallpaper ${wp.id}" loading="lazy">
            ${badgeHtml}
            <div class="check-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <div class="card-overlay">
                <span class="res">${wp.resolution}</span>
                <span class="purity">${wp.purity}</span>
            </div>
        `;
        
        card.addEventListener('click', () => toggleSelection(card, wp));
        gallery.appendChild(card);
    });
}

// Toggle Selection
function toggleSelection(card, wp) {
    if (isDownloading) return; // Prevent selection changes during download
    
    if (selectedWallpapers.has(wp.id)) {
        selectedWallpapers.delete(wp.id);
        card.classList.remove('selected');
    } else {
        selectedWallpapers.set(wp.id, wp);
        card.classList.add('selected');
    }
    
    updateActionBar();
}

// Update floating action bar
function updateActionBar() {
    const count = selectedWallpapers.size;
    selectedCount.textContent = count;
    
    if (count > 0) {
        actionBar.classList.add('visible');
    } else {
        actionBar.classList.remove('visible');
    }
}

// Download Logic
async function downloadSelected() {
    if (selectedWallpapers.size === 0 || isDownloading) return;
    
    isDownloading = true;
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = 'Downloading... <div class="spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;vertical-align:middle;margin-left:8px;"></div>';
    
    const items = Array.from(selectedWallpapers.values());
    let successCount = 0;
    
    for (let i = 0; i < items.length; i++) {
        const wp = items[i];
        showToast(`Downloading ${i + 1} of ${items.length}...`);
        
        try {
            const res = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: wp.path, id: wp.id })
            });
            const data = await res.json();
            
            if (data.success) {
                successCount++;
                downloadHistory.add(wp.id);
            } else {
                console.error('Failed to download', wp.id, data.error);
            }
        } catch (err) {
            console.error('Network error downloading', wp.id, err);
        }
    }
    
    showToast(`Successfully downloaded ${successCount} wallpapers!`);
    
    // Reset state
    selectedWallpapers.clear();
    document.querySelectorAll('.wallpaper-card.selected').forEach(card => card.classList.remove('selected'));
    updateActionBar();
    isDownloading = false;
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Download Selected
    `;
}

// Toast notification
let toastTimeout;
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Event Listeners
searchBtn.addEventListener('click', () => performSearch(false));
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch(false);
});
sortSelect.addEventListener('change', () => performSearch(false));
downloadBtn.addEventListener('click', downloadSelected);

// Setup Intersection Observer for infinite scroll
const scrollSentinel = document.getElementById('scrollSentinel');
if (scrollSentinel) {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            if (!isLoading && hasMore) {
                currentPage++;
                performSearch(true);
            }
        }
    }, { rootMargin: '200px' });
    
    observer.observe(scrollSentinel);
}

// Settings Logic
settingsBtn.addEventListener('click', async () => {
    try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        downloadDirInput.value = data.download_dir || 'downloads';
    } catch(e) {}
    settingsModal.classList.add('show');
});

closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('show');
});

browseFolderBtn.addEventListener('click', async () => {
    browseFolderBtn.textContent = '...';
    try {
        const res = await fetch('/api/choose-folder');
        const data = await res.json();
        if (data.folder) {
            downloadDirInput.value = data.folder;
        }
    } catch(e) {
        showToast('Native folder picker cancelled or not supported');
    } finally {
        browseFolderBtn.textContent = 'Browse';
    }
});

saveSettingsBtn.addEventListener('click', async () => {
    const newDir = downloadDirInput.value.trim();
    if (!newDir) return;
    
    saveSettingsBtn.textContent = 'Saving...';
    try {
        const res = await fetch('/api/settings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({download_dir: newDir})
        });
        const data = await res.json();
        if (data.success) {
            showToast('Settings saved successfully!');
            settingsModal.classList.remove('show');
        } else {
            showToast('Error saving settings');
        }
    } catch(e) {
        showToast('Error saving settings');
    } finally {
        saveSettingsBtn.textContent = 'Save Settings';
    }
});

// Initial load
async function init() {
    try {
        const res = await fetch('/api/history');
        const data = await res.json();
        downloadHistory = new Set(data);
    } catch(e) {}
    performSearch();
}
init();
