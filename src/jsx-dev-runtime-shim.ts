import { Fragment } from "react";
import { jsx } from "react/jsx-runtime";

/**
 * Some Vercel/TanStack SSR builds preserve the development JSX import while
 * bundling React's production runtime. Map jsxDEV to the production jsx
 * implementation so SSR remains valid in either build mode.
 */
export { Fragment };
export function jsxDEV(type: unknown, props: unknown, key?: unknown) {
  return jsx(type as never, props as never, key as never);
}
