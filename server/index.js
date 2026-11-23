const express = require('express');
const path = require('path');
const kernel = require('./kernel');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve client storefront
app.use(express.static(path.resolve(__dirname, '../client')));

// Boot the Fractal Kernel
async function startServer() {
    await kernel.boot(app, './features');

    app.get('/', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../client/index.html'));
    });

    app.listen(PORT, () => {
        console.log(`\n=======================================================`);
        console.log(`🚀 Alo Luxury E-Commerce Server Live on http://localhost:${PORT}`);
        console.log(`   Indian Athleisure Color Suite & Multi-Tier Slices Active`);
        console.log(`=======================================================\n`);
    });
}

startServer();
