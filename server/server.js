const express = require('express');

const mapRouter = require('./src/routes/map');
const userRouter = require('./src/routes/user');
const routeRouter = require('./src/routes/routing')

const { connectToMongoDB, closeConnection } = require('./src/configs/mongo.config');

const app = express();
const port = 8000;

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));


async function startServer() {
  
  try {

    // Keep this commented out for now 
    await connectToMongoDB(); 

    // Also keep this commented our for now 
    app.use('/', mapRouter);
    app.use('/', routeRouter);
    app.use('/', userRouter);

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1); 
  }
}

startServer();

