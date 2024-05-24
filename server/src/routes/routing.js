const express = require('express');
const axios = require('axios');
const path = require('path')
const Memcached = require('memcached');

const router = express.Router();
const memcached = new Memcached('localhost:11211'); // Connect to Memcached server


require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Turn Endpoint
router.get('/turn/:TL/:BR.png', async (req, res) => {

  try {
    // Retrieve the TL and BR coordinates 
    const [latTL, lonTL] = req.params.TL.split(',').map(Number);
    const [latBR, lonBR] = req.params.BR.split(',').map(Number);

    // Construct the center longitude and center latitude from the TL and BR coordinates 
    const centerLon = (lonTL + lonBR) / 2;
    const centerLat = (latTL + latBR) / 2;

    // Set zoom level and image URL 
    const zoom = 16; // Might change the zoom level later on 
    const imageUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${centerLon},${centerLat},${zoom}/100x100?access_token=${process.env.api_key}`;

    // Check if the image URL is cached
    memcached.get(imageUrl, (err, imageBuffer) => {
      if (err) {
        // Handle Memcached error
        console.error('Memcached error:', err);
        return res.status(500).send('Internal Server Error');
      }

      if (imageBuffer) {
        // If image is found in cache, send it
        res.setHeader('Content-Type', 'image/png');
        res.send(imageBuffer);
      } else {
        // If image is not found in cache, fetch it from API
        axios.get(imageUrl, { responseType: 'arraybuffer' })
          .then(response => {
            const imageBuffer = Buffer.from(response.data, 'binary');
            // Cache the image for future requests
            memcached.set(imageUrl, imageBuffer, 3600, err => {
              if (err) {
                // Handle Memcached error
                console.error('Memcached error:', err);
              }
            });
            // Send the png image 
            res.setHeader('Content-Type', 'image/png');
            res.send(imageBuffer);
          })
          .catch(error => {
            console.error('Error fetching image:', error);
            res.status(500).send('Internal Server Error');
          });
      }
    });
  } catch (error) {
    
    console.error('Error processing request:', error);
    res.status(200).send('Internal Server Error');
  }
});


// Route route 
router.post('/api/route', async (req, res) => {

  try {

    const { source, destination } = req.body;

    const url = `https://router.project-osrm.org/route/v1/driving/${source.lon},${source.lat};${destination.lon},${destination.lat}?steps=true`;

    // Check if the route is cached
    memcached.get(url, (err, cachedRoute) => {
      if (err) {
        // Handle Memcached error
        console.error('Memcached error:', err);
        return res.status(500).send('Internal Server Error');
      }

      if (cachedRoute) {
        // If route is found in cache, send it
        res.json(cachedRoute);
      } else {
        // If route is not found in cache, fetch it from API
        axios.get(url)
          .then(response => {
            const routes = response.data.routes[0];
            const steps = routes.legs.flatMap(leg => leg.steps);

            const formattedRoute = steps.map(step => ({
              description: step.name,
              coordinates: {
                lat: step.intersections[0].location[1],
                lon: step.intersections[0].location[0]
              },
              distance: step.distance
            }));

            // Cache the route for future requests
            memcached.set(url, formattedRoute, 3600, err => {
              if (err) {
                // Handle Memcached error
                console.error('Memcached error:', err);
              }
            });
            res.json(formattedRoute);
          })
          .catch(error => {
            console.error('Error fetching route:', error);
            res.status(500).send('Internal Server Error');
          });
      }
    });
  } catch (error) {
    
    console.error('Error processing request:', error);
    res.status(200).send('Internal Server Error');
  }
});


module.exports = router;