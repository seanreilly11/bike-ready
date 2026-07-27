// Static image imports (data/signs.tsx imports PNGs directly).
//
// These declarations normally arrive via the generated next-env.d.ts, which
// carries a conditional `/// <reference types="next/image-types/global" />`.
// That file is gitignored, so a fresh CI checkout only has it if a Next command
// regenerates it with the reference intact - when it does not, `tsc --noEmit`
// fails with TS2307 on every image import. Referencing it here keeps typecheck
// independent of generated files. Resolves to the same declarations, so no
// duplication when next-env.d.ts is present.

/// <reference types="next/image-types/global" />
