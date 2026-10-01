"""
Fix the Accessibility disclosure in focus.page.ts to comply with Google Play policy.

Changes:
1. Adds showAccessibilityDisclosure property
2. Replaces ion-alert disclosure with full-screen overlay approach
3. Adds accept/decline handler methods
"""
import re

TS_FILE = r"C:\Users\Jergus\Desktop\Upshift\upshiftProjects\upshift_android\src\app\pages\focus\focus.page.ts"
HTML_FILE = r"C:\Users\Jergus\Desktop\Upshift\upshiftProjects\upshift_android\src\app\pages\focus\focus.page.html"

# ── 1. Fix TypeScript ──────────────────────────────────────────────

with open(TS_FILE, 'r', encoding='utf-8') as f:
    ts = f.read()

# 1a. Add showAccessibilityDisclosure property after showPermissionGate
ts = ts.replace(
    "showPermissionGate = false;",
    "showPermissionGate = false;\n  /** Full-screen accessibility disclosure overlay (Google Play policy). */\n  showAccessibilityDisclosure = false;",
    1  # only first occurrence
)

# 1b. Replace the presentAccessibilityDisclosure method entirely.
# We match from the JSDoc comment to the closing of `await alert.present();` + `}`
old_method_pattern = re.compile(
    r'  /\*\*\s*\n\s*\* Prominent disclosure for the AccessibilityService API.*?\n'
    r'.*?async presentAccessibilityDisclosure\(\): Promise<void> \{.*?\n'
    r'.*?await alert\.present\(\);\s*\n\s*\}',
    re.DOTALL
)

new_method = """  /**
   * Prominent disclosure for the AccessibilityService API (Google Play policy).
   *
   * Shows a full-screen, non-dismissible overlay with TWO clearly labelled
   * buttons ("Deny" and "Allow"). The overlay is rendered in the template so
   * the Android hardware back button CANNOT dismiss it (unlike ion-alert).
   * Only the explicit "Allow" button proceeds to the Accessibility settings.
   * Tapping "Deny", pressing back, or tapping outside does NOT grant consent.
   */
  async presentAccessibilityDisclosure(): Promise<void> {
    this.showAccessibilityDisclosure = true;
    this.cdr.detectChanges();
  }

  /**
   * Called when the user taps "Allow" on the accessibility disclosure overlay.
   * This is the ONLY path that opens the Accessibility settings.
   */
  async acceptAccessibilityDisclosure() {
    console.log('[FocusPage] Accessibility disclosure accepted — opening settings');
    this.showAccessibilityDisclosure = false;
    this.cdr.detectChanges();
    this.markReturnToFocus();
    try {
      await this.appBlockerService.requestAccessibilityPermission();
    } catch (e) {
      console.error('[FocusPage] requestAccessibilityPermission failed:', e);
    }
    setTimeout(() => this.checkPermissions(), 2000);
  }

  /**
   * Called when the user taps "Deny" on the accessibility disclosure overlay.
   * Simply hides the overlay — never opens settings or grants consent.
   */
  declineAccessibilityDisclosure() {
    console.log('[FocusPage] Accessibility disclosure declined');
    this.showAccessibilityDisclosure = false;
    this.cdr.detectChanges();
  }"""

match = old_method_pattern.search(ts)
if match:
    ts = ts[:match.start()] + new_method + ts[match.end():]
    print("✅ Replaced presentAccessibilityDisclosure method in TS")
else:
    print("❌ Could not find old presentAccessibilityDisclosure method!")
    # Try to show what we're searching for
    if 'async presentAccessibilityDisclosure' in ts:
        print("   (The method exists but the regex didn't match)")
    exit(1)

with open(TS_FILE, 'w', encoding='utf-8') as f:
    f.write(ts)

print("✅ TypeScript file updated")

# ── 2. Fix HTML ────────────────────────────────────────────────────

with open(HTML_FILE, 'r', encoding='utf-8') as f:
    html = f.read()

# Insert the accessibility disclosure overlay right after the permission gate closing div.
# We'll insert it right before the "Activity Details Modal" comment.
disclosure_overlay = """
    <!-- 🔒 Accessibility Service — Prominent Disclosure Overlay (Google Play policy)
    ════════════════════════════════════════════════════════════════════════════════════
         Full-screen, non-dismissible consent screen shown BEFORE opening
         Accessibility Settings. Hardware back button cannot dismiss this
         because it's a plain div, not an ion-alert/ion-modal.
         TWO explicit buttons: "Deny" (closes overlay) and "Allow" (opens settings).
         Tapping outside, pressing back, or navigating away = NO consent. -->
    <div *ngIf="showAccessibilityDisclosure" class="accessibility-disclosure-overlay">
        <div class="accessibility-disclosure-card">
            <div class="accessibility-disclosure-icon">
                <ion-icon name="shield-checkmark"></ion-icon>
            </div>

            <h2 class="accessibility-disclosure-title">Accessibility Service Permission</h2>

            <div class="accessibility-disclosure-body">
                <p>
                    Upshift uses the Android <strong>Accessibility Service</strong> to power
                    app and website blocking.
                </p>
                <p>
                    While a block you created is active, this service reads on-screen
                    information — the name of the app in the foreground and web addresses
                    shown in your browser — so it can detect when you open something you
                    chose to block and show a blocking screen instead.
                </p>
                <p>
                    <strong>This information is processed only on your device</strong> to
                    enforce your own blocks. It is never collected, stored on our servers,
                    shared with third parties, or sold.
                </p>
                <p class="accessibility-disclosure-question">
                    Do you agree to let Upshift use the Accessibility Service for this purpose?
                </p>
            </div>

            <div class="accessibility-disclosure-buttons">
                <button class="accessibility-disclosure-btn deny" (click)="declineAccessibilityDisclosure()">
                    Deny
                </button>
                <button class="accessibility-disclosure-btn allow" (click)="acceptAccessibilityDisclosure()">
                    Allow
                </button>
            </div>
        </div>
    </div>

"""

# Insert before the Activity Details Modal
if '<!-- Activity Details Modal -->' in html:
    html = html.replace('    <!-- Activity Details Modal -->', disclosure_overlay + '    <!-- Activity Details Modal -->')
    print("✅ Inserted disclosure overlay in HTML (before Activity Details Modal)")
else:
    print("⚠️  Could not find Activity Details Modal comment, appending after permission gate")
    # Fallback: insert after the permission gate closing </div>
    html = html.replace('</div>\n\n    <!-- Activity', disclosure_overlay + '\n    <!-- Activity')

with open(HTML_FILE, 'w', encoding='utf-8') as f:
    f.write(html)

print("✅ HTML file updated")
print("\n🎯 Done! Now add CSS styles for the disclosure overlay.")
