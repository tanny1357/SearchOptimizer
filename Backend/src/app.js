// In your app.js

import express from express
const app = express();

// ... other middleware (cors, bodyParser, etc.)

const mainRoutes = require('./routes/index');

// Mount all routes under the /api path
app.use('/api', mainRoutes);

// ... error handling and server start logic