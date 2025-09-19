
import { FeedClientComponent } from '@/components/FeedClientComponent';
import { AppLayout } from './AppLayout';

// This component is now the main gatekeeper, running on the server.
export default async function HomePage() {
  // The decision logic is now moved to the AuthProvider on the client side.
  // This page will now always render the main authenticated view,
  // and the provider will handle redirects if the user is not logged in.
  return (
    <AppLayout>
      <FeedClientComponent />
    </AppLayout>
  );
}
