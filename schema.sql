-- SuretyDAO Database Schema (PostgreSQL/Supabase)

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
-- Tracks both Workers (Agberos) and Employers
-- The Wallet Address is the unique identifier.
CREATE TABLE IF NOT EXISTS users (
    wallet_address TEXT PRIMARY KEY,
    role VARCHAR(20) NOT NULL CHECK (role IN ('WORKER', 'EMPLOYER', 'ADMIN')),
    phone_number VARCHAR(20), -- For SMS notifications
    email VARCHAR(255),
    
    -- Risk Profile (Specific to Workers)
    current_risk_score INTEGER DEFAULT 0,
    total_jobs_completed INTEGER DEFAULT 0,
    reputation_token_id INTEGER, -- Link to Soulbound Token ID if applicable
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. JOBS TABLE
-- Tracks the lifecycle of a gig from "Hire" to "Payout"
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    employer_address TEXT NOT NULL REFERENCES users(wallet_address),
    worker_address TEXT REFERENCES users(wallet_address), -- Can be NULL initially if job is open
    
    -- Job Details
    title TEXT NOT NULL,
    description TEXT,
    amount_eth NUMERIC(18, 8) NOT NULL, -- Storing value references (actual money is on-chain)
    
    -- Status Workflow
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'DISPUTED', 'CANCELLED')),
    
    -- On-Chain References
    escrow_contract_address TEXT,
    transaction_hash_deposit TEXT,
    transaction_hash_payout TEXT,
    
    -- Verification Data
    start_location_lat FLOAT,
    start_location_lng FLOAT,
    end_location_lat FLOAT,
    end_location_lng FLOAT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. UPDATED_AT TRIGGER
-- Automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS POLICIES (Row Level Security) - Optional but recommended for Supabase
-- For the hackathon, we might default to public for speed, but here is a basic setup.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Allow public read (for transparency)
CREATE POLICY "Public profiles are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Jobs are viewable by everyone" ON jobs FOR SELECT USING (true);

-- Allow service_role (Backend API) full access
-- Note: In Supabase, the 'service_role' key bypasses RLS by default, so we don't strictly need policies for the backend if we use that key.
