# WP Voice Reader - Paragraph Text-to-Speech

A lightweight, zero-dependency WordPress global Voice Reader feature that automatically detects every `<p>` tag on the frontend and places a native SpeechSynthesis microphone trigger immediately after each paragraph.

---

## Key Features

1. **Automatic Global Detection**:
   - Automatically scans every `<p>` tag on the frontend.
   - Requires **no manual shortcodes, IDs, or classes**.
   - Fully compatible with **Gutenberg, Classic Editor, and Elementor** layouts.
   - Built-in `MutationObserver` ensures dynamically loaded paragraphs (AJAX pagination, infinite scroll, tabs, accordions) receive voice buttons automatically.

2. **Isolated Paragraph Playback**:
   - Uses the browser's native `SpeechSynthesis` API.
   - Reads **only** the text of the selected `<p>` tag.
   - Zero external APIs, zero paid subscriptions, and zero network latency.

3. **Intelligent Playback Control**:
   - Clicking an active microphone immediately stops speech.
   - Clicking a new microphone stops the previous speech and immediately starts reading the new paragraph.
   - Automatically cancels speech when leaving or reloading the page.

4. **Non-Intrusive & Responsive**:
   - Injected **after** the `<p>` element (`afterend`), preserving existing typography, margins, line heights, and layout.
   - Inherits site typography and colors seamlessly with smooth animated audio waves when active.
   - Fully responsive on desktop, tablet, and mobile.

5. **Deduplication & Exclusion**:
   - Tracks processed elements with `data-wp-voice-ready` to prevent duplicate buttons.
   - Automatically skips empty tags, whitespace-only tags, navigation menus, headers, footers, admin bars, and form inputs.

---

## File Structure

```
wp-voice-reader/
├── wp-voice-reader.php       # Main WordPress plugin initialization & enqueuing
├── assets/
│   ├── css/
│   │   └── voice-reader.css  # Clean responsive CSS styling & active wave animations
│   └── js/
│       └── voice-reader.js   # Vanilla Web Speech API logic & MutationObserver
├── demo.html                 # Standalone interactive browser demo
└── README.md
```

---

## Installation

### Option 1: As a WordPress Plugin (Recommended)
1. Copy or upload the `wp-voice-reader` directory into your WordPress site's `wp-content/plugins/` directory.
2. Go to **WordPress Admin > Plugins > Installed Plugins**.
3. Locate **WP Voice Reader - Paragraph Text-to-Speech** and click **Activate**.

### Option 2: Integration in Child Theme
If you prefer including it directly inside your active theme:
1. Copy the `assets/` folder to your active theme (e.g. `wp-content/themes/your-theme/assets/`).
2. Add the enqueue snippet from [wp-voice-reader.php](file:///c:/Users/Public/paragraph-reader/wp-voice-reader.php) to your theme's `functions.php`.

---

## Customization & Filters

You can customize the voice reader settings in your `functions.php` using the `wp_voice_reader_settings` filter:

```php
add_filter( 'wp_voice_reader_settings', function( $settings ) {
    $settings['rate']   = 1.1;       // Speech speed (0.1 to 10)
    $settings['pitch']  = 1.0;       // Speech pitch (0 to 2)
    $settings['volume'] = 1.0;       // Volume (0 to 1)
    $settings['labelPlay'] = 'Listen';
    $settings['labelStop'] = 'Stop';
    return $settings;
} );
```

To exclude any specific paragraph from having a voice button, simply add the class `no-voice-reader` to that paragraph or its parent container:

```html
<p class="no-voice-reader">This paragraph will not have a voice button.</p>
```
