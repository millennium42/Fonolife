CREATE TABLE IF NOT EXISTS login_rate_limits (
  key text PRIMARY KEY,
  failure_count int NOT NULL DEFAULT 1,
  locked_until timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_rate_limits_locked_until_idx ON login_rate_limits(locked_until);
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_expires_at_idx ON user_sessions(expires_at);
