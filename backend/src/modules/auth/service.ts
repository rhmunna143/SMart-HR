import bcrypt from 'bcryptjs';
import { ConflictError, UnauthorizedError } from '../../lib/errors.js';
import { signAccess, signRefresh, verifyRefresh } from '../../lib/jwt.js';
import { logActivity } from '../../lib/activity.js';
import { findUserByEmail, findUserById, insertUser } from './queries.js';
import type { User } from '../../types/index.js';

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

function issueTokens(user: User): AuthResult {
  const accessToken = signAccess({ sub: user.id, role: user.role, email: user.email });
  const refreshToken = signRefresh({ sub: user.id, v: 1 });
  return { user, accessToken, refreshToken };
}

export async function signup(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const existing = await findUserByEmail(input.email);
  if (existing) throw new ConflictError('An account with this email already exists.');
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await insertUser({
    name: input.name,
    email: input.email,
    passwordHash,
    role: 'TEAM_MEMBER',
  });
  await logActivity({
    actorId: user.id,
    action: 'USER_SIGNED_UP',
    entityType: 'MEMBER',
    entityId: user.id,
    message: `${user.name} signed up`,
  });
  return issueTokens(user);
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  const row = await findUserByEmail(input.email);
  if (!row) throw new UnauthorizedError('Invalid email or password');
  const ok = await bcrypt.compare(input.password, row.password_hash);
  if (!ok) throw new UnauthorizedError('Invalid email or password');
  const { password_hash: _omit, ...user } = row;
  return issueTokens(user);
}

export async function demoLogin(): Promise<AuthResult> {
  const row = await findUserByEmail('admin@demo.test');
  if (!row) throw new UnauthorizedError('Demo account not seeded');
  const { password_hash: _omit, ...user } = row;
  return issueTokens(user);
}

export async function refresh(token: string): Promise<AuthResult> {
  let payload;
  try {
    payload = verifyRefresh(token);
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }
  const user = await findUserById(payload.sub);
  if (!user) throw new UnauthorizedError('User no longer exists');
  return issueTokens(user);
}
