import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ConfirmArchiveDialogProps } from "@/types";

/**
 * Dialog potwierdzenia archiwizacji ćwiczenia
 */
export default function ConfirmArchiveDialog({
  open,
  exercise,
  isDeleting,
  onOpenChange,
  onConfirm,
}: ConfirmArchiveDialogProps) {
  if (!exercise) {
    return null;
  }

  async function handleConfirm() {
    await onConfirm();
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Archiwizuj ćwiczenie</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>
              Czy na pewno chcesz zarchiwizować ćwiczenie{" "}
              <span className="font-semibold text-foreground">{exercise.name}</span>?
            </p>
            <p>
              <strong>Konsekwencje:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Ćwiczenie zniknie z listy wyboru przy dodawaniu treningu</li>
              <li>Historyczne treningi zawierające to ćwiczenie pozostaną bez zmian</li>
              <li>Możesz przywrócić ćwiczenie kontaktując się z supportem</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Archiwizowanie..." : "Archiwizuj"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
