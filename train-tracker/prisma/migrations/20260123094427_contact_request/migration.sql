-- CreateTable
CREATE TABLE "ContactRequest" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "hasTicket" BOOLEAN NOT NULL,
    "referenceCode" TEXT,
    "message" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactRequest_pkey" PRIMARY KEY ("id")
);
