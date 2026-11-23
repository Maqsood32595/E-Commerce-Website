class TransformationService {
    getPresets(originalUrl) {
        return {
            original: originalUrl,
            hero: `${originalUrl}?w=1200&h=1600&fmt=webp&q=85`,
            catalogCard: `${originalUrl}?w=600&h=800&fmt=webp&q=80`,
            thumbnail: `${originalUrl}?w=120&h=160&fmt=webp&q=75`,
            swatch: `${originalUrl}?w=64&h=64&fmt=webp&q=70`
        };
    }
}

module.exports = new TransformationService();
