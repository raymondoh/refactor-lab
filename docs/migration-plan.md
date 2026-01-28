Goal:
Refactor legacy-app auth to match modern-app auth architecture.

Principles:

- Do not change behaviour.
- Do not refactor UI yet.
- Only restructure auth backend layer.
- Keep legacy actions as temporary adapters.

# 1) Confirm no Admin SDK usage in actions (except allowed admin wrappers)

rg 'getAdminAuth|getAdminFirestore|getAdminStorage' src/actions

# 2) Confirm no direct Firestore calls in actions (service-first rule)

rg 'db\.collection\(' src/actions

# 3) Confirm no direct initialize imports in actions

rg 'firebase/admin/initialize' src/actions

# 4) Run typecheck + tests

npx tsc --noEmit && npm test
