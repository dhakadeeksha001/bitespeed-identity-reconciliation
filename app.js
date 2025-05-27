const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const identifyRoute = require('./routes/identify');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Routes
app.use('/identify', identifyRoute);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
