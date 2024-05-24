const express = require('express');
const multer = require('multer');

const pool = require('../configs/postgres.config');
const { createProxyMiddleware } = require('http-proxy-middleware');


const router = express.Router();
const upload = multer();


// Proxy Route to our Tile Server
router.use('/tiles/:z/:x/:y.png', createProxyMiddleware({

  target: 'http://loadbalancer-tile-server:80',
  changeOrigin: true,
  pathRewrite: (path, req) => {
    const [z, x, y] = path.replace('/tiles/', '').replace('.png', '').split('/');
    const roundedZ = Math.ceil(z);
    const roundedX = Math.ceil(x);
    const roundedY = Math.ceil(y);
    return `/tile/${roundedZ}/${roundedX}/${roundedY}.png`;
  },
  onProxyRes: function (proxyRes, req, res) {
    console.log(`Response status: ${proxyRes.statusCode}`);
    console.log(`Response headers: ${JSON.stringify(proxyRes.headers)}`);
  }
}));


// Convert Endpoint
router.post('/api/convert', (req, res) => {

  const { lat, long, zoom } = req.body;

  const latitude = lat;
  const longitude = long;
  const lat_rad = latitude * Math.PI / 180;

  const n = Math.pow(2, zoom);
  const x_tile = n * ((longitude + 180) / 360);
  const y_tile = n * (1 - (Math.log(Math.tan(lat_rad) + (1 / Math.cos(lat_rad))) / Math.PI)) / 2;
  
  res.json({
    x_tile: x_tile,
    y_tile: y_tile
  });
});


// Search Endpoint
router.post('/api/search', upload.none(), async (req, res) => {

  const { bbox, onlyInBox, searchTerm } = req.body;

  let housenumber = null;
  let street = null;
  let city = null;

  // Parse Search Term
  const location = searchTerm.split(',');

  // Split the first part into house number and street
  let parts = location[0].split(' ');
  if (/\d/.test(parts[0])) {
      // If the first part contains a number, assume it's the house number
      housenumber = parts.shift();
      street = parts.join(' ');
  } else {
      // If the first part doesn't contain a number, assume it's part of the street
      housenumber = null;
      street = location[0].trim();
  }

  if (location[1]) {
      city = location[1].trim();
  } else {
      city = street;  // Use the value of street as value of city as a fallback
  }

  const searchConditions = [];
  if (searchTerm) {
      searchConditions.push(`name ILIKE '%${searchTerm}%'`);
  }
  if (housenumber) {
      searchConditions.push(`"addr:housenumber" ILIKE '%${housenumber}%'`);
  }
  if (street) {
      searchConditions.push(`tags->'addr:street' ILIKE '%${street}%'`);
  }
  if (city) {
      searchConditions.push(`tags->'addr:city' ILIKE '%${city}%'`);
  }

  const searchQuery = searchConditions.join(' OR ');

  try {
      let query = `
      SELECT name,
      ST_X(ST_Centroid(ST_Transform(way, 4326))) AS lon,
      ST_Y(ST_Centroid(ST_Transform(way, 4326))) AS lat,
      ST_XMin(ST_Extent(ST_Transform(way, 4326))) AS minLon,
      ST_YMin(ST_Extent(ST_Transform(way, 4326))) AS minLat,
      ST_XMax(ST_Extent(ST_Transform(way, 4326))) AS maxLon,
      ST_YMax(ST_Extent(ST_Transform(way, 4326))) AS maxLat
      FROM planet_osm_point
      WHERE `;

      if (onlyInBox == true) {

          query += `ST_Intersects(ST_MakeEnvelope(${bbox.minLon}, ${bbox.minLat}, ${bbox.maxLon}, ${bbox.maxLat}, 4326), way) AND (${searchQuery}) `;
          query += `GROUP BY
          name,
          lon,
          lat
          LIMIT 30;`
      }
      else {
          query += `${searchQuery} `;
          query += `GROUP BY
          name,
          lon,
          lat
          LIMIT 30;`
      }

      const { rows }  = await pool.query(query);
 
      let formattedResults = rows
        .filter(row => row.name !== null) // Filter out rows with null name
        .map(row => ({
          name: row.name,
          coordinates: { lat: row.lat, lon: row.lon },
          bbox: {
              minLat: row.minlat,
              minLon: row.minlon,
              maxLat: row.maxlat,
              maxLon: row.maxlon
          }
      }));

      if (rows.length < 30) {
          query = `
          SELECT name,
          ST_X(ST_Centroid(ST_Transform(way, 4326))) AS lon,
          ST_Y(ST_Centroid(ST_Transform(way, 4326))) AS lat,
          ST_XMin(ST_Extent(ST_Transform(way, 4326))) AS minLon,
          ST_YMin(ST_Extent(ST_Transform(way, 4326))) AS minLat,
          ST_XMax(ST_Extent(ST_Transform(way, 4326))) AS maxLon,
          ST_YMax(ST_Extent(ST_Transform(way, 4326))) AS maxLat
          FROM planet_osm_line
          WHERE `;

          if (onlyInBox == true) {
              query += `ST_Intersects(ST_MakeEnvelope(${bbox.minLon}, ${bbox.minLat}, ${bbox.maxLon}, ${bbox.maxLat}, 4326), way) AND (${searchQuery}) `;
              query += `GROUP BY
              name,
              lon,
              lat
              LIMIT 30;`
          }
          else {
              query += `${searchQuery} `;
              query += `GROUP BY
              name,
              lon,
              lat
              LIMIT 30;`
          }

          const { rows }  = await pool.query(query);
   
          formattedResults = formattedResults.concat(rows
            .filter(row => row.name !== null) // Filter out rows with null name
            .map(row => ({
              name: row.name,
              coordinates: { lat: row.lat, lon: row.lon },
              bbox: {
                  minLat: row.minlat,
                  minLon: row.minlon,
                  maxLat: row.maxlat,
                  maxLon: row.maxlon
                }
              }))
              .filter(result => result.name !== null)
          );
      }
      res.status(200).json(formattedResults);
  }
  catch (error) {
      console.error('Error searching:', error);
      res.status(200).json({ status: 'ERROR', message: 'Failed to process search query' });
  }
});


// Addrees Endpoint
router.post('/api/address', async (req, res) => {

  const { lat, lon } = req.body;

  try {

      // Query PostGIS database to find the address
      const query = `
      SELECT tags, "addr:housenumber"
      FROM planet_osm_polygon
      WHERE tags->'addr:street' != ''
      ORDER BY ST_Transform(way, 4326) <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
      LIMIT 1;
      `;

      const result = await pool.query(query, [lon, lat]);

      if (result.rows.length === 0) {
          res.status(200).json({ error: 'No building found at the specified location' });
          return;
      }

      // Extract address information from the tags column
      const tags = result.rows[0].tags;

      const tagsObject = JSON.parse('{' + tags.replace(/=>/g, ':') + '}');

      const address = {
          number: tagsObject['addr:housenumber'] || '',
          street: tagsObject['addr:street'] || '',
          city: tagsObject['addr:city'] || '',
          state: tagsObject['addr:state'] || '',
          country: 'US',
      };
      res.status(200).json(address)
      
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(200).json({ error: 'Internal server error' });
  }
});


module.exports = router;
