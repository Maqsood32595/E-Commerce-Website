const db = require('../server/db');

async function seedPdpRunner() {
    try {
        console.log('Seeding YOGA Runner PDP data...');

        const galleryImages = [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80', // front 3/4
            'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=80', // side profile
            'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80', // on-model seated
            'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1200&q=80', // top down
            'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80', // tread sole
            'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80', // on model tying laces
            'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1200&q=80'  // heel & stabilizing clip
        ];

        const featuresBlueprint = [
            { step: '01', title: 'STABILIZING HEEL CLIP', description: 'Provides stability and support' },
            { step: '02', title: 'DYNAMIC DUAL-DENSITY MIDSOLE', description: 'Provides soft impact, high responsiveness, and optimal comfort' },
            { step: '03', title: 'MULTI-TERRAIN OUTSOLE GRIP PODS', description: 'Deliver heel-to-toe traction on track, road, and sand' },
            { step: '04', title: 'REFLECTIVE DETAILS', description: 'Catch the light for visibility and standout style' },
            { step: '05', title: 'BREATHABLE DOUBLE-LAYER MESH UPPER', description: 'Optimizes air flow' }
        ];

        const comparisonData = [
            {
                name: 'YOGA RUNNER',
                designed_for: 'Stability and support on indoor and outdoor runs.',
                fit_feel: 'Lightweight • Extra-Firm Cushioning • Flexible',
                features: 'Stabilizing heel clip, dual-density midsole, multi-terrain outsole grip pods, and reflective details.',
                material: 'Breathable double-layer mesh.'
            },
            {
                name: 'YOGA TRAIL',
                designed_for: 'High-traction support on variable terrain from trail to street.',
                fit_feel: 'Traction • Water-Resistant Materials • High Rebound',
                features: 'Oversized traction pattern, speed lacing system, stabilizing heel clip, molded TPU toecap, and high-rebound midsole.',
                material: 'Nylon upper constructed with water-resistant materials.'
            },
            {
                name: 'YOGA SUNSET SNEAKER',
                designed_for: 'Everyday wear with a cool edge.',
                fit_feel: 'Sleek Feel • Recovery Foam Insole • Lightweight',
                features: 'Low-profile aesthetic, recovery foam insole, premium suede, fashion-forward details.',
                material: 'Premium suede.'
            },
            {
                name: 'YOGA RECOVERY MODE',
                designed_for: 'A clean & modern streetwear look.',
                fit_feel: 'Cloud-Like Feel • High-Rebound • Sleek Feel',
                features: 'Ultra-cushioned comfort collar, seamless no-slip interior support, and long-lasting rubber soles.',
                material: 'Made from vegan leather.'
            },
            {
                name: 'YOGA SUNSET SNEAKER MULE',
                designed_for: 'Easy, on-the-go wear.',
                fit_feel: 'Sleek Feel • Recovery Foam Insole • Lightweight',
                features: 'Low-profile aesthetic with a slip-on design, recovery foam insole, slight heel bump for height, and dual laces.',
                material: 'Premium suede.'
            }
        ];

        const stylingLooks = {
            women: [
                { look: 'Studio Warm-Up', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80', caption: 'Paired with Airlift Charger Bra & 7/8 Legging' },
                { look: 'Après Run Layering', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80', caption: 'Paired with Accolade Quarter-Zip & Sweatpant' },
                { look: 'Minimalist Street', image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80', caption: 'Paired with Gold Rush Puffer & Ribbed Tank' }
            ],
            men: [
                { look: 'Track Sprint Edit', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80', caption: 'Paired with Accolade Hoodie & Athletic Short' },
                { look: 'City Commute', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80', caption: 'Paired with Tailored Travel Pant & Technical Shell' },
                { look: 'Recovery Lounge', image: 'https://images.unsplash.com/photo-1483721074574-e3a1cf5907c0?auto=format&fit=crop&w=800&q=80', caption: 'Paired with Accolade Crew Pullover' }
            ]
        };

        const prodDesc = 'BUILT FOR PERFORMANCE. The ultimate unisex luxury running shoe engineered with dual-density high-rebound cushioning, multi-terrain grip pods, and breathable double-layer mesh for indoor and outdoor road work.';
        const fitDesc = 'Unisex style—true to size. Extra-firm cushioning with responsive impact dispersion. For half sizes or wider feet, we recommend sizing up half a size.';
        const fabDesc = 'Upper: 100% Breathable double-layer engineered mesh with heat-welded TPU overlays. Midsole: Dynamic dual-density EVA foam cushioning. Outsole: Multi-terrain high-abrasion rubber grip pods with stabilizing heel clip.';

        // 1. Insert/Update a0590u-alo-runner-white-white
        const runnerHandles = [
            { id: 'a0590u-yoga-runner-white-white', handle: 'a0590u-alo-runner-white-white', title: 'YOGA Runner (Unisex)' },
            { id: 'a0893u-yoga-runner-white', handle: 'yoga-runner', title: 'YOGA Runner (Unisex)' }
        ];

        for (const item of runnerHandles) {
            await db.query(`
                INSERT INTO products (
                    product_id, title, handle, category_id, color_family, color_hex,
                    mrp, sale_price, discount_label, badge_label, fabric_technology,
                    image_url, description, fit_details, fabrication_details,
                    gallery_images, features_blueprint, comparison_data, styling_looks, is_active
                ) VALUES ($1, $2, $3, 'shoes-sneakers', 'White/White', '#FFFFFF', 27600, 19200, 'SAVE 30%', 'NEW', 'Breathable Double-Layer Mesh',
                          $4, $5, $6, $7, $8, $9, $10, $11, true)
                ON CONFLICT (product_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    handle = EXCLUDED.handle,
                    color_family = EXCLUDED.color_family,
                    mrp = EXCLUDED.mrp,
                    sale_price = EXCLUDED.sale_price,
                    discount_label = EXCLUDED.discount_label,
                    fabric_technology = EXCLUDED.fabric_technology,
                    image_url = EXCLUDED.image_url,
                    description = EXCLUDED.description,
                    fit_details = EXCLUDED.fit_details,
                    fabrication_details = EXCLUDED.fabrication_details,
                    gallery_images = EXCLUDED.gallery_images,
                    features_blueprint = EXCLUDED.features_blueprint,
                    comparison_data = EXCLUDED.comparison_data,
                    styling_looks = EXCLUDED.styling_looks,
                    is_active = true;
            `, [
                item.id, item.title, item.handle, galleryImages[0],
                prodDesc, fitDesc, fabDesc,
                JSON.stringify(galleryImages), JSON.stringify(featuresBlueprint),
                JSON.stringify(comparisonData), JSON.stringify(stylingLooks)
            ]);
        }

        // 2. Insert all 27 shoe size variants for both handles
        const shoeSizes = [
            '3M/4.5W', '3.5M/5W', '4M/5.5W', '4.5M/6W', '5M/6.5W', '5.5M/7W',
            '6M/7.5W', '6.5M/8W', '7M/8.5W', '7.5M/9W', '8M/9.5W', '8.5M/10W',
            '9M/10.5W', '9.5M/11W', '10M/11.5W', '10.5M/12W', '11M/12.5W', '11.5M/13W',
            '12M/13.5W', '12.5M/14W', '13M/14.5W', '13.5M/15W', '14M/15.5W', '14.5M/16W',
            '15M/16.5W', '15.5M/17W', '16M/17.5W'
        ];

        for (const item of runnerHandles) {
            for (const sz of shoeSizes) {
                const varId = `${item.id}-${sz.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
                const sku = `SKU-${item.id}-${sz.replace(/[^a-zA-Z0-9]/g, '')}`;
                await db.query(`
                    INSERT INTO product_variants (
                        variant_id, product_id, sku, color_name, color_hex, size, price, inventory_quantity, is_available
                    ) VALUES ($1, $2, $3, 'White/White', '#FFFFFF', $4, 19200, 30, true)
                    ON CONFLICT (variant_id) DO UPDATE SET
                        price = EXCLUDED.price,
                        inventory_quantity = EXCLUDED.inventory_quantity,
                        is_available = true;
                `, [varId, item.id, sku, sz]);
            }
        }

        // 3. Seed verified product reviews
        const reviews = [
            {
                author: 'Donna',
                rating: 5,
                headline: 'Extremely comfortable',
                comment: 'Love love love these trainers. They are so comfortable and true to size. I have a couple of pairs of them and love them.',
                fit: 'True to size',
                size_ord: null,
                usual: null,
                helpful: 0
            },
            {
                author: 'Kk',
                rating: 5,
                headline: 'Perfect',
                comment: 'Perfect for both cross training and short runs ! Love them',
                fit: 'True to size',
                size_ord: null,
                usual: null,
                helpful: 0
            },
            {
                author: 'Eva X.',
                rating: 5,
                headline: 'Very stylish',
                comment: 'The shoes are amazing and they are soooo beautiful.!!!!! But I wanna review the amazing customer service. I wasn’t sure about my size as a result to order the wrong size so I had to return it. Unexpectedly the shipping was so fast that I didn’t notice the time that past. Congrats 🤍',
                fit: 'True to size',
                size_ord: null,
                usual: null,
                helpful: 0
            },
            {
                author: 'Giannicrivellaro _',
                rating: 5,
                headline: 'Incredibly soft',
                comment: 'I absolutely love them! The shoe literally feels like wearing a sock — incredibly soft, comfortable, and lightweight. Perfect for those days when you need extra comfort, whether you’re walking or working out at the gym. Now, the only problem is that I need them in black too! 🖤',
                fit: 'True to size',
                size_ord: null,
                usual: null,
                helpful: 0
            },
            {
                author: 'SV1987',
                rating: 5,
                headline: 'Shockingly good',
                comment: 'I can’t even lie I am legitimately shocked with how good these are. A coworker recommended them to me to use on the sales floor at work (our shifts are long and we are constantly running up and down stairs and standing for long periods of time on hard marble flooring). My go to used to be a variety of Hoka styles but I have to say I’ve been converted. I took advantage of the sale and got back up pairs in black white and grey. I’m so obsessed with these and I haven’t even gotten into using them for my workouts yet! They are sturdy and supportive for my arches but not stiff or hard or uncomfortable. No break in period, much sleeker and sexier than bulky Hokas, and come in great variety of colors. I’m also surprised with how they hold up wear after wear - and don’t get hot or sweaty even in the insane Florida heat. Seriously just get a pair and don’t look back! You’ll be hooked just like I am.',
                fit: 'True to size',
                size_ord: '9',
                usual: '8.5',
                helpful: 4
            },
            {
                author: 'Thess',
                rating: 5,
                headline: 'The most comfortable shoes in the planet',
                comment: 'I have plantar fasciitis, and these are the only shoes I can wear without my custom orthotic insoles from my doctor. They\'re the most comfortable pair I\'ve ever owned. Believe me, I\'ve tried everything from high-end to budget brands, and these are the only ones that are truly forgiving on my feet. Incredible comfort',
                fit: 'True to size',
                size_ord: '9.5',
                usual: '9.5',
                helpful: 0
            },
            {
                author: 'Jill C',
                rating: 5,
                headline: 'Love!',
                comment: 'So cute and comfortable. I love these shoes and want more colors.',
                fit: 'True to size',
                size_ord: null,
                usual: null,
                helpful: 0
            },
            {
                author: 'Cherry blossom',
                rating: 5,
                headline: 'True to size',
                comment: 'Shoes is true to size I’m a size 36 and fits me perfectly!',
                fit: 'True to size',
                size_ord: null,
                usual: null,
                helpful: 0
            },
            {
                author: 'Darilis',
                rating: 5,
                headline: 'Love my YOGA Runners',
                comment: 'I love these shoes. They are comfortable with the right amount of support. They were exactly what I was looking for, including the color. I have been looking for running shoes, and these are perfect.',
                fit: 'True to size',
                size_ord: '12 women\'s',
                usual: null,
                helpful: 2
            }
        ];

        for (const item of runnerHandles) {
            for (const r of reviews) {
                const existing = await db.query(
                    'SELECT review_id FROM product_reviews WHERE product_id = $1 AND author_name = $2',
                    [item.id, r.author]
                );
                if (existing.rows.length === 0) {
                    await db.query(`
                        INSERT INTO product_reviews (
                            product_id, author_name, rating, headline, comment, fit_feedback, size_ordered, usual_size, helpful_count, is_verified
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
                    `, [item.id, r.author, r.rating, r.headline, r.comment, r.fit, r.size_ord, r.usual, r.helpful]);
                }
            }
        }

        console.log('✓ Seeding complete for YOGA Runner PDP (products, variants, reviews)');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seedPdpRunner();
