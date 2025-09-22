'use client';

import { FeedView } from '@/components/feed/FeedView';

// This component is the main entry point of the app.
// It now directly renders the FeedView to avoid chunk loading errors.
export default function HomePage() {
  return <FeedView />;
}
