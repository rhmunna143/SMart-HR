import { one } from '../../lib/query.js';
import type { User, UserRole } from '../../types/index.js';

interface UserWithHash extends User {
  password_hash: string;
}

export async function findUserByEmail(email: string): Promise<UserWithHash | null> {
  return one<UserWithHash>(
    `SELECT id, name, email, password_hash, role, created_at
     FROM users WHERE email = $1`,
    [email.toLowerCase()],
  );
}

export async function findUserById(id: string): Promise<User | null> {
  return one<User>(
    `SELECT id, name, email, role, created_at FROM users WHERE id = $1`,
    [id],
  );
}

export async function insertUser(opts: {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}): Promise<User> {
  const row = await one<User>(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1,$2,$3,$4)
     RETURNING id, name, email, role, created_at`,
    [opts.name, opts.email.toLowerCase(), opts.passwordHash, opts.role],
  );
  return row!;
}
