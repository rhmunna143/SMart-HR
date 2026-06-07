import { validate } from '../../lib/validate.js';

export const validateAddProjectMember = (body: unknown) =>
  validate(body, (v) => ({
    user_id: v.uuid('user_id'),
  }));
