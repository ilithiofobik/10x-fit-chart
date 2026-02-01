import { useState } from "react";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface MobileMenuProps {
  user: {
    email: string;
    id: string;
  };
}

export function MobileMenu({ user }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/app/dashboard", label: "Dashboard" },
    { href: "/app/log", label: "Loguj" },
    { href: "/app/history", label: "Historia" },
    { href: "/app/exercises", label: "Ćwiczenia" },
  ];

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Otwórz menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.email}</p>
              </div>
            </div>

            <Separator />

            {/* Navigation Links */}
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-foreground hover:bg-accent transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <Separator />

            {/* Profile Link */}
            <a
              href="/app/profile"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-foreground hover:bg-accent transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="h-4 w-4" />
              Profil
            </a>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
