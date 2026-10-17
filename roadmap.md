# Animation update
- [x] Add site-wide page navigation and content motion.
- [x] Animate shared controls and menus with reduced-motion support.
- [x] Verify navigation and interactions in the running site.

# Always-on animation
- [x] Remove device Reduce Motion suppression from shared effects and category morphs.
- [x] Test animations and navigation with device Reduce Motion enabled.

# Docked account card
- [x] Remove hover paint, blur and glow so the card reads as fixed chrome.
- [x] Keep menu items from sliding while other site links still do.

# Token security
- [ ] Resolve account hosting and backend access before enforcing token revocation.
- [ ] Implement server-enforced login sessions with absolute 12-hour expiry and logout revocation.
- [ ] Enforce valid sessions across protected APIs and database access.
- [ ] Test expiry, rejected tokens, logout revocation, and the signed-in flow.