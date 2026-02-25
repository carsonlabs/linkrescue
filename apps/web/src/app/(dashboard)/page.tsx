<<<<<<< Updated upstream
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  redirect('/sites');
=======
// Dummy page to prevent manifest generation errors
// This route redirects to /sites via middleware
export const dynamic = 'force-dynamic';

export default function DashboardRootPage() {
  return null;
>>>>>>> Stashed changes
}
