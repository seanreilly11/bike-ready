// Vitest stub for the `server-only` package. In a real Next.js build,
// `import "server-only"` throws if a Server Component module is pulled into a
// Client Component bundle. Vitest has no such bundler boundary and no
// "use server" RPC transform, so it eagerly loads the whole module graph -
// including server-only modules reached transitively from client code (e.g.
// useUnlock -> the startCheckout server action -> lib/paddle/data). Aliasing
// the package to this empty module keeps those imports from throwing at load.
export {};
