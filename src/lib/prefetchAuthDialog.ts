/** Warm the auth bundle before click so the dialog opens without a perceptible hitch. */
let authDialogPrefetch: Promise<unknown> | null = null

export function prefetchAuthDialogChunk(): void {
  authDialogPrefetch ??= import('../components/auth/AuthDialog')
}
