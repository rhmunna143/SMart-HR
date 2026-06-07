import { AppShell } from './AppShell';

// Every page under this group depends on the authenticated session, which is
// established at runtime via the refresh cookie + access token. Skip prerender.
export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
