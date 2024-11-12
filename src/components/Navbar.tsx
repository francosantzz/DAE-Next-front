"use client";

import { CalendarCheckIcon } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard", authRequired: true },
    { href: "/profesionales", label: "Profesionales", authRequired: true },
    { href: "/equipos", label: "Equipos", authRequired: true },
    { href: "/secciones", label: "Secciones", authRequired: true },
    { href: "/escuelas", label: "Escuelas", authRequired: true },
  ];

  return (
    <header className="flex items-center justify-between h-16 px-4 border-b border-muted shrink-0 md:px-6">
      {/* Left side - Navigation links */}
      <nav className="flex items-center gap-4 md:gap-6 text-lg font-medium">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base" prefetch={false}>
          <CalendarCheckIcon className="w-6 h-6" />
          <span className="sr-only">Personnel & Schedule</span>
        </Link>
        {navItems.map((item) => (
          ((item.authRequired && session?.user) || !item.authRequired) && (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === item.href ? "text-foreground font-bold" : "text-foreground/60"
              )}
              prefetch={false}
            >
              {item.label}
            </Link>
          )
        ))}
      </nav>

      {/* Right side - Authentication buttons */}
      <div className="flex items-center gap-4 md:ml-auto">
        {session?.user ? (
          <Button
            onClick={() => signOut({ callbackUrl: '/' })}
            variant="ghost"
            className="text-foreground/60 hover:text-foreground/80 transition-colors font-medium"
          >
            Signout
          </Button>
        ) : (
          <>
            <Button
              asChild
              variant="ghost"
              className={cn(
                "text-foreground/60 hover:text-foreground/80 transition-colors font-medium",
                pathname === "/login" && "text-foreground font-bold"
              )}
            >
              <Link href="/login" prefetch={false}>Login</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className={cn(
                "text-foreground/60 hover:text-foreground/80 transition-colors font-medium",
                pathname === "/register" && "text-foreground font-bold"
              )}
            >
              <Link href="/register" prefetch={false}>Register</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
