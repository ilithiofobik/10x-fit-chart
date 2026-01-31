/**
 * Workout Editor Actions Component
 *
 * Action buttons for saving, deleting, and canceling workout edits.
 */

import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Save, Trash2, X, Loader2 } from "lucide-react";

interface WorkoutEditorActionsProps {
  isValid: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  onCancel: () => void;
}

export const WorkoutEditorActions = ({
  isValid,
  isSaving,
  isDeleting,
  onSave,
  onDelete,
  onCancel,
}: WorkoutEditorActionsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center border-t pt-6">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="gap-2" disabled={isDeleting || isSaving}>
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Usuwanie...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Usuń trening
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć ten trening?</AlertDialogTitle>
            <AlertDialogDescription>
              Tej operacji nie można cofnąć. Trening zostanie trwale usunięty z Twojej historii.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Usuń trening
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex gap-3">
        <Button onClick={onCancel} variant="ghost" disabled={isSaving || isDeleting} className="gap-2">
          <X className="h-4 w-4" />
          Anuluj
        </Button>
        <Button onClick={onSave} disabled={!isValid || isSaving || isDeleting} className="gap-2">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Zapisywanie...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Zapisz zmiany
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
