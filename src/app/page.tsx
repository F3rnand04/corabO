
import { FeedClientComponent } from '@/components/FeedClientComponent';
import { AppLayout } from './AppLayout';

// This component is now simplified. It no longer handles auth logic.
// The AuthProvider will handle redirects on the client-side.
export default function HomePage() {
  return (
    <AppLayout>
      <FeedClientComponent />
    </AppLayout>
  );
}
