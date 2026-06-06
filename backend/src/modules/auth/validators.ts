import { validate } from '../../lib/validate.js';

export const validateSignup = (body: unknown) =>
  validate(body, (v) => ({
    name: v.str('name', { min: 1, max: 120 }),
    email: v.email('email'),
    password: v.str('password', { min: 8, max: 128 }),
  }));

export const validateLogin = (body: unknown) =>
  validate(body, (v) => ({
    email: v.email('email'),
    password: v.str('password', { min: 1, max: 128 }),
  }));
