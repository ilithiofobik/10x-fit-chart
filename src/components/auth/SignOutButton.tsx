import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('Nie udało się wylogować');
      }
      
      toast.success('Wylogowano pomyślnie');
      window.location.href = '/';
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nie udało się wylogować');
      setIsLoading(false);
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleSignOut} 
      disabled={isLoading}
    >
      {isLoading ? 'Wylogowywanie...' : 'Wyloguj się'}
    </Button>
  );
}
