import { AppLayout } from './AppLayout';
import FeedPage from './feed/page';

// This component is the main entry point of the app.
// It renders the AppLayout which contains the main content.
export default function HomePage() {
  return (
    <AppLayout>
      <FeedPage />
    </AppLayout>
  );
}
