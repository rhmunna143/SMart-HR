import 'dotenv/config';
import { pool } from './pool.js';

async function main() {
  await pool.query(`
    DROP TABLE IF EXISTS notifications, activity_logs, attachments, comments,
                          tasks, project_members, projects, users, app_settings,
                          pgmigrations CASCADE;
    DROP TYPE IF EXISTS task_status, task_priority, project_status, user_role CASCADE;
    DROP FUNCTION IF EXISTS set_updated_at() CASCADE;
  `);
  console.log('Database reset.');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
