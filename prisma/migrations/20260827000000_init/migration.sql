-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('IN_PROGRESS', 'DISPATCHED');

-- CreateEnum
CREATE TYPE "DeviceRequestType" AS ENUM ('DROP_OFF', 'REPLACEMENT', 'PULL_OUT');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('DIRECT_BUSINESS', 'EXTERNAL_PARTNER', 'OUTBOUND');

-- CreateTable
CREATE TABLE "DeviceRequest" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "submittedAt" TIMESTAMPTZ(3) NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "requestDate" TEXT NOT NULL,
    "requestTime" TEXT NOT NULL,
    "requestType" "DeviceRequestType" NOT NULL,
    "sdrName" TEXT NOT NULL,
    "ssName" TEXT,
    "businessType" "BusinessType" NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessAddress" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "deliveryMode" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "dispatchedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DeviceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwappingRequest" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "submittedAt" TIMESTAMPTZ(3) NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "swappingDate" TEXT NOT NULL,
    "swappingTime" TEXT NOT NULL,
    "sdrName" TEXT NOT NULL,
    "ssName" TEXT,
    "businessType" "BusinessType" NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessAddress" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "sdCardCount" INTEGER NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "dispatchedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SwappingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceRequest_requestId_key" ON "DeviceRequest"("requestId");

-- CreateIndex
CREATE INDEX "DeviceRequest_status_idx" ON "DeviceRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SwappingRequest_requestId_key" ON "SwappingRequest"("requestId");

-- CreateIndex
CREATE INDEX "SwappingRequest_status_idx" ON "SwappingRequest"("status");
