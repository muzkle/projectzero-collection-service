# collection-service

Bounded context: User sticker ownership (mint), wishlist, mission progress, album ranking, and eligibility.

## Endpoints

### User (via gateway, requires `x-user-id`)

- `GET /v1/me/collection` — List owned stickers
- `GET /v1/me/profile` — Profile with recent stickers and album progress
- `GET /v1/me/wishlist` — Wishlist items
- `POST /v1/me/wishlist` — Add sticker to wishlist
- `DELETE /v1/me/wishlist/:stickerId` — Remove from wishlist
- `GET /v1/me/ranking/:albumId` — Album leaderboard by rarity score
- `POST /v1/stickers/:id/claim` — Claim a free sticker
- `GET /v1/stickers/:id/eligibility` — Ownership and claim eligibility

### Internal (requires `x-internal-service-key`)

- `GET /v1/internal/users/:userId/stickers/:stickerId/status` — `{ owned, eligible }`

### Health

- `GET /health` — Database and Redis readiness

## Queue consumers (BullMQ)

| Job | Source | Action |
|-----|--------|--------|
| `sticker-published` | catalog | Upsert `StickerRef` cache |
| `purchase-completed` | payment | Mint sticker, increment catalog supply |
| `mission-validated` | integration | Update `MissionProgress` |

## ADR

See [docs/ADR](./docs/ADR)
