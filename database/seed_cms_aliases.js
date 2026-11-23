const db = require('../server/db');

async function seedCmsAliases() {
    await db.query(`
        INSERT INTO cms_pages (page_id, slug, title, category_group, requires_auth, headline, content_html, is_active)
        VALUES 
        ('cms-contact-us', 'contact-us', 'Contact Us', 'Customer Service', false, 'We are here to help', '<p>Contact YOGA customer support 24/7 via email at support@yoga.com or phone at 1800-YOGA-IND.</p>', true),
        ('cms-faq', 'faq', 'Frequently Asked Questions', 'Customer Service', false, 'Common Questions Answered', '<p>Find answers regarding orders, returns, and sizing.</p>', true),
        ('cms-sign-in', 'sign-in', 'Sign In / Register', 'My Account', false, 'Access Your YOGA Account', '<p>Sign in with your email to unlock exclusive member pricing and rewards.</p>', true),
        ('cms-yoga-rewards', 'yoga-access-rewards', 'YOGA Access Rewards', 'My Account', false, 'Earn Points on Every Purchase', '<p>1 Point for every ₹100 spent. Redeem points for exclusive apparel and class passes.</p>', true),
        ('cms-wishlist', 'wishlist', 'My Wishlist', 'My Account', true, 'Saved Favorites', '<p>Save your favorite studio styles and purchase when ready.</p>', true),
        ('cms-about-us', 'about-us', 'About Us', 'Information', false, 'The Spirit of YOGA', '<p>Mindful movement, elevated studio aesthetics, and cutting-edge technical fabrics.</p>', true),
        ('cms-returns-and-exchanges', 'returns-and-exchanges', 'Returns & Exchanges', 'Customer Service', false, 'Hassle-Free Returns', '<p>Enjoy 30-day complimentary domestic returns across India.</p>', true),
        ('cms-size-guide', 'size-guide', 'Size Guide & Measurement Chart', 'Customer Service', false, 'Find Your Perfect Fit', '<p>Comprehensive sizing for Airlift, Alosoft, and Airbrush garments.</p>', true)
        ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content_html = EXCLUDED.content_html, is_active = true;
    `);
    console.log('✅ CMS Aliases Seeded successfully!');
    process.exit(0);
}

seedCmsAliases().catch(err => {
    console.error(err);
    process.exit(1);
});
