---
name: Vite HMR circular import in layout.tsx
description: layout.tsx imports from App.tsx (LogoutContext/useAnimatedLogout), creating a circular dep that breaks HMR.
---

`layout.tsx` imports `useAnimatedLogout` from `App.tsx`. App.tsx imports layout implicitly through the route tree. This creates a circular import that Vite's HMR cannot resolve, causing "Could not Fast Refresh" warnings and sometimes `ReferenceError: X is not defined` during hot updates.

**Why:** Vite HMR re-executes module graphs; circular references mean execution order is undefined at hot-update time.

**How to apply:** After editing layout.tsx AND App.tsx in the same session, do a full workflow restart (`restart_workflow`) rather than relying on HMR. The error is transient — a clean server start resolves it.
