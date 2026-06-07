import { validate } from '../../lib/validate.js';

export const validateCreateComment = (body: unknown) =>
  validate(body, (v) => ({
    body: v.str('body', { min: 1, max: 2000 }),
  }));
