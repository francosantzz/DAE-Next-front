"use client";

import { CalendarCheckIcon, SearchIcon } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const Navbar = () => {
  const { data: session } = useSession();
  return (
    <header className="flex items-center justify-between h-16 px-4 border-b border-muted shrink-0 md:px-6">
      {/* Left side - Navigation links */}
      <nav className="flex items-center gap-4 md:gap-6 text-lg font-medium">
      <Link href="#" className="flex items-center gap-2 text-lg font-semibold md:text-base" prefetch={false}>
          <CalendarCheckIcon className="w-6 h-6" />
          <span className="sr-only">Personnel & Schedule</span>
        </Link>
        <Link href="/" className="font-bold" prefetch={false}>
          Home
        </Link>
        {session?.user ? (
          <>
            <Link
              href="/dashboard"
              className="btn btn-primary btn-sm"
            >
              Dashboard
            </Link>
            <Link
              href="/profesionales"
              className="btn btn-primary btn-sm"
            >
              Profesionales
            </Link>
            <Link
              href="/equipos"
              className="btn btn-primary btn-sm"
            >
              Equipos
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="btn btn-danger btn-sm"
            >
              Signout
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="btn btn-danger btn-sm"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="btn btn-danger btn-sm"
            >
              Register
            </Link>
            </>
            )}
      </nav>

      {/* Right side - Search and user avatar */}
      <div className="flex items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="flex-1 ml-auto sm:flex-initial">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search employees..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            />
          </div>
        </form>
        <Button variant="ghost" size="icon" className="rounded-full">
          <img
            src="/placeholder-user.jpg"
            width="32"
            height="32"
            className="rounded-full"
            alt="Avatar"
            style={{ aspectRatio: "32/32", objectFit: "cover" }}
          />
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
