const fs = require('fs');
const path = require('path');

/**
 * THE FRACTAL KERNEL v2.0 (Hierarchical Multi-Tier Discovery)
 *
 * Supports Parent -> Child -> Grandchild discovery.
 * Auto-resolves nested basePaths and builds traceable lineage breadcrumbs:
 * e.g. 'admin.media.transformations' -> /api/admin/media/transform
 */
class Kernel {
    constructor() {
        this.features = new Map(); // lineage/id -> feature object
        this.app = null;
        this.loaded = false;
    }

    async boot(app, featuresDir = './features') {
        console.log('🚀 [Kernel] Booting Fractal Kernel v2.0 (Multi-Tier)...');
        this.app = app;

        const absFeaturesDir = path.resolve(__dirname, featuresDir);

        if (!fs.existsSync(absFeaturesDir)) {
            console.error(`❌ [Kernel] Features directory not found: ${absFeaturesDir}`);
            return;
        }

        // Phase 1 — Recursive Multi-Tier Discovery
        this.discoverFeatures(absFeaturesDir);
        console.log(`🔍 [Kernel] Discovered ${this.features.size} feature slice(s).`);

        // Phase 2 — Mount features ordered by lineage depth
        const sortedFeatures = Array.from(this.features.values()).sort(
            (a, b) => (a.lineage.split('.').length) - (b.lineage.split('.').length)
        );

        for (const feature of sortedFeatures) {
            await this.mountFeature(feature);
        }

        // Register system diagnostics endpoint
        this.registerDiagnostics();

        this.loaded = true;
        console.log(`✅ [Kernel] Ready. ${this.features.size} active slice(s).\n`);
    }

    /**
     * Recursive discovery traversing parent, child, and grandchild folders.
     */
    discoverFeatures(currentPath, parentLineage = '', parentBasePath = '') {
        if (!fs.existsSync(currentPath)) return;

        const manifestPath = path.join(currentPath, 'feature.manifest.json');
        let currentFeature = null;

        if (fs.existsSync(manifestPath)) {
            try {
                const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

                if (!manifest.id || manifest.basePath === undefined) {
                    console.warn(`⚠️  [Kernel] Skipping manifest at ${currentPath}: missing id or basePath`);
                    return;
                }

                if (manifest.enabled === false) {
                    console.log(`⏭️  [Kernel] Skipping disabled feature: ${manifest.id}`);
                    return;
                }

                // Compute lineage & inherited basePath
                const lineage = parentLineage ? `${parentLineage}.${manifest.id}` : manifest.id;
                
                // If basePath starts with '/', it can be absolute or relative to parent
                let computedBasePath = manifest.basePath;
                if (parentBasePath && !manifest.basePath.startsWith(parentBasePath)) {
                    computedBasePath = path.posix.join(parentBasePath, manifest.basePath);
                }

                currentFeature = {
                    ...manifest,
                    lineage,
                    basePath: computedBasePath,
                    dirPath: currentPath,
                    loaded: false
                };

                this.features.set(lineage, currentFeature);
            } catch (e) {
                console.error(`❌ [Kernel] Could not parse manifest at ${currentPath}: ${e.message}`);
                return;
            }
        }

        // Recursively inspect child directories (including children/ or subdirectories)
        const IGNORE = ['node_modules', '.git', '_example', '_template', 'temp', '.DS_Store'];
        let entries;

        try {
            entries = fs.readdirSync(currentPath, { withFileTypes: true });
        } catch (e) {
            console.error(`❌ [Kernel] Cannot read directory ${currentPath}: ${e.message}`);
            return;
        }

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            if (IGNORE.includes(entry.name)) continue;

            const nextParentLineage = currentFeature ? currentFeature.lineage : parentLineage;
            const nextParentBasePath = currentFeature ? currentFeature.basePath : parentBasePath;

            this.discoverFeatures(
                path.join(currentPath, entry.name),
                nextParentLineage,
                nextParentBasePath
            );
        }
    }

    async mountFeature(feature) {
        try {
            if (feature.routes) {
                const routePath = path.join(feature.dirPath, feature.routes);
                if (fs.existsSync(routePath)) {
                    const router = require(routePath);
                    this.app.use(feature.basePath, router);
                    const tierLabel = feature.lineage.split('.').length === 1 
                        ? '[Parent]' 
                        : (feature.lineage.split('.').length === 2 ? '[Child]' : '[Grandchild]');
                    console.log(`  🔌 ${tierLabel} ${feature.lineage} (${feature.name}) → ${feature.basePath}`);
                } else {
                    console.warn(`  ⚠️  Routes file not found for ${feature.lineage}: ${routePath}`);
                }
            }

            if (feature.boot) {
                const bootPath = path.join(feature.dirPath, feature.boot);
                if (fs.existsSync(bootPath)) {
                    const bootFn = require(bootPath);
                    if (typeof bootFn === 'function') await bootFn(this.app, this);
                    else if (typeof bootFn.init === 'function') await bootFn.init(this.app, this);
                }
            }

            feature.loaded = true;
        } catch (error) {
            console.error(`  ❌ Failed to mount ${feature.lineage}: ${error.message}`);
        }
    }

    registerDiagnostics() {
        if (!this.app) return;
        this.app.get('/api/kernel/tree', (req, res) => {
            const list = Array.from(this.features.values()).map(f => ({
                id: f.id,
                name: f.name,
                lineage: f.lineage,
                tier: f.lineage.split('.').length === 1 ? 'parent' : (f.lineage.split('.').length === 2 ? 'child' : 'grandchild'),
                basePath: f.basePath,
                version: f.version,
                loaded: f.loaded
            }));
            res.json({ count: list.length, slices: list });
        });
    }

    getAllFeatures() {
        return Array.from(this.features.values());
    }

    getFeature(lineageOrId) {
        return this.features.get(lineageOrId);
    }
}

module.exports = new Kernel();
