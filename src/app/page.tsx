import { PublicationCard } from "@/components/PublicationCard";
import type { GalleryImage } from "@/lib/types";
import * as Actions from '@/lib/actions';
import { FeedClientComponent } from "@/components/FeedClientComponent";

// This is now a Server Component
export default async function HomePage() {
  
  // 1. Fetch initial data directly on the server.
  // This happens before the page is sent to the client.
  const initialFeed = await Actions.getFeed({});
  
  // 2. Pass the server-fetched data as a prop to a Client Component.
  return (
    <main className="space-y-4">
       <FeedClientComponent initialPublications={initialFeed.publications || []} />
    </main>
  );
}
