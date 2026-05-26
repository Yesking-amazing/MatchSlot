-- Push tokens table for sending push notifications to users
CREATE TABLE IF NOT EXISTS push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL,
    platform TEXT, -- 'ios' | 'android'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push tokens" ON push_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Allow reading other users' tokens for sending notifications (needed for client-side push)
CREATE POLICY "Allow reading tokens for notifications" ON push_tokens
    FOR SELECT USING (true);
