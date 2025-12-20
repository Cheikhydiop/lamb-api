-- Add winnings distribution fields to fights table
ALTER TABLE fights 
ADD COLUMN IF NOT EXISTS winner TEXT,
ADD COLUMN IF NOT EXISTS "distributionStatus" TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "distributedAt" TIMESTAMP;

-- Add index for distributionStatus
CREATE INDEX IF NOT EXISTS "fights_distributionStatus_idx" ON fights("distributionStatus");

-- Add fightId to commissions table
ALTER TABLE commissions
ADD COLUMN IF NOT EXISTS "fightId" TEXT;

-- Add foreign key constraint
ALTER TABLE commissions
ADD CONSTRAINT "commissions_fightId_fkey" 
FOREIGN KEY ("fightId") REFERENCES fights(id) ON DELETE CASCADE;

-- Add index for fightId
CREATE INDEX IF NOT EXISTS "commissions_fightId_idx" ON commissions("fightId");
