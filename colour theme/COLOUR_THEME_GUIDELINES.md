# Luxury Athleisure Brand Color System & UI Guidelines
**Target Market:** India Luxury Athleisure (`/en-in`)  
**Design Philosophy:** Understated Luxury (Warm Earth tones & Alabaster Canvas instead of harsh stark white or aggressive neon discount alerts).

---

## 1. Complete Palette Specification

| Token Name | Hex Code | Swatch | Intended Role | Psychological Impact |
|---|---|---|---|---|
| `--bg-base` | `#F9F8F6` | Warm Alabaster | Primary Canvas & Background | Replaces harsh `#FFF`. Replicates high-end art galleries; easy on mobile screens. |
| `--bg-surface` | `#F2EFE9` | Soft Linen | Drawers, Product Card Backgrounds | Creates subtle, elegant depth without hard boxy shadows. |
| `--bg-card` | `#FFFFFF` | Pure White | Active card surface & modal body | Clean container for product imagery. |
| `--border-subtle` | `#E8E3DA` | Oat Border | Divider lines, input outlines | 1px clean luxury separators. |
| `--text-main` | `#1A1A1A` | Obsidian Slate | Primary Headings, Titles & Prices | High contrast readability without the harsh glare of `#000`. |
| `--text-muted` | `#66625D` | Warm Greige | Subtitles, Reviews, Line item details | Sophisticated typographic hierarchy. |
| `--brand-espresso` | `#2C1E18` | Deep Espresso Bronze | Primary Luxury CTA (`Add to Bag`, `Checkout`) | Grounded, high-conversion luxury anchor. |
| `--brand-champagne`| `#C5A880` | Brushed Gold | Free Shipping thresholds, ratings, badges | Signals VIP status, luxury certification. |
| `--brand-terracotta`| `#9E4736` | Royal Terracotta | Success notifications, coupon tags, highlights| Warm Indian heritage accent; high visual appeal in sunlight. |
| `--brand-sage` | `#5B7065` | Eucalyptus Sage | Wellness tags, meditation lines, yoga | Signifies mindfulness and breathability. |

---

## 2. Notification & Modal System (Zero Native `alert()` Rule)

> **Rule:** Never use browser-default native alerts (`window.alert()`), which break luxury immersion with stark OS-level dialogs (as seen in browser popups). All notifications, confirmations, and error toasts MUST use the custom themed modal dialog system.

### The Modal Component Design

```html
<!-- Themed Notification Modal Structure -->
<div class="alo-modal-overlay" id="alo-modal-overlay">
  <div class="alo-modal-card">
    <div class="alo-modal-header">
      <div class="alo-modal-icon">✓</div>
      <h3 class="alo-modal-title" id="alo-modal-title">Order Confirmed</h3>
    </div>
    <div class="alo-modal-body" id="alo-modal-body">
      <!-- Dynamic notification content -->
    </div>
    <div class="alo-modal-footer">
      <button class="alo-modal-btn" id="alo-modal-btn">Continue Shopping</button>
    </div>
  </div>
</div>
```

### Applying Styles (CSS)

```css
/* Custom Themed Notification System */
.alo-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(44, 30, 24, 0.45); /* Warm Espresso overlay tint */
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}

.alo-modal-overlay.active {
  opacity: 1;
  pointer-events: auto;
}

.alo-modal-card {
  background: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  width: 90%;
  max-width: 440px;
  padding: 32px 28px;
  box-shadow: 0 24px 48px rgba(44, 30, 24, 0.18);
  text-align: center;
  transform: translateY(12px) scale(0.98);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.alo-modal-overlay.active .alo-modal-card {
  transform: translateY(0) scale(1);
}

.alo-modal-icon {
  width: 44px;
  height: 44px;
  background: var(--bg-surface);
  color: var(--brand-terracotta);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 18px;
  font-weight: 700;
}

.alo-modal-title {
  font-family: var(--font-heading);
  font-size: 20px;
  color: var(--brand-espresso);
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.alo-modal-body {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 24px;
}

.alo-modal-btn {
  background: var(--brand-espresso);
  color: #FFF;
  border: none;
  padding: 12px 28px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 2px;
}

.alo-modal-btn:hover {
  background: var(--brand-terracotta);
}
```

---

## 3. How to Trigger Themed Messages Programmatically

In JavaScript, replace `alert(msg)` with the global helper:

```js
window.showAloMessage({
  title: 'Order Placed Successfully via UPI',
  message: 'Your payment has been verified. Order ID: #041d430c has been sent to your email.',
  badge: 'UPI Verified',
  btnText: 'Continue Shopping'
});
```
