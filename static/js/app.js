/**
 * BigQuery Release Notes Viewer - Frontend Application Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    // Application State
    const state = {
        notes: [],
        filteredNotes: [],
        currentFilter: 'all',
        searchQuery: '',
        selectedNoteId: null,
        activeTweetNote: null
    };

    // DOM Elements
    const elements = {
        btnRefresh: document.getElementById('btn-refresh'),
        btnRetry: document.getElementById('btn-retry'),
        btnClearSearch: document.getElementById('btn-clear-search'),
        loadingState: document.getElementById('loading-state'),
        errorState: document.getElementById('error-state'),
        emptyState: document.getElementById('empty-state'),
        timelineContainer: document.getElementById('timeline-container'),
        notesList: document.getElementById('notes-list'),
        searchInput: document.getElementById('search-input'),
        searchClear: document.getElementById('search-clear'),
        filterTabs: document.querySelectorAll('.filter-tab'),
        statsCards: document.querySelectorAll('.stat-card'),
        
        // Stats
        statAll: document.getElementById('stat-all'),
        statFeature: document.getElementById('stat-feature'),
        statAnnouncement: document.getElementById('stat-announcement'),
        statChange: document.getElementById('stat-change'),
        statBreaking: document.getElementById('stat-breaking'),

        // Tweet Modal
        tweetModal: document.getElementById('tweet-modal'),
        tweetTextarea: document.getElementById('tweet-textarea'),
        modalClose: document.getElementById('modal-close'),
        btnCancelTweet: document.getElementById('btn-cancel-tweet'),
        btnPublishTweet: document.getElementById('btn-publish-tweet'),
        charCount: document.getElementById('char-count'),
        progressCircle: document.getElementById('progress-circle'),
        tweetWarning: document.getElementById('tweet-warning'),
        tweetTimeDisplay: document.getElementById('tweet-time-display'),
        toastContainer: document.getElementById('toast-container')
    };

    // Map Category types to FontAwesome icons & CSS Variables
    const categoryConfig = {
        'Feature': { icon: 'fa-rocket', rgb: '16, 185, 129', color: '#10b981' },
        'Announcement': { icon: 'fa-bullhorn', rgb: '139, 92, 246', color: '#8b5cf6' },
        'Change': { icon: 'fa-sliders', rgb: '245, 158, 11', color: '#f59e0b' },
        'Issue': { icon: 'fa-bug', rgb: '249, 115, 22', color: '#f97316' },
        'Breaking': { icon: 'fa-circle-exclamation', rgb: '239, 68, 68', color: '#ef4444' },
        'General': { icon: 'fa-square-poll-vertical', rgb: '107, 114, 128', color: '#6b7280' }
    };

    // Initialize Application
    init();

    function init() {
        // Fetch feed data initially
        fetchNotes();

        // Wire event listeners
        elements.btnRefresh.addEventListener('click', () => fetchNotes(true));
        elements.btnRetry.addEventListener('click', () => fetchNotes(true));
        elements.btnClearSearch.addEventListener('click', resetFilters);
        
        // Search interactions
        elements.searchInput.addEventListener('input', handleSearch);
        elements.searchClear.addEventListener('click', clearSearchInput);

        // Filter tab interactions
        elements.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const filter = tab.dataset.filter;
                setActiveFilter(filter);
            });
        });

        // Stats card interactions (clicking stats filters by that category)
        elements.statsCards.forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                const targetFilter = category === 'All' ? 'all' : category;
                setActiveFilter(targetFilter);
            });
        });

        // Modal Close listeners
        elements.modalClose.addEventListener('click', closeTweetModal);
        elements.btnCancelTweet.addEventListener('click', closeTweetModal);
        elements.tweetModal.addEventListener('click', (e) => {
            if (e.target === elements.tweetModal) closeTweetModal();
        });

        // Dynamic character counter in composer
        elements.tweetTextarea.addEventListener('input', updateCharCount);
        elements.btnPublishTweet.addEventListener('click', publishTweet);
    }

    // --- API & DATA FETCHING ---
    async function fetchNotes(isRefresh = false) {
        showLoadingState();
        if (isRefresh) {
            elements.btnRefresh.querySelector('.spinner-icon').classList.add('spinning');
            elements.btnRefresh.disabled = true;
        }

        try {
            const response = await fetch('/api/releases');
            const result = await response.json();

            if (result.success) {
                state.notes = result.data;
                updateStatsPanel();
                applyFiltersAndRender();
                showSuccessToast(isRefresh ? 'Feed successfully refreshed!' : 'Feed notes loaded successfully.');
            } else {
                showErrorState(result.error || 'Server returned an error fetching feed data.');
            }
        } catch (error) {
            console.error('Error fetching release notes:', error);
            showErrorState('Network error: Unable to connect to backend server.');
        } finally {
            if (isRefresh) {
                elements.btnRefresh.querySelector('.spinner-icon').classList.remove('spinning');
                elements.btnRefresh.disabled = false;
            }
        }
    }

    // --- RENDER FUNCTIONS ---
    function applyFiltersAndRender() {
        const query = state.searchQuery.toLowerCase().trim();
        const filter = state.currentFilter;

        state.filteredNotes = state.notes.filter(note => {
            // Apply category filter
            const matchesCategory = filter === 'all' || note.category.toLowerCase() === filter.toLowerCase();
            
            // Apply search query filter (matches category, date or description content)
            const matchesSearch = !query || 
                note.category.toLowerCase().includes(query) ||
                note.date.toLowerCase().includes(query) ||
                note.clean_text.toLowerCase().includes(query);

            return matchesCategory && matchesSearch;
        });

        renderNotesList();
    }

    function renderNotesList() {
        elements.notesList.innerHTML = '';

        if (state.filteredNotes.length === 0) {
            showEmptyState();
            return;
        }

        showTimelineContainer();

        state.filteredNotes.forEach(note => {
            const card = createReleaseCard(note);
            elements.notesList.appendChild(card);
        });
    }

    function createReleaseCard(note) {
        const config = categoryConfig[note.category] || categoryConfig['General'];
        
        const card = document.createElement('article');
        card.className = `release-card ${state.selectedNoteId === note.id ? 'selected-card' : ''}`;
        card.id = `card-${note.id}`;
        card.style.setProperty('--card-color', config.color);
        card.style.setProperty('--card-gradient', `linear-gradient(135deg, ${config.color} 0%, rgba(${config.rgb}, 0.6) 100%)`);
        card.style.setProperty('--card-rgb', config.rgb);

        // Timeline node indicator
        const node = document.createElement('div');
        node.className = 'card-timeline-node';
        node.innerHTML = `<i class="fa-solid ${config.icon}"></i>`;
        card.appendChild(node);

        // Header
        const header = document.createElement('div');
        header.className = 'card-header';
        
        const metaLeft = document.createElement('div');
        metaLeft.className = 'card-meta-left';
        
        const badge = document.createElement('span');
        badge.className = `badge badge-${note.category.toLowerCase()}`;
        badge.innerHTML = `<i class="fa-solid ${config.icon}"></i> ${note.category}`;
        
        const date = document.createElement('span');
        date.className = 'card-date';
        date.innerHTML = `<i class="fa-regular fa-calendar-days"></i> ${note.date}`;
        
        metaLeft.appendChild(badge);
        metaLeft.appendChild(date);
        header.appendChild(metaLeft);

        // Action Button: Tweet
        const tweetAction = document.createElement('div');
        tweetAction.className = 'card-tweet-action';
        
        const btnTweet = document.createElement('button');
        btnTweet.className = 'btn-tweet-small';
        btnTweet.innerHTML = `<i class="fa-brands fa-x-twitter"></i> Tweet`;
        btnTweet.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop card selection highlighting on tweet button click
            openTweetModal(note);
        });
        
        tweetAction.appendChild(btnTweet);
        header.appendChild(tweetAction);
        card.appendChild(header);

        // Body
        const body = document.createElement('div');
        body.className = 'card-body';
        body.innerHTML = note.body_html;
        card.appendChild(body);

        // Clicking on the card selects it
        card.addEventListener('click', () => {
            selectCard(note.id);
        });

        return card;
    }

    function selectCard(noteId) {
        // If already selected, deselect it
        if (state.selectedNoteId === noteId) {
            const currentSelected = document.getElementById(`card-${noteId}`);
            if (currentSelected) currentSelected.classList.remove('selected-card');
            state.selectedNoteId = null;
            return;
        }

        // Deselect previous card
        if (state.selectedNoteId) {
            const prevSelected = document.getElementById(`card-${state.selectedNoteId}`);
            if (prevSelected) prevSelected.classList.remove('selected-card');
        }

        // Select new card
        state.selectedNoteId = noteId;
        const newSelected = document.getElementById(`card-${noteId}`);
        if (newSelected) {
            newSelected.classList.add('selected-card');
        }
    }

    // --- FILTER & SEARCH CONTROL HANDLERS ---
    function handleSearch(e) {
        state.searchQuery = e.target.value;
        if (state.searchQuery) {
            elements.searchClear.style.display = 'block';
        } else {
            elements.searchClear.style.display = 'none';
        }
        applyFiltersAndRender();
    }

    function clearSearchInput() {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.searchClear.style.display = 'none';
        applyFiltersAndRender();
    }

    function setActiveFilter(filter) {
        state.currentFilter = filter;

        // Update active tab visual state
        elements.filterTabs.forEach(tab => {
            if (tab.dataset.filter.toLowerCase() === filter.toLowerCase()) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update active stats card visual state
        elements.statsCards.forEach(card => {
            const cardCategory = card.dataset.category;
            const normalizedCategory = cardCategory === 'All' ? 'all' : cardCategory;
            
            if (normalizedCategory.toLowerCase() === filter.toLowerCase()) {
                card.classList.add('active-filter');
            } else {
                card.classList.remove('active-filter');
            }
        });

        applyFiltersAndRender();
    }

    function resetFilters() {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.searchClear.style.display = 'none';
        setActiveFilter('all');
    }

    // --- STATS PANEL ---
    function updateStatsPanel() {
        const counts = {
            all: state.notes.length,
            feature: 0,
            announcement: 0,
            change: 0,
            breaking: 0
        };

        state.notes.forEach(note => {
            const cat = note.category.toLowerCase();
            if (counts.hasOwnProperty(cat)) {
                counts[cat]++;
            }
        });

        elements.statAll.textContent = counts.all;
        elements.statFeature.textContent = counts.feature;
        elements.statAnnouncement.textContent = counts.announcement;
        elements.statChange.textContent = counts.change;
        elements.statBreaking.textContent = counts.breaking;
    }

    // --- STATE VISIBILITY MANAGERS ---
    function showLoadingState() {
        elements.loadingState.style.display = 'flex';
        elements.errorState.style.display = 'none';
        elements.emptyState.style.display = 'none';
        elements.timelineContainer.style.display = 'none';
    }

    function showErrorState(message) {
        elements.loadingState.style.display = 'none';
        elements.errorState.style.display = 'flex';
        elements.emptyState.style.display = 'none';
        elements.timelineContainer.style.display = 'none';
        elements.errorMessage.textContent = message;
    }

    function showEmptyState() {
        elements.loadingState.style.display = 'none';
        elements.errorState.style.display = 'none';
        elements.emptyState.style.display = 'flex';
        elements.timelineContainer.style.display = 'none';
    }

    function showTimelineContainer() {
        elements.loadingState.style.display = 'none';
        elements.errorState.style.display = 'none';
        elements.emptyState.style.display = 'none';
        elements.timelineContainer.style.display = 'block';
    }

    // --- TWITTER / X MODAL CONTROLLER ---
    function openTweetModal(note) {
        state.activeTweetNote = note;
        
        // Structure starting Tweet Text:
        // Prefixes and suffixes
        const prefix = `BigQuery Update (${note.date}) - [${note.category}]: `;
        const suffix = `\n\n#BigQuery #GoogleCloud`;
        const link = `https://cloud.google.com/bigquery/docs/release-notes`;
        
        // Character spaces: Twitter treats URLs as 23 characters
        // We will calculate a safe length for snippet
        const maxSnippetLength = 280 - prefix.length - suffix.length - 24; 
        
        let snippet = note.clean_text;
        if (snippet.length > maxSnippetLength) {
            snippet = snippet.substring(0, maxSnippetLength - 3) + "...";
        }
        
        const fullTweetContent = `${prefix}${snippet}${suffix}`;
        
        // Display inside text area
        elements.tweetTextarea.value = fullTweetContent;
        elements.tweetTimeDisplay.textContent = note.date;
        
        // Show modal and update counts
        elements.tweetModal.style.display = 'flex';
        elements.tweetTextarea.focus();
        updateCharCount();
    }

    function closeTweetModal() {
        elements.tweetModal.style.display = 'none';
        state.activeTweetNote = null;
    }

    function updateCharCount() {
        const text = elements.tweetTextarea.value;
        
        // Twitter character counts are special. We do a standard character length
        // but adapt the count to represent URLs as exactly 23 characters for Twitter.
        // Regex to match URLs:
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = text.match(urlRegex) || [];
        
        let textWithoutUrls = text.replace(urlRegex, '');
        let calculatedLength = textWithoutUrls.length + (urls.length * 23);
        
        elements.charCount.textContent = calculatedLength;

        // Progress Circle animations
        const maxChars = 280;
        const radius = 8;
        const circumference = 2 * Math.PI * radius; // 50.265
        
        let percent = Math.min(calculatedLength / maxChars, 1);
        let offset = circumference * (1 - percent);
        
        elements.progressCircle.style.strokeDashoffset = offset;

        // Warn state handling
        if (calculatedLength > maxChars) {
            elements.progressCircle.style.stroke = '#ef4444'; // Red circle
            elements.charCount.style.color = '#ef4444';
            elements.tweetWarning.style.display = 'inline-flex';
            elements.btnPublishTweet.disabled = true;
            elements.btnPublishTweet.style.opacity = '0.5';
        } else {
            elements.progressCircle.style.stroke = '#1d9bf0'; // Blue circle
            elements.charCount.style.color = '#9ca3af';
            elements.tweetWarning.style.display = 'none';
            elements.btnPublishTweet.disabled = false;
            elements.btnPublishTweet.style.opacity = '1';
        }
    }

    function publishTweet() {
        const tweetText = elements.tweetTextarea.value;
        const appUrl = "https://cloud.google.com/bigquery/docs/release-notes";
        
        const baseUrl = "https://twitter.com/intent/tweet";
        const shareUrl = `${baseUrl}?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(appUrl)}`;
        
        window.open(shareUrl, '_blank');
        closeTweetModal();
        showSuccessToast('Opened X (Twitter) share composer.');
    }

    // --- TOAST NOTIFICATIONS ---
    function showSuccessToast(message) {
        showToast(message, 'success');
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
        
        const icon = type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check';
        
        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close"><i class="fa-solid fa-xmark"></i></button>
        `;
        
        elements.toastContainer.appendChild(toast);
        
        // Remove toast on click of close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
        
        // Auto remove toast after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'fade-out 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
});
