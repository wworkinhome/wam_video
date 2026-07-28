-- CreateIndex
CREATE INDEX "channels_tenant_id_country_idx" ON "channels"("tenant_id", "country");

-- CreateIndex
CREATE INDEX "channels_tenant_id_category_idx" ON "channels"("tenant_id", "category");
