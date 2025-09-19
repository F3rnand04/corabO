import FeedPage from './feed/page';

// This component is the main entry point of the app.
// It now directly renders the FeedPage, as the layout is handled by RootLayout and ClientLayout.
export default function HomePage() {
  return <FeedPage />;
}
