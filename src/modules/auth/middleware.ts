import { createHash } from "node:crypto";
import type { Pool } from "pg";
import { config } from "../../config.js";

/**
 * Gera chave de rate limit compostas por IP e hash SHA-256 do e-mail.
 * Isso impede que e-mails fiquem expostos em texto puro nos logs e no PostgreSQL.
 */
export function getRateLimitKey(ip: string, email?: string): string {
  const normalizedIp = ip ? ip.trim() : "127.0.0.1";
  const normalizedEmail = email ? email.trim().toLowerCase() : "unknown";
  const rawKey = `${normalizedIp}:${normalizedEmail}`;
  const hash = createHash("sha256").update(rawKey).digest("hex").slice(0, 32);
  return `rate_limit:${hash}`;
}

const memoryRateLimit = new Map<string, { failureCount: number; lockedUntil: number }>();
const memorySessions = new Map<string, { id: string; userId: string; tokenHash: string; expiresAt: number }>();

/**
  Verifica se as tentativas de login para o par (IP, Email) estão bloqueadas por rate limit distribuído no PostgreSQL.
 */
export async function isLoginRateLimited(
  pool: Pool,
  ip: string,
  email?: string,
  allowFallback?: boolean
): Promise<boolean> {
  const key = getRateLimitKey(ip, email);
  try {
    const result = await pool.query<{ locked_until: Date; failure_count: number }>(
      "SELECT locked_until, failure_count FROM login_rate_limits WHERE key=$1 AND locked_until > now()",
      [key]
    );
    if (result.rowCount && result.rows[0].failure_count >= 5) {
      return true;
    }
    return false;
  } catch (err) {
    if (allowFallback ?? config.authMemoryFallback) {
      const state = memoryRateLimit.get(key);
      if (state && state.lockedUntil > Date.now() && state.failureCount >= 5) {
        return true;
      }
      return false;
    }
    throw err;
  }
}

/**
  Registra uma falha de login no banco de dados compartilhado.
  Após 5 falhas no período de 15 minutos, bloqueia a chave composta (IP + Hash do Email).
 */
export async function recordLoginFailure(
  pool: Pool,
  ip: string,
  email?: string,
  allowFallback?: boolean
): Promise<void> {
  const key = getRateLimitKey(ip, email);
  try {
    await pool.query(
      `INSERT INTO login_rate_limits(key, failure_count, locked_until, updated_at)
       VALUES($1, 1, now() + interval '15 minutes', now())
       ON CONFLICT (key) DO UPDATE
       SET failure_count = CASE WHEN login_rate_limits.locked_until <= now() THEN 1 ELSE login_rate_limits.failure_count + 1 END,
           locked_until = now() + interval '15 minutes',
           updated_at = now()`,
      [key]
    );
  } catch (err) {
    if (allowFallback ?? config.authMemoryFallback) {
      const state = memoryRateLimit.get(key);
      const now = Date.now();
      const count = state && state.lockedUntil > now ? state.failureCount + 1 : 1;
      memoryRateLimit.set(key, {
        failureCount: count,
        lockedUntil: now + 15 * 60 * 1000,
      });
      return;
    }
    throw err;
  }
}

/**
  Reseta as falhas acumuladas após um login bem-sucedido.
 */
export async function clearLoginFailures(
  pool: Pool,
  ip: string,
  email?: string,
  allowFallback?: boolean
): Promise<void> {
  const key = getRateLimitKey(ip, email);
  try {
    await pool.query("DELETE FROM login_rate_limits WHERE key=$1", [key]);
  } catch (err) {
    if (allowFallback ?? config.authMemoryFallback) {
      memoryRateLimit.delete(key);
      return;
    }
    throw err;
  }
}

/**
  Revoga sessões ativas do usuário no banco de dados.
  Se keepTokenHash for fornecido, preserva apenas essa sessão específica (útil após troca de senha).
  Lança erro caso a revogação no PostgreSQL falhe em ambiente de produção.
 */
export async function revokeUserSessions(
  pool: Pool,
  userId: string,
  keepTokenHash?: string,
  allowFallback?: boolean
): Promise<number> {
  try {
    if (keepTokenHash) {
      const res = await pool.query("DELETE FROM user_sessions WHERE user_id=$1 AND token_hash != $2", [userId, keepTokenHash]);
      return res.rowCount ?? 0;
    } else {
      const res = await pool.query("DELETE FROM user_sessions WHERE user_id=$1", [userId]);
      return res.rowCount ?? 0;
    }
  } catch (err) {
    if (allowFallback ?? config.authMemoryFallback) {
      let count = 0;
      for (const [id, session] of memorySessions.entries()) {
        if (session.userId === userId && (!keepTokenHash || session.tokenHash !== keepTokenHash)) {
          memorySessions.delete(id);
          count++;
        }
      }
      return count;
    }
    throw err;
  }
}

/**
  Rotina de limpeza de sessões expiradas e registros de rate limit antigos.
 */
export async function cleanupExpiredSessions(
  pool: Pool,
  allowFallback?: boolean
): Promise<{ expiredSessions: number; expiredRateLimits: number }> {
  try {
    const sessionsRes = await pool.query("DELETE FROM user_sessions WHERE expires_at <= now()");
    const limitsRes = await pool.query("DELETE FROM login_rate_limits WHERE locked_until <= now()");
    return {
      expiredSessions: sessionsRes.rowCount ?? 0,
      expiredRateLimits: limitsRes.rowCount ?? 0,
    };
  } catch (err) {
    if (allowFallback ?? config.authMemoryFallback) {
      let expiredSessions = 0;
      const now = Date.now();
      for (const [id, session] of memorySessions.entries()) {
        if (session.expiresAt <= now) {
          memorySessions.delete(id);
          expiredSessions++;
        }
      }
      let expiredRateLimits = 0;
      for (const [key, state] of memoryRateLimit.entries()) {
        if (state.lockedUntil <= now) {
          memoryRateLimit.delete(key);
          expiredRateLimits++;
        }
      }
      return { expiredSessions, expiredRateLimits };
    }
    throw err;
  }
}
