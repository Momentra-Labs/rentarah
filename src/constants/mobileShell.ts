/**
 * Mobile “app shell” — centered column (Airbnb / Grab–style) while desktop stays full width.
 * Content uses the full viewport width below this cap; only the main column is constrained.
 */
export const MOBILE_APP_MAX_WIDTH_PX = 480

/**
 * Toolbar content height under the status bar (not including `env(safe-area-inset-top)`).
 * Keep in sync with {@link Navbar} mobile `Toolbar` minHeight.
 */
export const MOBILE_APP_BAR_TOOLBAR_PX = 48
