# E-Commerce Architecture & Implementation Roadmap
**Target Experience:** Alo Yoga Luxury Athleisure Benchmark ([aloyoga.com/en-in](https://www.aloyoga.com/en-in))  
**Engine:** Fractal Kernel v2.0 (Multi-Tier: Parent → Child → Grandchild)  
**Database & Storage:** Supabase PostgreSQL 17.12 (`ap-northeast-1`) + Google Cloud Storage (`alo-ecommerce-media-515620`)  
**Testing & Verification:** PIET (Persistent In-RAM Ephemeral Twin) Zero-Mock Falsification Harness with Mandatory Teardown Invariant  
**Design System:** Indian Athleisure Luxury Color Suite (Alabaster `#F9F8F6`, Espresso `#2C1E18`, Terracotta `#9E4736`, Champagne `#C5A880`)

---

## Master Implementation Checklist

### Phase 1: Core Kernel Infrastructure & Cloud Storage Setup
- [x] **Step 1.1:** Clone repository `E-Commerce-Website` and initialize `main` and `dev` branches.
- [x] **Step 1.2:** Configure `gcloud` project `e-commerce-website-515620` and provision storage bucket `gs://alo-ecommerce-media-515620`.
- [x] **Step 1.3:** Connect to Supabase PostgreSQL 17.12 via IPv4 Tokyo pooler (`aws-0-ap-northeast-1.pooler.supabase.com:6543`).
- [x] **Step 1.4:** Apply database schemas for Admin (`admin_users`, `admin_sessions`) and Media Storage (`product_media`, `product_variant_media_mapping`).
- [x] **Step 1.5:** Upgrade Fractal Kernel to v2.0 supporting Parent → Child → Grandchild multi-tier discovery and lineage breadcrumbs.
- [x] **Step 1.6:** Implement Admin Parent Slice (`/api/admin`), Auth Child Slice (`/api/admin/auth`), Media Child Slice (`/api/admin/media`), and Transformations Grandchild Slice (`/api/admin/media/transform`).
- [x] **Step 1.7:** Build and integrate PIET testing slice (`admin.piet`) with automated teardown invariant (Zero Ghost Records).

---

### Phase 2: Catalog, Product Matrix & Variant Hierarchy
- [x] **Step 2.1:** Execute Catalog database schema (`categories`, `products`, `product_variants`, `product_reviews`).
- [x] **Step 2.2:** Build Catalog Parent Slice (`/api/catalog`) with category handle taxonomy.
- [x] **Step 2.3:** Build Products Child Slice (`/api/catalog/products`) with media mapping aggregation.
- [x] **Step 2.4:** Build Variants Grandchild Slice (`/api/catalog/products/variants`) supporting color swatches, sizes (`XXS`-`XL`), and SKU stock.
- [x] **Step 2.5:** Build Reviews Grandchild Slice (`/api/catalog/products/reviews`) supporting ratings (1-5) and fit feedback.
- [x] **Step 2.6:** Expand PIET zero-mock falsification harness to 7 gates verifying the complete catalog pipeline in live Supabase.

---

### Phase 3: Telemetry, Heatmaps & Every-Click Tracking Engine
- [x] **Step 3.1:** Apply Clickstream database schema (`visitors`, `user_sessions`, `click_events`, `navigation_clicks`, `search_interaction_events`, `pdp_interaction_clicks`, `cart_interaction_clicks`).
- [x] **Step 3.2:** Build Telemetry Parent Slice (`/api/telemetry`).
- [x] **Step 3.3:** Build Clickstream Ingestion Child Slice (`/api/telemetry/clicks`) capturing $(X,Y)$ coordinates, scroll depth, DOM selectors, and funnel stage.
- [x] **Step 3.4:** Build Heatmaps Grandchild Slice (`/api/telemetry/clicks/heatmaps`) aggregating click density and element rankings.
- [x] **Step 3.5:** Extend PIET suite with Gate 8: Clickstream Telemetry & Ingestion Invariant.

---

### Phase 4: Cart, Promotions & Localized Checkout Engine
- [ ] **Step 4.1:** Apply Cart & Order database schema (`carts`, `cart_items`, `discount_coupons`, `orders`, `order_items`).
- [ ] **Step 4.2:** Build Checkout Parent Slice (`/api/checkout`).
- [ ] **Step 4.3:** Build Cart Child Slice (`/api/checkout/cart`) providing real-time line-item updates, quantity steppers, and free-shipping threshold calculation (e.g., Free Express Shipping > ₹5,000).
- [ ] **Step 4.4:** Build Coupons Grandchild Slice (`/api/checkout/cart/coupons`) validating promo codes and calculating discount subtotals.
- [ ] **Step 4.5:** Build Payments Child Slice (`/api/checkout/payments`) simulating localized Indian checkout (UPI, Netbanking, Cards) with currency formatting in INR (`₹`).
- [ ] **Step 4.6:** Extend PIET suite with Gate 9: Cart lifecycle, coupon application, and payment order generation.

---

### Phase 5: High-Performance Luxury Storefront (AITAG Architecture & Indian Palette)
- [ ] **Step 5.1:** Set up high-performance frontend application configured with the Indian Athleisure Luxury Color Suite (Alabaster `#F9F8F6`, Espresso `#2C1E18`, Terracotta `#9E4736`, Champagne `#C5A880`, Sage `#5B7065`).
- [ ] **Step 5.2:** Build Hero Banner & Luxury Mega-Navigation (`Women`, `Men`, `Accessories`, `Fabric Tech`).
- [ ] **Step 5.3:** Build Product Listing Page (PLP) with interactive color swatch preview, quick-add flyout, and filter drawer.
- [ ] **Step 5.4:** Build Product Detail Page (PDP) with responsive multi-angle image carousel, size selector, real-time inventory counter, and sticky Add-to-Bag bar.
- [ ] **Step 5.5:** Build Flyout Mini-Cart Drawer with animated line item management and free shipping progress bar.
- [ ] **Step 5.6:** Integrate client-side Clickstream Telemetry dispatcher transmitting every user interaction to the `/api/telemetry/clicks` slice.

---

### Phase 6: End-to-End PIET Automated Verification & Pre-Merge Gate
- [ ] **Step 6.1:** Run full multi-gate PIET test suite verifying 100% pass across all slices.
- [ ] **Step 6.2:** Verify complete zero-ghost-record database invariant in Supabase.
- [ ] **Step 6.3:** Commit and push verified codebase to `dev` branch.
