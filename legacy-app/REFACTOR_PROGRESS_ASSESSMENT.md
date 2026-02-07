# MotoStix Refactor Progress Assessment

## Scope
- Assessed only `legacy-app`.
- Focused on service purity, storage separation, admin action orchestration, product schema/type alignment, lint/typecheck status, and Stripe flow.

## A) Service Layer Purity

### Confirmed
- No `requireAdmin(` calls inside `src/lib/services`.
- No service-layer usage of route/cache APIs (`revalidatePath`, `NextResponse`, `cookies`, `headers`) in `src/lib/services`.

### Violation
- `src/lib/services/user-service.ts` still imports runtime auth logic dynamically and calls `auth()` in `getCurrentUser`, coupling the service layer to session/auth concerns.
  - `const { auth } = await import("@/auth")`
  - `const session = await auth()`

**Minimal fix:** Move `getCurrentUser` out of `UserService` into an action/helper layer. Keep services Firestore/data-only (e.g., `getUserRole`, query/mapping helpers).

## B) Storage Separation

### Confirmed
- Storage SDK usage in services appears only in `src/lib/services/storage-service.ts`.

### Violation impacting target architecture
- Product image deletion is still implemented in `src/firebase/admin/products.ts` (`deleteProductImage`) and called by `deleteProduct`, which also mixes doc deletion and storage deletion.

**Minimal fix:**
1. Add `deleteProductImages` in `src/lib/services/storage-service.ts`.
2. Add Firestore-only product service functions (`getProductDoc`, `getProductImageRefs`, `deleteProductDoc`) in `src/lib/services/*`.
3. Update `deleteProductAction` to orchestrate in order: `requireAdmin` → fetch doc/refs → delete storage → delete doc → `revalidatePath`.

## C) Admin Action Consistency

### Violations
- No `src/actions/_helpers/require-admin.ts` helper currently exists.
- Multiple admin actions still inline auth/session + role checks (e.g., `src/actions/products/delete-product.ts`, `src/actions/products/update-product.ts`, `src/actions/orders/update-order-status.tsx`, `src/actions/user/admin.ts`).
- `deleteProductAction` currently calls monolithic `deleteProduct` from `src/firebase/admin/products.ts` rather than orchestrating granular service/storage steps.

**Minimal fix:** Create and adopt a single `requireAdmin` helper in actions; remove duplicated auth/role blocks from each admin action.

## D) Product Type + Schema Alignment

### Violation
- `Product` type requires `image: string` in `src/types/models/product.ts`.
- `productSchema` allows `image` to be optional in `src/schemas/product/product.ts`.

**Minimal fix (recommended):** Make `image` required in the schema (`z.string().url(...)`) to match the TypeScript model.

## E) Type Safety + Lint Status

### Type-check
- `npm run type-check` passes.

### Lint
- `npm run lint` fails with 144 errors.
- Main error categories:
  - `@typescript-eslint/no-explicit-any`: 50
  - `@typescript-eslint/no-unused-vars`: 49
  - `react/no-unescaped-entities`: 40
  - `@typescript-eslint/no-empty-object-type`: 1
  - plus smaller categories (`@typescript-eslint/no-require-imports`, `prefer-const`)

### Files with highest concentration (sample top group)
- `src/contexts/SearchContext.tsx` (4)
- `src/firebase/admin/auth.ts` (4)
- `src/firebase/admin/products.ts` (4)
- `src/actions/data-privacy/deletion.ts` (3)
- `src/app/api/webhooks/stripe/route.ts` (3)

### Minimal fix patterns by category
- `no-explicit-any`: replace `any` with schema-inferred or domain-specific interfaces/unions.
- `no-unused-vars`: remove dead bindings/imports or prefix intentionally unused args with `_` consistently if lint config permits.
- `no-empty-object-type`: replace empty interface with explicit shape, or use `Record<string, never>` / type alias as appropriate.
- `react/no-unescaped-entities`: escape apostrophes/quotes as HTML entities (`&apos;`, `&#39;`, `&quot;`).

## F) Stripe + Webhook Sanity Check

### Findings
- Stripe Elements-based flow still exists:
  - `src/app/checkout/page.tsx` uses `StripeProvider` + `CheckoutForm`.
  - `src/components/checkout/CheckoutForm.tsx` uses `useElements` and calls `/api/create-payment-intent`.
  - `src/app/api/create-payment-intent/route.ts` still exists and creates PaymentIntents.
- Orders are created in webhook (`src/app/api/webhooks/stripe/route.ts`), **but not only there**:
  - `src/actions/orders/create-order.ts` still directly creates orders via `createOrderInDb`.
- No `resolve-order` API route found under `src/app/api/*`.

**Minimal fix:** If architecture target is Checkout Sessions + webhook-only order creation, remove legacy Elements/PaymentIntent path and ensure all order creation funnels through webhook event handling.

## Risk Notes
- **Stripe:** dual flows (PaymentIntent + webhook + direct order action) increase risk of duplicate or inconsistent orders.
- **Storage deletion:** if refactor moves delete steps, order of operations matters to avoid orphaned storage or broken retries.
- **Auth checks:** distributed admin checks increase drift risk; centralizing in `requireAdmin` reduces bypass bugs.
- **Firestore consistency:** ensure admin-only access assumptions in server code are mirrored by Firestore security rules and backend checks.
