const express = require('express');
const kernel = require('./server/kernel');

const app = express();
app.use(express.json());

async function runTest() {
    await kernel.boot(app, './features');
    console.log('--- ALL REGISTERED SLICES ---');
    const slices = kernel.getAllFeatures();
    for (const s of slices) {
        console.log(`Slice: ${s.lineage} -> BasePath: ${s.basePath} -> Loaded: ${s.loaded}`);
    }
}
runTest();
