## 2025-05-15 - Debouncing Search to Improve UI Responsiveness
**Learning:** In applications with deep data structures (projects -> tasks -> test cases), filtering and searching on every keystroke can lead to noticeable UI lag and unnecessary CPU usage. Debouncing is a high-impact, low-risk optimization that keeps the UI responsive.
**Action:** Always consider debouncing for search inputs and other expensive computations triggered by frequent user events.

## 2025-05-15 - Avoiding Build Artifacts in Commits
**Learning:** Development tools (like Vite PWA plugin) may generate or update files in `dev-dist/` during local development. These are build artifacts and should never be manually edited or included in a PR.
**Action:** Always verify `git status` before committing and ensure no build artifacts are staged. Restore them if necessary.
