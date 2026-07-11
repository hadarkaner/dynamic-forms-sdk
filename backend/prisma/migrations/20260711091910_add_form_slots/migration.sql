-- CreateTable
CREATE TABLE "form_slots" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "formId" TEXT,

    CONSTRAINT "form_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "form_slots_key_key" ON "form_slots"("key");

-- CreateIndex
CREATE INDEX "form_slots_apiKeyId_idx" ON "form_slots"("apiKeyId");

-- AddForeignKey
ALTER TABLE "form_slots" ADD CONSTRAINT "form_slots_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_slots" ADD CONSTRAINT "form_slots_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
