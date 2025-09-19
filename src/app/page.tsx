import { AppLayout } from './AppLayout';
import ClientLayout from './ClientLayout';
import FeedPage from './feed/page';

// This component is the main entry point of the app.
// It renders the AppLayout which contains the main content.
export default function HomePage() {
  return (
    <AppLayout>
      <ClientLayout>
        <FeedPage />
      </ClientLayout>
    </AppLayout>
  );
}
