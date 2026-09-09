-- CreateTable
CREATE TABLE "InventoryImportBatch" (
    "id" TEXT NOT NULL,
    "importedBy" TEXT NOT NULL,
    "importedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryCountEntry" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "InventoryCountEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryCountEntry_batchId_idx" ON "InventoryCountEntry"("batchId");

-- AddForeignKey
ALTER TABLE "InventoryCountEntry" ADD CONSTRAINT "InventoryCountEntry_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InventoryImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
