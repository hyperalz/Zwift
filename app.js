// Load routes data
let routesData = null;
let currentMonth = 11; // December (0-indexed)
let currentYear = 2025;
let selectedUser = 'all';
let selectedDate = null;
let selectedRouteIndex = null;
let selectedUserForDate = null;
let sortMiles = '';
let sortElevation = '';
let sortMap = '';
let routesToDisplay = [];
let routeSearchQuery = '';
let isSaving = false; // Flag to prevent real-time listener from applying our own saves

// Load data from JSON
fetch('routes_data.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load routes_data.json');
        }
        return response.json();
    })
    .then(data => {
        routesData = data;
        // Initialize user dates structure - only keep actual date strings, clear booleans
        routesData.routes.forEach(route => {
            routesData.users.forEach(user => {
                // If it's a boolean (from Excel checkmarks), set to null
                // Only keep actual date strings
                if (typeof route.users[user] === 'boolean') {
                    route.users[user] = null;
                } else if (!route.users[user] || typeof route.users[user] !== 'string') {
                    route.users[user] = null;
                }
            });
        });
        initializeApp();
    })
    .catch(error => {
        console.error('Error loading data:', error);
        // Show error message on page
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = `
                <h1>Error Loading Data</h1>
                <p>Could not load routes_data.json. Please ensure the file exists.</p>
                <p>Error: ${error.message}</p>
            `;
        }
    });

function initializeApp() {
    setupCalendar();
    updateStats();
    
    // Wait a moment for Firebase to initialize, then load data
    setTimeout(() => {
        loadUserData();
        
        // If Firebase is enabled, listen for real-time updates from other users
        if (typeof firebaseEnabled !== 'undefined' && firebaseEnabled && database) {
            console.log('👂 Setting up real-time Firebase listener...');
            database.ref('zwiftUserData').on('value', (snapshot) => {
                // Ignore updates that come from our own save operation
                if (isSaving) {
                    console.log('⏸️ Ignoring real-time update (from our own save)');
                    isSaving = false; // Reset flag
                    return;
                }
                
                const saved = snapshot.val();
                console.log('📥 Real-time update received from Firebase:', saved ? 'data received' : 'no data');
                
                if (saved && routesData) {
                    // Firebase stores arrays as objects - convert if needed
                    if (saved.routes) {
                        if (!Array.isArray(saved.routes)) {
                            console.log('🔄 Converting Firebase object to array (real-time)...');
                            const converted = firebaseObjectToArray(saved.routes);
                            if (converted && Array.isArray(converted)) {
                                saved.routes = converted;
                                console.log('✅ Real-time conversion successful');
                            } else {
                                console.warn('⚠️ Real-time conversion failed, ignoring update');
                                return;
                            }
                        }
                    }
                    
                    // Validate structure before applying - must be array with data
                    if (saved.routes && Array.isArray(saved.routes) && saved.routes.length > 0) {
                        console.log('✅ Valid real-time data, applying update to calendar...');
                        applyUserData(saved);
                        console.log('✅ Calendar updated with latest data');
                    } else {
                        console.warn('⚠️ Invalid data structure from Firebase real-time update, ignoring:', {
                            hasRoutes: !!saved.routes,
                            isArray: Array.isArray(saved.routes),
                            length: saved.routes ? saved.routes.length : 0,
                            type: typeof saved.routes
                        });
                    }
                } else if (!routesData) {
                    console.warn('⚠️ routesData not ready yet, skipping update');
                } else {
                    console.log('ℹ️ No data in real-time update');
                }
            }, (error) => {
                console.error('❌ Firebase listener error:', error);
            });
        } else {
            console.log('ℹ️ Firebase not enabled, real-time updates disabled');
        }
    }, 100);
}

function setupCalendar() {
    if (!routesData) {
        console.error('routesData is not loaded');
        return;
    }
    const userFilter = document.getElementById('userFilter');
    if (!userFilter) {
        console.error('userFilter element not found');
        return;
    }
    userFilter.innerHTML = `
        <button class="user-filter-btn active" onclick="filterUser('all')">All Users</button>
        ${routesData.users.map(user => `
            <button class="user-filter-btn" onclick="filterUser('${user}')">${user}</button>
        `).join('')}
    `;
    renderCalendar();
}

function filterUser(user) {
    selectedUser = user;
    document.querySelectorAll('.user-filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderCalendar();
    if (selectedDate) {
        showRoutesForDate(selectedDate);
    }
}

function changeMonth(direction) {
    currentMonth += direction;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
    // Clear selection when changing months
    selectedDate = null;
    clearRouteSelection();
}

function goToToday() {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    renderCalendar();
}

function selectDate(date) {
    selectedDate = date;
    selectedUserForDate = selectedUser !== 'all' ? selectedUser : routesData.users[0];
    showRoutesForDate(date);
    renderCalendar(); // Re-render to show selected date
}

function showRoutesForDate(date, preserveFilters = false) {
    if (!routesData || !date) return;
    
    const dateStr = formatDateForStorage(date);
    const dateDisplay = formatDateForDisplay(date);
    
    // Check if date actually changed
    const dateChanged = selectedDate !== date;
    selectedDate = date;
    
    // Show selected date info
    document.getElementById('selectedDateInfo').style.display = 'block';
    document.getElementById('selectedDateDisplay').textContent = `Routes for ${dateDisplay}`;
    document.getElementById('selectedDateSubtext').textContent = 'Select a route and who is riding';
    
    // Show user selector
    document.getElementById('userSelector').style.display = 'block';
    const userSelectButtons = document.getElementById('userSelectButtons');
    userSelectButtons.innerHTML = routesData.users.map(user => `
        <button class="user-filter-btn ${user === selectedUserForDate ? 'active' : ''}" 
                onclick="selectUserForDate('${user}', event)"
                style="padding: 8px 16px; border: 2px solid ${user === selectedUserForDate ? '#2196F3' : '#ddd'}; background: ${user === selectedUserForDate ? '#2196F3' : 'white'}; color: ${user === selectedUserForDate ? 'white' : '#333'}; border-radius: 6px; cursor: pointer; font-size: 14px;">
            ${user}
        </button>
    `).join('');
    
    // Show sort controls
    document.getElementById('sortControls').style.display = 'block';
    
    // Only clear search and sorts when date actually changes (not when sorting/filtering)
    if (dateChanged && !preserveFilters) {
        const searchInput = document.getElementById('routeSearch');
        const milesSelect = document.getElementById('sortMiles');
        const elevationSelect = document.getElementById('sortElevation');
        const mapSelect = document.getElementById('sortMap');
        
        if (searchInput) {
            searchInput.value = '';
            routeSearchQuery = '';
        }
        if (milesSelect) milesSelect.value = '';
        if (elevationSelect) elevationSelect.value = '';
        if (mapSelect) mapSelect.value = '';
        sortMiles = '';
        sortElevation = '';
        sortMap = '';
    } else {
        // Restore sort values from DOM if they exist
        const milesSelect = document.getElementById('sortMiles');
        const elevationSelect = document.getElementById('sortElevation');
        const mapSelect = document.getElementById('sortMap');
        const searchInput = document.getElementById('routeSearch');
        
        if (milesSelect && milesSelect.value) sortMiles = milesSelect.value;
        if (elevationSelect && elevationSelect.value) sortElevation = elevationSelect.value;
        if (mapSelect && mapSelect.value) sortMap = mapSelect.value;
        if (searchInput) routeSearchQuery = searchInput.value || '';
    }
    
    // Get routes already on this date - group by route, showing all riders
    const routesOnDateMap = new Map(); // route index -> { route, index, riders: [user1, user2, ...] }
    routesData.routes.forEach((route, index) => {
        const ridersOnThisRoute = [];
        routesData.users.forEach(user => {
            if (route.users[user] === dateStr) {
                ridersOnThisRoute.push(user);
            }
        });
        if (ridersOnThisRoute.length > 0) {
            routesOnDateMap.set(index, { route, index, riders: ridersOnThisRoute });
        }
    });
    
    const routeList = document.getElementById('routeList');
    
    // Show routes already added to this date first (grouped by route with all riders)
    let html = '';
    if (routesOnDateMap.size > 0) {
        html += '<h3 style="margin-bottom: 15px; color: #2c3e50; font-size: 18px;">Rides on this date:</h3>';
        routesOnDateMap.forEach(({ route, index, riders }) => {
            const milesStr = route.length_miles || '0';
            const miles = parseFloat(milesStr.toString().replace(/[^\d.]/g, '')) || 0;
            const ridersList = riders.join(', ');
            const isJointRide = riders.length > 1;
            
            html += `
                <div class="route-item added-ride" style="background: #e8f5e9; border-color: #4caf50;">
                    <div class="route-item-header">
                        <div>
                            <div class="route-name">${route.route}${isJointRide ? ' <span style="color: #4caf50; font-size: 0.9em;">(Joint Ride)</span>' : ''}</div>
                            <div class="route-map">${route.map} • ${ridersList}</div>
                        </div>
                        <span style="background: #4caf50; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">Added</span>
                    </div>
                    <div class="route-details">
                        <span><strong>${miles.toFixed(1)}</strong> miles</span>
                        <span><strong>${route.elevation || '-'}</strong> elevation</span>
                        <span><strong>${route.badge_xp || '-'}</strong> XP</span>
                    </div>
                    <div class="route-actions" style="display: flex; gap: 8px; flex-wrap: wrap;">
                        ${riders.map(user => `
                            <button class="cancel-btn" 
                                    onclick="removeRouteFromDate(${index}, '${user}')"
                                    style="padding: 6px 12px; font-size: 12px;">
                                Remove ${user}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        html += '<h3 style="margin-top: 30px; margin-bottom: 15px; color: #2c3e50; font-size: 18px;">Available routes:</h3>';
    }
    
    // Get all available routes (not already added by selected user)
    routesToDisplay = routesData.routes.map((route, index) => {
        const milesStr = route.length_miles || '0';
        const miles = parseFloat(milesStr.toString().replace(/[^\d.]/g, '')) || 0;
        
        // Parse elevation (e.g., "155m (509')" -> 155)
        let elevationNum = 0;
        if (route.elevation) {
            const elevMatch = route.elevation.match(/(\d+)m/);
            if (elevMatch) {
                elevationNum = parseFloat(elevMatch[1]);
            }
        }
        
        // Check if this route is already used on this date by the selected user
        // Only hide it if the CURRENT selected user already has it (allow other users to join)
        const isAlreadyAddedBySelectedUser = route.users[selectedUserForDate] === dateStr;
        
        if (isAlreadyAddedBySelectedUser) {
            return null; // Don't show in available routes if selected user already added it
        }
        
        return {
            route,
            index,
            miles,
            elevation: elevationNum,
            xp: route.badge_xp || 0,
            name: route.route.toLowerCase(),
            map: route.map.toLowerCase()
        };
    }).filter(r => r !== null);
    
    // Apply search filter
    if (routeSearchQuery && routeSearchQuery.trim()) {
        const query = routeSearchQuery.toLowerCase().trim();
        routesToDisplay = routesToDisplay.filter(r => 
            r.name.includes(query) || r.map.includes(query)
        );
    }
    
    // Apply sorting BEFORE rendering
    applySortToRoutes();
    
    // Render sorted routes
    html += routesToDisplay.map(({ route, index, miles }) => {
        return `
            <div class="route-item" 
                 onclick="addRouteToDate(${index})"
                 data-index="${index}">
                <div class="route-item-header">
                    <div>
                        <div class="route-name">${route.route}</div>
                        <div class="route-map">${route.map}</div>
                    </div>
                </div>
                <div class="route-details">
                    <span><strong>${miles.toFixed(1)}</strong> miles</span>
                    <span><strong>${route.elevation || '-'}</strong> elevation</span>
                    <span><strong>${route.badge_xp || '-'}</strong> XP</span>
                </div>
            </div>
        `;
    }).join('');
    
    routeList.innerHTML = html || '<p style="text-align: center; color: #999; padding: 20px;">All routes have been added for this user on this date</p>';
}

function applySort() {
    const milesSelect = document.getElementById('sortMiles');
    const elevationSelect = document.getElementById('sortElevation');
    const mapSelect = document.getElementById('sortMap');
    
    if (!milesSelect || !elevationSelect || !mapSelect) {
        console.error('Sort elements not found');
        return;
    }
    
    sortMiles = milesSelect.value || '';
    sortElevation = elevationSelect.value || '';
    sortMap = mapSelect.value || '';
    
    // showRoutesForDate will rebuild routesToDisplay and then call applySortToRoutes()
    // Pass preserveFilters=true to keep the sort values
    if (selectedDate) {
        showRoutesForDate(selectedDate, true);
    } else {
        console.warn('No date selected, cannot apply sort');
    }
}

function filterRoutes(event) {
    const searchInput = document.getElementById('routeSearch');
    if (searchInput) {
        routeSearchQuery = searchInput.value || '';
        if (selectedDate) {
            // Pass preserveFilters=true to keep the search and sort values
            showRoutesForDate(selectedDate, true);
        }
    }
}

function clearSort() {
    const milesSelect = document.getElementById('sortMiles');
    const elevationSelect = document.getElementById('sortElevation');
    const mapSelect = document.getElementById('sortMap');
    const searchInput = document.getElementById('routeSearch');
    
    if (milesSelect) milesSelect.value = '';
    if (elevationSelect) elevationSelect.value = '';
    if (mapSelect) mapSelect.value = '';
    if (searchInput) searchInput.value = '';
    
    sortMiles = '';
    sortElevation = '';
    sortMap = '';
    routeSearchQuery = '';
    
    // showRoutesForDate will rebuild routesToDisplay and then call applySortToRoutes()
    if (selectedDate) {
        showRoutesForDate(selectedDate);
    }
}

function applySortToRoutes() {
    if (!routesToDisplay || routesToDisplay.length === 0) return;
    
    routesToDisplay.sort((a, b) => {
        // Primary sort: Miles (if selected)
        if (sortMiles) {
            if (sortMiles === 'miles-asc') {
                const diff = a.miles - b.miles;
                if (diff !== 0) return diff;
            } else if (sortMiles === 'miles-desc') {
                const diff = b.miles - a.miles;
                if (diff !== 0) return diff;
            }
        }
        
        // Secondary sort: Elevation (if selected)
        if (sortElevation) {
            if (sortElevation === 'elevation-asc') {
                const diff = a.elevation - b.elevation;
                if (diff !== 0) return diff;
            } else if (sortElevation === 'elevation-desc') {
                const diff = b.elevation - a.elevation;
                if (diff !== 0) return diff;
            }
        }
        
        // Tertiary sort: Map (if selected)
        if (sortMap) {
            if (sortMap === 'map-asc') {
                const diff = a.map.localeCompare(b.map);
                if (diff !== 0) return diff;
            } else if (sortMap === 'map-desc') {
                const diff = b.map.localeCompare(a.map);
                if (diff !== 0) return diff;
            }
        }
        
        // Final tiebreaker: route name
        return a.name.localeCompare(b.name);
    });
}

function selectUserForDate(user, evt) {
    selectedUserForDate = user;
    document.querySelectorAll('#userSelectButtons button').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'white';
        btn.style.color = '#333';
        btn.style.borderColor = '#ddd';
    });
    if (evt && evt.target) {
        evt.target.classList.add('active');
        evt.target.style.background = '#2196F3';
        evt.target.style.color = 'white';
        evt.target.style.borderColor = '#2196F3';
    }
    
    // Refresh the route list when user changes so available routes update
    // This ensures routes that were hidden for the previous user are shown for the new user
    if (selectedDate) {
        showRoutesForDate(selectedDate, true);
    }
}

function addRouteToDate(routeIndex) {
    if (!selectedDate || !selectedUserForDate) {
        alert('Please select a date and user');
        return;
    }
    
    const dateStr = formatDateForStorage(selectedDate);
    const route = routesData.routes[routeIndex];
    
    // Set the date for the selected user
    route.users[selectedUserForDate] = dateStr;
    
    saveUserData();
    updateStats();
    renderCalendar();
    
    // Refresh route list to show the added route
    showRoutesForDate(selectedDate);
}

function removeRouteFromDate(routeIndex, user) {
    if (!confirm('Remove this ride from this date?')) {
        return;
    }
    
    const route = routesData.routes[routeIndex];
    route.users[user] = null;
    
    saveUserData();
    updateStats();
    renderCalendar();
    
    // Refresh route list
    showRoutesForDate(selectedDate);
}

function clearRouteSelection() {
    selectedDate = null;
    selectedRouteIndex = null;
    routesToDisplay = [];
    document.getElementById('selectedDateInfo').style.display = 'none';
    document.getElementById('userSelector').style.display = 'none';
    document.getElementById('sortControls').style.display = 'none';
    document.getElementById('routeList').innerHTML = `
        <p style="text-align: center; color: #999; padding: 40px;">
            Select a date on the calendar to see available routes
        </p>
    `;
}

function formatDateForStorage(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateForDisplay(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function renderCalendar() {
    if (!routesData) {
        console.error('routesData is not loaded in renderCalendar');
        return;
    }
    
    const calendarMonthEl = document.getElementById('calendarMonth');
    const calendarGridEl = document.getElementById('calendarGrid');
    
    if (!calendarMonthEl || !calendarGridEl) {
        console.error('Calendar elements not found:', { calendarMonthEl, calendarGridEl });
        return;
    }
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    calendarMonthEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Get all rides for this month
    const ridesByDate = {};
    routesData.routes.forEach(route => {
        const milesStr = route.length_miles || '0';
        const miles = parseFloat(milesStr.toString().replace(/[^\d.]/g, '')) || 0;
        
        routesData.users.forEach(user => {
            if (selectedUser === 'all' || selectedUser === user) {
                const dateStr = route.users[user];
                if (dateStr) {
                    const date = new Date(dateStr);
                    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                        const day = date.getDate();
                        if (!ridesByDate[day]) {
                            ridesByDate[day] = [];
                        }
                        ridesByDate[day].push({
                            route: route.route,
                            map: route.map,
                            miles: miles,
                            user: user
                        });
                    }
                }
            }
        });
    });
    
    // Build calendar grid
    let calendarHTML = '';
    
    // Day headers
    dayNames.forEach(day => {
        calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarHTML += `<div class="calendar-day other-month"></div>`;
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = formatDateForStorage(date);
        const rides = ridesByDate[day] || [];
        const isToday = new Date().getDate() === day && 
                       new Date().getMonth() === currentMonth && 
                       new Date().getFullYear() === currentYear;
        const isSelected = selectedDate && 
                          selectedDate.getDate() === day && 
                          selectedDate.getMonth() === currentMonth && 
                          selectedDate.getFullYear() === currentYear;
        
        calendarHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" 
                 onclick="selectDate(new Date(${currentYear}, ${currentMonth}, ${day}))">
                <div class="calendar-day-number">${day}</div>
                ${rides.map(ride => `
                    <div class="calendar-ride" 
                         title="${ride.user}: ${ride.map} - ${ride.route} (${ride.miles.toFixed(1)} miles)">
                        ${ride.user}: ${ride.route}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Fill remaining cells
    const totalCells = startingDayOfWeek + daysInMonth;
    const remainingCells = 42 - totalCells;
    for (let i = 0; i < remainingCells; i++) {
        calendarHTML += `<div class="calendar-day other-month"></div>`;
    }
    
    calendarGridEl.innerHTML = calendarHTML;
}

function updateStats() {
    if (!routesData) return;
    
    const statsContainer = document.getElementById('userStats');
    const userTotals = {};
    const goalMiles = routesData.goal_miles;
    const challengeStart = new Date('2025-12-08');
    const challengeEnd = new Date('2025-12-23');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate days elapsed in challenge
    const daysElapsed = Math.max(0, Math.min(16, Math.floor((today - challengeStart) / (1000 * 60 * 60 * 24)) + 1));
    const dailyTarget = 20; // miles per day
    const targetForDaysElapsed = daysElapsed * dailyTarget;
    
    routesData.users.forEach(user => {
        userTotals[user] = 0;
    });
    
    routesData.routes.forEach(route => {
        const milesStr = route.length_miles || '0';
        const miles = parseFloat(milesStr.toString().replace(/[^\d.]/g, '')) || 0;
        routesData.users.forEach(user => {
            if (route.users[user]) {
                const rideDate = new Date(route.users[user]);
                // Only count rides within challenge period
                if (rideDate >= challengeStart && rideDate <= challengeEnd) {
                    userTotals[user] += miles;
                }
            }
        });
    });
    
    statsContainer.innerHTML = routesData.users.map(user => {
        const total = userTotals[user];
        const remaining = Math.max(0, goalMiles - total);
        const progress = (total / goalMiles) * 100;
        const onTrack = total >= targetForDaysElapsed;
        const milesAhead = total - targetForDaysElapsed;
        
        return `
            <div class="stat-card">
                <h3>${user}</h3>
                <div class="progress-info">
                    <strong>${total.toFixed(1)}</strong> / ${goalMiles} miles
                </div>
                <div class="progress-info" style="font-size: 12px; color: #666;">
                    ${daysElapsed > 0 ? `Day ${daysElapsed}/16: ${onTrack ? `✅ On track (+${milesAhead.toFixed(1)} miles)` : `⚠️ Need ${(targetForDaysElapsed - total).toFixed(1)} more miles`}` : 'Challenge starts Dec 8'}
                </div>
                <div class="progress-info" style="color: ${remaining === 0 ? '#4caf50' : '#666'};">
                    ${remaining > 0 ? `${remaining.toFixed(1)} remaining` : '🎉 Goal achieved!'}
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(100, progress)}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function saveUserData() {
    const userData = {
        routes: routesData.routes.map(route => ({
            users: route.users
        }))
    };
    
    // Always save to localStorage as backup
    localStorage.setItem('zwiftUserData', JSON.stringify(userData));
    
    // Save to Firebase if enabled (shared across all users)
    if (typeof firebaseEnabled !== 'undefined' && firebaseEnabled && database) {
        try {
            // Set flag to prevent real-time listener from applying our own save
            isSaving = true;
            console.log('💾 Saving data to Firebase...');
            database.ref('zwiftUserData').set(userData)
                .then(() => {
                    console.log('✅ Data saved to Firebase - all users will see this update');
                    // Reset flag after a short delay to allow save to complete
                    setTimeout(() => {
                        isSaving = false;
                    }, 100);
                })
                .catch((error) => {
                    console.warn('⚠️ Firebase save failed, using localStorage only:', error);
                    isSaving = false; // Reset flag on error
                });
        } catch (error) {
            console.warn('⚠️ Firebase error:', error);
            isSaving = false; // Reset flag on error
        }
    } else {
        console.log('💾 Data saved to localStorage only (Firebase not enabled)');
    }
}

// Helper function to convert Firebase object to array
function firebaseObjectToArray(obj) {
    if (Array.isArray(obj)) {
        console.log('✅ Already an array');
        return obj; // Already an array
    }
    if (obj && typeof obj === 'object') {
        // Firebase stores arrays as objects with numeric keys
        // Convert {0: {...}, 1: {...}} to [{...}, {...}]
        const keys = Object.keys(obj);
        console.log('🔍 Converting object with keys:', keys);
        
        // Sort keys numerically
        const sortedKeys = keys.sort((a, b) => {
            const aNum = parseInt(a);
            const bNum = parseInt(b);
            if (isNaN(aNum) || isNaN(bNum)) return 0;
            return aNum - bNum;
        });
        
        // Check if keys are numeric (Firebase array format)
        if (sortedKeys.length > 0 && sortedKeys.every(key => /^\d+$/.test(key))) {
            const result = sortedKeys.map(key => obj[key]);
            console.log('✅ Converted to array with', result.length, 'items');
            return result;
        } else {
            console.warn('⚠️ Keys are not all numeric:', sortedKeys);
        }
    }
    console.warn('⚠️ Could not convert to array, returning null');
    return null;
}

function loadUserData() {
    // Try Firebase first if enabled (shared data)
    if (typeof firebaseEnabled !== 'undefined' && firebaseEnabled && database) {
        console.log('📥 Loading data from Firebase...');
        database.ref('zwiftUserData').once('value')
            .then((snapshot) => {
                const saved = snapshot.val();
                console.log('📦 Firebase data loaded:', saved ? 'data found' : 'no data');
                
                if (saved && routesData) {
                    console.log('🔍 Checking saved.routes:', {
                        exists: !!saved.routes,
                        type: typeof saved.routes,
                        isArray: Array.isArray(saved.routes),
                        keys: saved.routes ? Object.keys(saved.routes).slice(0, 10) : 'none'
                    });
                    
                    // Firebase stores arrays as objects - convert if needed
                    if (saved.routes) {
                        if (!Array.isArray(saved.routes)) {
                            console.log('🔄 Converting Firebase object to array...');
                            const converted = firebaseObjectToArray(saved.routes);
                            if (converted && Array.isArray(converted)) {
                                saved.routes = converted;
                                console.log('✅ Conversion successful, routes is now array with', saved.routes.length, 'items');
                            } else {
                                console.error('❌ Conversion failed! Routes structure:', saved.routes);
                                console.log('ℹ️ Falling back to localStorage...');
                                loadFromLocalStorage();
                                return;
                            }
                        } else {
                            console.log('✅ Routes is already an array');
                        }
                    }
                    
                    // Validate structure before applying
                    if (saved.routes && Array.isArray(saved.routes) && saved.routes.length > 0) {
                        console.log('✅ Valid Firebase data structure, applying...');
                        applyUserData(saved);
                    } else {
                        console.warn('⚠️ Invalid or empty Firebase data structure:', {
                            hasRoutes: !!saved.routes,
                            isArray: Array.isArray(saved.routes),
                            length: saved.routes ? saved.routes.length : 0,
                            type: typeof saved.routes
                        });
                        console.log('ℹ️ Falling back to localStorage...');
                        loadFromLocalStorage();
                    }
                } else {
                    // Fallback to localStorage if Firebase has no data
                    console.log('ℹ️ No Firebase data, loading from localStorage...');
                    loadFromLocalStorage();
                }
            })
            .catch((error) => {
                console.warn('⚠️ Firebase load failed, using localStorage:', error);
                loadFromLocalStorage();
            });
    } else {
        // Use localStorage if Firebase not enabled
        console.log('ℹ️ Firebase not enabled, loading from localStorage...');
        loadFromLocalStorage();
    }
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('zwiftUserData');
    if (saved && routesData) {
        try {
            const userData = JSON.parse(saved);
            applyUserData(userData);
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

function applyUserData(userData) {
    // Early return with validation
    if (!routesData) {
        console.warn('⚠️ Cannot apply user data: routesData not loaded yet');
        return;
    }
    
    if (!userData) {
        console.warn('⚠️ Cannot apply user data: userData is null/undefined');
        return;
    }
    
    // Validate that routes exists and is an array - CRITICAL CHECK
    if (!userData.hasOwnProperty('routes')) {
        console.warn('⚠️ User data has no routes property, ignoring:', userData);
        return;
    }
    
    if (!Array.isArray(userData.routes)) {
        console.error('❌ User data routes is not an array:', typeof userData.routes, userData.routes);
        console.warn('⚠️ This might be corrupted Firebase data. Consider clearing Firebase data.');
        return;
    }
    
    // Additional safety check - ensure routes array has expected structure
    if (userData.routes.length === 0) {
        console.log('ℹ️ User data has empty routes array, skipping');
        return;
    }
    
    // Apply the data - now safe to use forEach
    try {
        // First, clear ALL route assignments to start fresh
        routesData.routes.forEach(route => {
            routesData.users.forEach(user => {
                route.users[user] = null;
            });
        });
        
        // Then, only apply valid date assignments from saved data
        userData.routes.forEach((savedRoute, index) => {
            if (routesData.routes[index] && savedRoute && savedRoute.users && typeof savedRoute.users === 'object') {
                Object.keys(savedRoute.users).forEach(user => {
                    // Only accept valid date strings, ignore booleans or invalid data
                    const dateValue = savedRoute.users[user];
                    if (dateValue && typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        routesData.routes[index].users[user] = dateValue;
                    }
                    // If not valid, leave it as null (already cleared above)
                });
            }
        });
        renderCalendar();
        updateStats();
    } catch (error) {
        console.error('❌ Error applying user data:', error);
        console.warn('⚠️ Falling back to localStorage');
        loadFromLocalStorage();
    }
}

// Function to clear all data (localStorage and Firebase)
function clearAllData() {
    if (confirm('Clear all saved ride data? This cannot be undone.')) {
        localStorage.removeItem('zwiftUserData');
        
        // Clear Firebase if enabled
        if (typeof firebaseEnabled !== 'undefined' && firebaseEnabled && database) {
            console.log('🗑️ Clearing Firebase data...');
            database.ref('zwiftUserData').remove()
                .then(() => {
                    console.log('✅ Firebase data cleared');
                    location.reload();
                })
                .catch((error) => {
                    console.warn('⚠️ Firebase clear failed:', error);
                    location.reload();
                });
        } else {
            location.reload();
        }
    }
}

// Function to fix corrupted Firebase data by re-saving current localStorage data
function fixFirebaseData() {
    if (typeof firebaseEnabled !== 'undefined' && firebaseEnabled && database && routesData) {
        console.log('🔧 Fixing Firebase data by re-saving from localStorage...');
        const localData = localStorage.getItem('zwiftUserData');
        if (localData) {
            try {
                const userData = JSON.parse(localData);
                if (userData.routes && Array.isArray(userData.routes)) {
                    database.ref('zwiftUserData').set(userData)
                        .then(() => {
                            console.log('✅ Firebase data fixed! Reloading page...');
                            alert('Firebase data has been fixed! The page will reload.');
                            location.reload();
                        })
                        .catch((error) => {
                            console.error('❌ Failed to fix Firebase data:', error);
                            alert('Failed to fix Firebase data. Check console for details.');
                        });
                } else {
                    alert('Local data is also corrupted. Please clear all data and start fresh.');
                }
            } catch (e) {
                console.error('❌ Error parsing localStorage data:', e);
                alert('Error reading local data. Please clear all data and start fresh.');
            }
        } else {
            // No local data, just clear Firebase and start fresh
            database.ref('zwiftUserData').remove()
                .then(() => {
                    console.log('✅ Cleared corrupted Firebase data');
                    alert('Cleared corrupted Firebase data. You can now add routes and they will sync.');
                })
                .catch((error) => {
                    console.error('❌ Failed to clear Firebase data:', error);
                });
        }
    } else {
        alert('Firebase is not enabled. This function only works with Firebase.');
    }
}

// Function to inspect Firebase data structure
function inspectFirebaseData() {
    if (typeof firebaseEnabled !== 'undefined' && firebaseEnabled && database) {
        database.ref('zwiftUserData').once('value')
            .then((snapshot) => {
                const saved = snapshot.val();
                console.log('📊 Firebase Data Structure:');
                console.log('Full data:', saved);
                if (saved && saved.routes) {
                    console.log('Routes type:', typeof saved.routes);
                    console.log('Is array:', Array.isArray(saved.routes));
                    console.log('Routes keys:', saved.routes ? Object.keys(saved.routes) : 'none');
                    console.log('First few keys:', saved.routes ? Object.keys(saved.routes).slice(0, 5) : 'none');
                }
            })
            .catch((error) => {
                console.error('❌ Error inspecting Firebase:', error);
            });
    } else {
        console.log('Firebase not enabled');
    }
}

// Function to completely wipe all data (Firebase + localStorage)
function wipeAllData() {
    console.log('🗑️ Wiping ALL data (Firebase + localStorage)...');
    
    // Clear localStorage
    localStorage.removeItem('zwiftUserData');
    console.log('✅ localStorage cleared');
    
    // Clear Firebase if enabled
    if (typeof firebaseEnabled !== 'undefined' && firebaseEnabled && database) {
        database.ref('zwiftUserData').remove()
            .then(() => {
                console.log('✅ Firebase data cleared');
                console.log('🔄 Reloading page...');
                alert('All data wiped! The page will reload.');
                location.reload();
            })
            .catch((error) => {
                console.error('❌ Failed to clear Firebase:', error);
                alert('LocalStorage cleared, but Firebase clear failed. Reloading anyway...');
                location.reload();
            });
    } else {
        console.log('ℹ️ Firebase not enabled, only localStorage cleared');
        alert('All local data cleared! The page will reload.');
        location.reload();
    }
}

// Make functions available globally for console debugging
window.fixFirebaseData = fixFirebaseData;
window.inspectFirebaseData = inspectFirebaseData;
window.wipeAllData = wipeAllData;
window.clearFirebaseData = function() {
    if (typeof firebaseEnabled !== 'undefined' && firebaseEnabled && database) {
        if (confirm('Clear all Firebase data? This will remove all shared calendar entries.')) {
            database.ref('zwiftUserData').remove()
                .then(() => {
                    console.log('✅ Firebase data cleared');
                    alert('Firebase data cleared. Reload the page.');
                    location.reload();
                })
                .catch((error) => {
                    console.error('❌ Failed to clear:', error);
                });
        }
    }
};
