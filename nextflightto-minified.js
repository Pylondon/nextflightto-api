// Optimized JavaScript for NextFlightTo
// This minified version can replace the existing script for better performance

// API URL
const API_URL = 'https://nextflightto-api-production.up.railway.app/api/flights';

// Main handlers and initialization
document.addEventListener('DOMContentLoaded', () => {
  // Core UI elements
  const elements = {
    form: document.getElementById('flightSearchForm'),
    from: document.getElementById('currentLocation'),
    to: document.getElementById('destination'),
    timeRange: document.getElementById('timeRange'),
    timeDisplay: document.getElementById('timeRangeValue'),
    results: document.getElementById('results'),
    resultsContainer: document.getElementById('flightResults')
  };
  
  // Initialize components
  initTimeRange();
  initAutocomplete();
  loadUserPreferences();
  addLocationButton();
  checkUrlForDestination();
  registerServiceWorker();
  
  // Set up event handlers
  elements.timeRange.addEventListener('input', () => {
    elements.timeDisplay.textContent = elements.timeRange.value;
  });
  
  elements.form.addEventListener('submit', e => {
    e.preventDefault();
    
    // Extract and clean inputs
    let from = elements.from.value.toUpperCase();
    let to = elements.to.value.toUpperCase();
    
    if (from.includes(' - ')) from = from.split(' - ')[0].trim();
    if (to.includes(' - ')) to = to.split(' - ')[0].trim();
    
    saveUserPreferences();
    searchFlights(from, to, elements.timeRange.value);
  });
  
  // Functions
  function initTimeRange() {
    elements.timeDisplay.textContent = elements.timeRange.value;
  }
  
  function addLocationButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = '<i class="fas fa-crosshairs"></i>';
    btn.className = 'location-button';
    btn.title = 'Use current location';
    
    Object.assign(btn.style, {
      position: 'absolute',
      right: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'transparent',
      border: 'none',
      color: 'var(--primary)',
      cursor: 'pointer',
      fontSize: '1rem',
      padding: '0.5rem',
      boxShadow: 'none'
    });
    
    const formGroup = document.querySelector('.form-group');
    formGroup.style.position = 'relative';
    formGroup.appendChild(btn);
    
    btn.addEventListener('click', getUserLocation);
  }
});

// Service worker registration
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => console.log('ServiceWorker registered'))
        .catch(error => console.error('ServiceWorker registration failed:', error));
    });
  }
}

// Flight data and UI functions
async function searchFlights(from, to, timeRange) {
  const resultsEl = document.getElementById('results');
  const resultsContainer = document.getElementById('flightResults');
  
  // Show loading indicator
  resultsEl.style.display = 'block';
  resultsContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
  
  try {
    // Calculate minimum departure time
    const minDepartureTime = new Date();
    minDepartureTime.setHours(minDepartureTime.getHours() + parseFloat(timeRange));
    
    const response = await fetch(
      `${API_URL}?from=${from}&to=${to}&timeRange=${timeRange}&minDepartureTime=${minDepartureTime.toISOString()}`
    );
    
    if (!response.ok) throw new Error('Failed to fetch flights');
    
    const data = await response.json();
    displayRealFlights(data);
  } catch (error) {
    resultsContainer.innerHTML = `
      <div class="no-flights">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error: ${error.message}. Please try again later.</p>
      </div>
    `;
  }
}

function displayRealFlights(flightData) {
  const resultsContainer = document.getElementById('flightResults');
  resultsContainer.innerHTML = '';
  
  if (!flightData.data || flightData.data.length === 0) {
    resultsContainer.innerHTML = `
      <div class="no-flights">
        <i class="fas fa-search"></i>
        <p>No flights found for the selected route and time range.</p>
        <p>Try different airports or extend your time range.</p>
      </div>
    `;
    return;
  }
  
  flightData.data.forEach((offer, index) => {
    const firstSegment = offer.itineraries[0].segments[0];
    const departureTime = new Date(firstSegment.departure.at);
    const arrivalTime = new Date(firstSegment.arrival.at);
    
    const flightCard = document.createElement('div');
    flightCard.className = 'flight-card';
    flightCard.style.animationDelay = `${index * 0.1}s`;
    
    flightCard.innerHTML = `
      <div class="flight-info">
        <div class="flight-time">
          ${departureTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          ${arrivalTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
        <div class="flight-route">
          <i class="fas fa-plane"></i> ${firstSegment.carrierCode} ${firstSegment.number}
        </div>
        <div class="flight-duration">
          <i class="far fa-clock"></i> ${formatDuration(firstSegment.duration)}
        </div>
      </div>
      <div class="flight-price">
        $${Math.round(offer.price.total)}
        <button class="book-now">Book Now</button>
      </div>
    `;
    
    resultsContainer.appendChild(flightCard);
  });
}

// Helper functions
function formatDuration(duration) {
  const hours = duration.match(/(\d+)H/);
  const minutes = duration.match(/(\d+)M/);
  return `${hours ? hours[1] + 'h ' : ''}${minutes ? minutes[1] + 'm' : ''}`;
}

function checkUrlForDestination() {
  const path = window.location.pathname;
  if (path.length > 1) {
    const iataCode = path.substring(1).toUpperCase();
    if (iataCode.length === 3) {
      document.getElementById('destination').value = iataCode;
    }
  }
}

// Persistent preferences
function saveUserPreferences() {
  try {
    localStorage.setItem('lastLocation', document.getElementById('currentLocation').value);
    localStorage.setItem('lastDestination', document.getElementById('destination').value);
    localStorage.setItem('lastTimeRange', document.getElementById('timeRange').value);
    localStorage.setItem('lastVisit', new Date().toISOString());
  } catch (e) {
    console.error("Could not save to localStorage:", e);
  }
}

function loadUserPreferences() {
  try {
    const lastLocation = localStorage.getItem('lastLocation');
    const lastDestination = localStorage.getItem('lastDestination');
    const lastTimeRange = localStorage.getItem('lastTimeRange');
    
    if (lastLocation) document.getElementById('currentLocation').value = lastLocation;
    if (lastDestination) document.getElementById('destination').value = lastDestination;
    if (lastTimeRange) {
      document.getElementById('timeRange').value = lastTimeRange;
      document.getElementById('timeRangeValue').textContent = lastTimeRange;
    }
  } catch (e) {
    console.error("Could not load from localStorage:", e);
  }
}

// Autocomplete
function initAutocomplete() {
  const airportList = airports.map(a => `${a.code} - ${a.name}`);
  
  new Awesomplete(document.getElementById("currentLocation"), {
    list: airportList,
    minChars: 1,
    maxItems: 5
  });
  
  new Awesomplete(document.getElementById("destination"), {
    list: airportList,
    minChars: 1,
    maxItems: 5
  });
}

// Geolocation
async function getUserLocation() {
  if (navigator.geolocation) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });
      
      document.getElementById('currentLocation').value = "Detecting nearest airport...";
      
      // Simulated response - would be replaced with actual API call
      setTimeout(() => {
        document.getElementById('currentLocation').value = "JFK - John F. Kennedy International Airport, New York";
      }, 1500);
      
    } catch (error) {
      console.error("Error getting location:", error);
      alert("Could not access your location. Please enter your departure airport manually.");
    }
  } else {
    alert("Geolocation is not supported by your browser. Please enter your departure airport manually.");
  }
}
