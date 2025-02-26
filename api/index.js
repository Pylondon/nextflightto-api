// index.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET;

let token = null;
let tokenExpiry = 0;

// Token management
async function getAmadeusToken() {
  if (token && tokenExpiry > Date.now()) return token;
  
  const response = await axios.post(
    'https://test.api.amadeus.com/v1/security/oauth2/token',
    `grant_type=client_credentials&client_id=${AMADEUS_API_KEY}&client_secret=${AMADEUS_API_SECRET}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  
  token = response.data.access_token;
  tokenExpiry = Date.now() + (response.data.expires_in * 1000);
  return token;
}

// Flight search endpoint
app.get('/api/flights', async (req, res) => {
  try {
    const { from, to, timeRange } = req.query;
    
    // Calculate minimum departure time based on timeRange (in hours)
    const minDepartureTime = new Date();
    minDepartureTime.setHours(minDepartureTime.getHours() + parseFloat(timeRange));
    
    // Format date for Amadeus API (YYYY-MM-DD)
    const formattedDate = minDepartureTime.toISOString().split('T')[0];
    
    // Get access token
    const token = await getAmadeusToken();
    
    // Call Amadeus API
    const flightResponse = await axios.get(
      'https://test.api.amadeus.com/v2/shopping/flight-offers',
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          originLocationCode: from,
          destinationLocationCode: to,
          departureDate: formattedDate,
          adults: 1,
          currencyCode: 'USD',
          max: 20
        }
      }
    );
    
    res.json(flightResponse.data);
  } catch (error) {
    console.error('Error fetching flights:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch flights' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
