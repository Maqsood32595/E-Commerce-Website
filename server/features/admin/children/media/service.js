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
            console.warn(`[admin.media] GCS getSignedUrl note: using server proxy path (${e.message})`);
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
            proxyUploadUrl: `/api/admin/media/upload-file?filename=${encodeURIComponent(filename)}`,
            bucket: this.bucketName
        };
    }

    /**
     * Direct binary upload to Google Cloud Storage + DB confirmation.
     * Bypasses browser GCS CORS & Uniform Bucket 403 via authenticated local proxy endpoint.
     */
    async uploadBuffer(filename, mimeType, buffer, productId = null, variantId = null) {
        const ext = path.extname(filename || '') || (mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg');
        const cleanName = path.basename(filename || 'asset', ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        const storageKey = `products/${productId || 'catalog'}/${Date.now()}_${cleanName}${ext}`;

        // Stream directly to Google Cloud Storage
        await this.storage.bucket(this.bucketName).file(storageKey).save(buffer, {
            contentType: mimeType || 'image/jpeg',
            resumable: false
        });

        // Insert record cleanly using placeholder URL first to obtain UUID, then update to proxy URL
        const insertRes = await db.query(`
            INSERT INTO product_media
            (bucket_name, storage_key, original_filename, mime_type, file_size_bytes, cdn_url, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'ready')
            RETURNING *;
        `, [
            this.bucketName,
            storageKey,
            filename || `${cleanName}${ext}`,
            mimeType || 'image/jpeg',
            buffer.length,
            `https://storage.googleapis.com/${this.bucketName}/${storageKey}`
        ]);

        const media = insertRes.rows[0];
        const proxyUrl = `/api/admin/media/file/${media.media_id}`;

        const updatedRes = await db.query(`
            UPDATE product_media SET cdn_url = $2 WHERE media_id = $1 RETURNING *;
        `, [media.media_id, proxyUrl]);

        if (productId) {
            await db.query(`
                INSERT INTO product_variant_media_mapping (product_id, variant_id, media_id)
                VALUES ($1, $2, $3)
                ON CONFLICT DO NOTHING;
            `, [productId, variantId || null, media.media_id]);
        }

        return updatedRes.rows[0];
    }

    /**
     * Stream an uploaded image from Google Cloud Storage by mediaId.
     */
    async getMediaStream(mediaId) {
        const res = await db.query(`SELECT media_id, bucket_name, storage_key, mime_type, original_filename FROM product_media WHERE media_id = $1`, [mediaId]);
        if (res.rows.length === 0) return null;
        const row = res.rows[0];
        const file = this.storage.bucket(row.bucket_name || this.bucketName).file(row.storage_key);
        return {
            mimeType: row.mime_type || 'image/jpeg',
            filename: row.original_filename,
            stream: file.createReadStream()
        };
    }

    async listMedia(limit = 60) {
        const res = await db.query(`
            SELECT media_id, bucket_name, storage_key, original_filename, mime_type, file_size_bytes, cdn_url, status, created_at
            FROM product_media
            WHERE status = 'ready'
            ORDER BY created_at DESC
            LIMIT $1;
        `, [limit]);
        return res.rows;
    }

    async deleteMedia(mediaId) {
        const res = await db.query(`SELECT bucket_name, storage_key FROM product_media WHERE media_id = $1`, [mediaId]);
        if (res.rows.length > 0) {
            const { bucket_name, storage_key } = res.rows[0];
            try {
                await this.storage.bucket(bucket_name || this.bucketName).file(storage_key).delete({ ignoreNotFound: true });
            } catch (e) {
                console.warn(`[admin.media] GCS delete warning: ${e.message}`);
            }
        }
        await db.query(`DELETE FROM product_variant_media_mapping WHERE media_id = $1`, [mediaId]);
        await db.query(`DELETE FROM product_media WHERE media_id = $1`, [mediaId]);
        return { deleted: true, mediaId };
    }

    async confirmUpload(mediaId, width, height) {
        const query = `
            UPDATE product_media 
            SET status = 'ready', width = $2, height = $3
            WHERE media_id = $1
            RETURNING *;
        `;
        const res = await db.query(query, [mediaId, width || null, height || null]);
        return res.rows[0];
    }
}

module.exports = new MediaService();
