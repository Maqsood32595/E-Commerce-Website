/**
 * ==============================================================================
 * PIET (Persistent In-RAM Ephemeral Twin) Dynamic Layer with Switch Flag
 * Environment Toggle: Set PIET_ENABLED=false to bypass tests in fast CI/CD
 * ==============================================================================
 */

const path = require('path');
const kernel = require(path.resolve(__dirname, '../../server/kernel'));
const db = require(path.resolve(__dirname, '../../server/db'));

async function runPiet() {
    if (process.env.PIET_ENABLED === 'false') {
        console.log("⏸️  [PIET Layer] PIET testing has been toggled OFF via PIET_ENABLED=false. Skipping suite.");
        process.exit(0);
    }

    console.log("⚡ [PIET Layer] Running Active Zero-Mock Falsification Suite...");
    require('./piet_master');
}

runPiet();
