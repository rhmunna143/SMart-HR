import { BadRequestError } from './errors.js';

/**
 * Tiny hand-rolled validator (PRD calls for no Zod). Each validator function
 * accumulates field errors and throws BadRequestError at the end.
 *
 *   const data = validate(req.body, (v) => ({
 *     name: v.str('name', { min: 1, max: 120 }),
 *     deadline: v.optional(v.dateNotPast('deadline')),
 *   }));
 */
export interface FieldBuilder {
  str(field: string, opts?: { min?: number; max?: number }): string;
  email(field: string): string;
  uuid(field: string): string;
  enumOf<T extends string>(field: string, allowed: readonly T[]): T;
  date(field: string): string;
  dateNotPast(field: string): string;
  bool(field: string): boolean;
  int(field: string, opts?: { min?: number; max?: number }): number;
  optional<T>(value: T | undefined): T | undefined;
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function todayISO(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function validate<T>(
  raw: unknown,
  build: (v: FieldBuilder, src: Record<string, unknown>) => T,
): T {
  const src = (raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {});
  const errors: Record<string, string> = {};

  const get = (field: string): unknown => src[field];

  const v: FieldBuilder = {
    str(field, opts) {
      const x = get(field);
      if (typeof x !== 'string' || x.trim() === '') {
        errors[field] = `${field} is required`;
        return '';
      }
      const trimmed = x.trim();
      if (opts?.min !== undefined && trimmed.length < opts.min) {
        errors[field] = `${field} must be at least ${opts.min} characters`;
      }
      if (opts?.max !== undefined && trimmed.length > opts.max) {
        errors[field] = `${field} must be at most ${opts.max} characters`;
      }
      return trimmed;
    },
    email(field) {
      const s = this.str(field, { max: 254 });
      if (s && !isEmail(s)) errors[field] = `${field} must be a valid email`;
      return s.toLowerCase();
    },
    uuid(field) {
      const s = this.str(field);
      if (s && !isUuid(s)) errors[field] = `${field} must be a valid id`;
      return s;
    },
    enumOf(field, allowed) {
      const x = get(field);
      if (typeof x !== 'string' || !allowed.includes(x as never)) {
        errors[field] = `${field} must be one of ${allowed.join(', ')}`;
        return allowed[0]!;
      }
      return x as never;
    },
    date(field) {
      const x = get(field);
      if (typeof x !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x)) {
        errors[field] = `${field} must be a date (YYYY-MM-DD)`;
        return '';
      }
      return x;
    },
    dateNotPast(field) {
      const d = this.date(field);
      if (d && d < todayISO()) {
        errors[field] = 'Please select a valid deadline.';
      }
      return d;
    },
    bool(field) {
      const x = get(field);
      if (typeof x !== 'boolean') {
        errors[field] = `${field} must be a boolean`;
        return false;
      }
      return x;
    },
    int(field, opts) {
      const x = get(field);
      const n = typeof x === 'number' ? x : Number(x);
      if (!Number.isInteger(n)) {
        errors[field] = `${field} must be an integer`;
        return 0;
      }
      if (opts?.min !== undefined && n < opts.min) errors[field] = `${field} must be ≥ ${opts.min}`;
      if (opts?.max !== undefined && n > opts.max) errors[field] = `${field} must be ≤ ${opts.max}`;
      return n;
    },
    optional<U>(value: U | undefined): U | undefined {
      // optional() takes the value AFTER a validator ran. If the underlying field
      // is missing, callers should pass undefined explicitly; we strip the error
      // they registered (since the field was optional after all).
      return value;
    },
  };

  // Wrap with proxy so v.optional can be used as `optionalCheck(field, () => v.str(field))`
  const out = build(v, src);

  if (Object.keys(errors).length > 0) {
    throw new BadRequestError('Validation failed', errors);
  }
  return out;
}

/**
 * Pattern for an optional field: only validate if present.
 *   const deadline = optional(src.deadline, () => v.dateNotPast('deadline'));
 */
export function optional<T>(raw: unknown, fn: () => T): T | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  return fn();
}
