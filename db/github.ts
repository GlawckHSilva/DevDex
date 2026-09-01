import { getDb } from "./client";

async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createGitHubConnectionState(userId: string, returnPath: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const state = btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  await getDb().prepare(`INSERT INTO github_connection_states (state_hash,user_id,return_path,expires_at)
    VALUES (?,?,?,datetime('now','+10 minutes'))`).bind(await hash(state), userId, returnPath).run();
  return state;
}

export async function consumeGitHubConnectionState(userId: string, state: string) {
  return getDb().prepare(`DELETE FROM github_connection_states WHERE state_hash=? AND user_id=? AND expires_at>CURRENT_TIMESTAMP
    RETURNING return_path AS returnPath`).bind(await hash(state), userId).first<{ returnPath: string }>();
}

export async function saveGitHubInstallation(userId: string, installationId: number, accountLogin: string, accountType: string) {
  await getDb().prepare(`INSERT INTO github_installations (user_id,installation_id,account_login,account_type) VALUES (?,?,?,?)
    ON CONFLICT(user_id,installation_id) DO UPDATE SET account_login=excluded.account_login,account_type=excluded.account_type,updated_at=CURRENT_TIMESTAMP`)
    .bind(userId, installationId, accountLogin, accountType).run();
}

export async function getGitHubInstallation(userId: string, owner: string) {
  return getDb().prepare(`SELECT installation_id AS installationId,account_login AS accountLogin FROM github_installations
    WHERE user_id=? AND lower(account_login)=lower(?) ORDER BY updated_at DESC LIMIT 1`).bind(userId, owner).first<{ installationId: number; accountLogin: string }>();
}

export async function hasGitHubInstallation(userId: string) {
  return Boolean(await getDb().prepare("SELECT 1 AS found FROM github_installations WHERE user_id=? LIMIT 1").bind(userId).first());
}
