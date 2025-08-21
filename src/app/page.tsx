
import { FeedClientComponent } from "@/components/FeedClientComponent";
import * as Actions from '@/lib/actions';

// This is now a "dumb" server component.
// Its only job is to fetch the initial data in a server context.
export default async function HomePage() {
  
  // Fetch initial data on the server.
  // This approach is safer because it's part of the page lifecycle.
  // If this fails, Next.js has better ways of handling the error than a context-based approach.
  const { publications: initialPublications } = await Actions.getFeed({ limitNum: 10 });

  // Pass the initial data to the client component.
  // The client component will handle all the state, filtering, and interaction logic.
  return (
    <main className="flex-1">
      <FeedClientComponent initialPublications={initialPublications} />
    </main>
  );
}
