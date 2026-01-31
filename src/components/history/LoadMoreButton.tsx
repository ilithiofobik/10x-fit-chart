/**
 * Load More Button Component
 *
 * Button for triggering infinite scroll / pagination.
 */

import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

interface LoadMoreButtonProps {
  hasMore: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export const LoadMoreButton = ({ hasMore, isLoading, onClick }: LoadMoreButtonProps) => {
  if (!hasMore) {
    return null;
  }

  return (
    <div className="flex justify-center pt-4">
      <Button onClick={onClick} disabled={isLoading} variant="outline" className="min-w-[200px]">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Ładowanie...
          </>
        ) : (
          "Pokaż więcej"
        )}
      </Button>
    </div>
  );
};
