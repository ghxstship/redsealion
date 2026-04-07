import EmptyState from '@/components/ui/EmptyState';
import { Star } from 'lucide-react';

export default function FavoritesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Favorites
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Access all your starred projects, tasks, and files.
        </p>
      </div>

      <EmptyState
        icon={<Star className="w-8 h-8" />}
        message="No favorites yet"
        description="Bookmark items across the platform using the star icon to access them quickly here."
      />
    </div>
  );
}
