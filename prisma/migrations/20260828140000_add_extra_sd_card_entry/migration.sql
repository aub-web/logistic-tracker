-- CreateTable
CREATE TABLE "ExtraSdCardEntry" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "taggedBy" TEXT NOT NULL,
    "taggedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtraSdCardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExtraSdCardEntry_businessName_idx" ON "ExtraSdCardEntry"("businessName");
