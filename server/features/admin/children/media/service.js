const db = require('../../../../db');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

class MediaService {
    constructor() {
        this.bucketName = process.env.GCS_BUCKET_NAME || 'alo-ecommerce-media-515620';
        this.storage = new Storage({
            projectId: process.env.GCP_PROJECT_ID || 'e-commerce-website-515620'
        });
    }

    /**
     * Request an upload ticket.
     * Generates a signed upload URL or direct upload path into GCS.
     */
    async createUploadTicket(filename, mimeType, fileSizeBytes, productId, variantId) {
        const ext = path.extname(filename) || '.jpg';
        const cleanName = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        const storageKey = `products/${productId || 'general'}/${Date.now()}_${cleanName}${ext}`;

        let uploadUrl = `https://storage.googleapis.com/${this.bucketName}/${storageKey}`;
        try {
            const [url] = await this.storage.bucket(this.bucketName).file(storageKey).getSignedUrl({
                version: 'v4',
                action: 'write',
                expires: Date.now() + 15 * 60 * 1000, // 15 mins
                contentType: mimeType
            });
            uploadUrl = url;
        } catch (e) {
            console.warn(`[admin.media] GCS getSignedUrl note: using standard cloud storage path (${e.message})`);
        }

        const publicCdnUrl = `https://storage.googleapis.com/${this.bucketName}/${storageKey}`;

        // Create pending record in DB
        const insertQuery = `
            INSERT INTO product_media 
            (bucket_name, storage_key, original_filename, mime_type, file_size_bytes, cdn_url, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'pending_upload')
            RETURNING media_id, storage_key, cdn_url, status;
        `;
        const res = await db.query(insertQuery, [
            this.bucketName,
            storageKey,
            filename,
            mimeType,
            fileSizeBytes || 0,
            publicCdnUrl
        ]);

        const media = res.rows[0];

        // Link to product/variant if provided
        if (productId) {
            await db.query(`
                INSERT INTO product_variant_media_mapping (product_id, variant_id, media_id)
                VALUES ($1, $2, $3)
                ON CONFLICT DO NOTHING;
            `, [productId, variantId || null, media.media_id]);
        }

        return {
            mediaId: media.media_id,
            storageKey,
            uploadUrl,
            publicCdnUrl,
            bucket: this.bucketName
        };
    }

    async confirmUpload(mediaId, width, height) {
        const query = `
            UPDATE product_media 
            SET status = 'ready', width = $2, height = $3, updated_at = NOW()
            WHERE media_id = $1
            RETURNING *;
        `;
        const res = await db.query(query, [mediaId, width || null, height || null]);
        return res.rows[0];
    }
}

module.exports = new MediaService();
