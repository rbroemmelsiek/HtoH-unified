# Firestore Schema: Contacts + Plans

## Collections

- `plans` (existing)
  - `ownerId: string`
  - `name: string`
  - `root: { children: PlanRow[] }`
  - `createdAt: timestamp`
  - `updatedAt: timestamp`

- `contacts` (new)
  - `id: string` (same as document ID)
  - `ownerId: string` (Firebase Auth UID)
  - `name: string`
  - `role: string`
  - `company?: string`
  - `phone: string`
  - `email: string`
  - `category: "party" | "provider" | "vendor"`
  - `isFavorite: boolean`
  - `imageUrl: string`
  - `address?: string`
  - `notes?: string`
  - `linkedPlanId?: string | null` (references `plans/{planId}`)
  - `linkedOwnerId?: string | null`
  - `createdAt: timestamp`
  - `updatedAt: timestamp`

## Security

Rules enforce owner scoping:

- user can read/write only `plans` where `ownerId == request.auth.uid`
- user can read/write only `contacts` where `ownerId == request.auth.uid`

## Runtime Seeding Behavior

On first Contacts widget load for an authenticated user:

1. Existing local contacts are migrated into Firestore.
2. Additional sample contacts are inserted for testing.
3. If possible, sample plans are auto-created up to 3 total plans.
4. Seeded contacts are linked across available `linkedPlanId` values for multi-plan testing.
