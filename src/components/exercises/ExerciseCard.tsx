import { MoreVertical, Edit, Archive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { ExerciseCardProps } from "@/types";

/**
 * Karta pojedynczego ćwiczenia
 */
export default function ExerciseCard({ exercise, onEdit, onArchive }: ExerciseCardProps) {
  const canModify = !exercise.is_system;

  // Mapowanie typu na label
  const typeLabel = exercise.type === "strength" ? "Siłowe" : "Cardio";

  // Mapowanie statusu na badge
  const statusBadge = exercise.is_system ? (
    <Badge variant="secondary">Systemowe</Badge>
  ) : exercise.is_archived ? (
    <Badge variant="outline">Zarchiwizowane</Badge>
  ) : (
    <Badge variant="default">Własne</Badge>
  );

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{exercise.name}</CardTitle>
          {canModify && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Otwórz menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(exercise)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edytuj
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onArchive(exercise)}
                  className="text-destructive focus:text-destructive"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archiwizuj
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Badge variant="outline">{typeLabel}</Badge>
          {statusBadge}
        </div>
      </CardContent>
    </Card>
  );
}
