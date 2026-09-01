-- AlterTable: new requests default to NEW, not IN_PROGRESS
ALTER TABLE "DeviceRequest" ALTER COLUMN "status" SET DEFAULT 'NEW';
ALTER TABLE "SwappingRequest" ALTER COLUMN "status" SET DEFAULT 'NEW';

-- Backfill: only rows nobody has ever touched (lastChangedBy still null)
-- move back to NEW. A row someone already toggled to In Progress keeps that
-- status even if it's still In Progress today.
UPDATE "DeviceRequest" SET "status" = 'NEW' WHERE "status" = 'IN_PROGRESS' AND "lastChangedBy" IS NULL;
UPDATE "SwappingRequest" SET "status" = 'NEW' WHERE "status" = 'IN_PROGRESS' AND "lastChangedBy" IS NULL;
