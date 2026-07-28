-- CreateTable
CREATE TABLE "watch_party_messages" (
    "id" TEXT NOT NULL,
    "watch_party_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watch_party_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "watch_party_messages_watch_party_id_created_at_idx" ON "watch_party_messages"("watch_party_id", "created_at");

-- AddForeignKey
ALTER TABLE "watch_party_messages" ADD CONSTRAINT "watch_party_messages_watch_party_id_fkey" FOREIGN KEY ("watch_party_id") REFERENCES "watch_parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_party_messages" ADD CONSTRAINT "watch_party_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
