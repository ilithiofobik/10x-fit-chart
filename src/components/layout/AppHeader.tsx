import { UserMenu } from "./UserMenu";
import { MobileMenu } from "./MobileMenu";

interface AppHeaderProps {
  user: {
    email: string;
    id: string;
  };
}

export function AppHeader({ user }: AppHeaderProps) {
  const navItems = [
    { href: "/app/dashboard", label: "Dashboard" },
    { href: "/app/log", label: "Loguj" },
    { href: "/app/history", label: "Historia" },
    { href: "/app/exercises", label: "Ćwiczenia" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <a
          href="/app/dashboard"
          className="font-bold text-xl bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent"
        >
          10xFitChart
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right Side: User Menu (desktop) and Mobile Menu */}
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <UserMenu user={user} />
          </div>
          <MobileMenu user={user} />
        </div>
      </div>
    </header>
  );
}
