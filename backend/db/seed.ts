import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

/**
 * Idempotent seed: wipes the seedable tables and re-inserts demo data.
 * Demo credentials are documented in the root README.
 */
async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clear in FK-safe order
    await client.query(`
      TRUNCATE TABLE notifications, activity_logs, attachments, comments,
                     tasks, project_members, projects, users
      RESTART IDENTITY CASCADE;
    `);

    const hash = (p: string) => bcrypt.hashSync(p, 10);

    const insertUser = async (
      name: string,
      email: string,
      password: string,
      role: 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER',
    ) => {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1,$2,$3,$4) RETURNING id`,
        [name, email, hash(password), role],
      );
      return rows[0]!.id;
    };

    const adminId = await insertUser('Demo Admin', 'admin@demo.test', 'Admin@123', 'ADMIN');
    const pmId    = await insertUser('Demo PM',    'pm@demo.test',    'Pm@12345',  'PROJECT_MANAGER');
    const tm1Id   = await insertUser('Demo Member 1', 'member1@demo.test', 'Member@1', 'TEAM_MEMBER');
    const tm2Id   = await insertUser('Demo Member 2', 'member2@demo.test', 'Member@2', 'TEAM_MEMBER');

    const insertProject = async (
      name: string,
      description: string,
      deadline: string,
      status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD',
      createdBy: string,
    ) => {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO projects (name, description, deadline, status, created_by_id)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [name, description, deadline, status, createdBy],
      );
      return rows[0]!.id;
    };

    const proj1 = await insertProject(
      'Mobile App Redesign',
      'Refresh the onboarding flow and dashboard screens.',
      '2026-09-30',
      'ACTIVE',
      pmId,
    );
    const proj2 = await insertProject(
      'Q3 Marketing Site',
      'Build the new pricing and case-studies pages.',
      '2026-08-15',
      'ACTIVE',
      adminId,
    );

    for (const [pid, uid] of [
      [proj1, tm1Id],
      [proj1, tm2Id],
      [proj2, tm1Id],
    ] as const) {
      await client.query(
        `INSERT INTO project_members (project_id, user_id) VALUES ($1,$2)`,
        [pid, uid],
      );
    }

    const insertTask = async (
      projectId: string,
      title: string,
      description: string,
      assignee: string | null,
      due: string,
      priority: 'HIGH' | 'MEDIUM' | 'LOW',
      status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED',
      createdBy: string,
    ) => {
      await client.query(
        `INSERT INTO tasks
           (project_id, title, description, assignee_id, due_date, priority, status, created_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [projectId, title, description, assignee, due, priority, status, createdBy],
      );
    };

    await insertTask(proj1, 'Wireframe onboarding',  'Sketch the 3-step onboarding.', tm1Id, '2026-07-10', 'HIGH',   'IN_PROGRESS', pmId);
    await insertTask(proj1, 'Build dashboard cards', 'Implement KPI cards.',          tm2Id, '2026-07-20', 'MEDIUM', 'TODO',        pmId);
    await insertTask(proj1, 'Polish empty states',   'Add illustrations + copy.',     null,   '2026-08-01', 'LOW',    'TODO',        pmId);
    await insertTask(proj2, 'Draft pricing copy',    'Headline + tiers + FAQ.',       tm1Id, '2026-07-05', 'HIGH',   'TODO',        adminId);
    await insertTask(proj2, 'Implement case study',  'Build the case-study template.', tm1Id, '2026-07-25', 'MEDIUM', 'TODO',       adminId);

    await client.query('COMMIT');
    console.log('Seed complete.');
    console.log('Demo credentials:');
    console.log('  Admin           admin@demo.test   / Admin@123');
    console.log('  Project Manager pm@demo.test      / Pm@12345');
    console.log('  Team Member 1   member1@demo.test / Member@1');
    console.log('  Team Member 2   member2@demo.test / Member@2');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
