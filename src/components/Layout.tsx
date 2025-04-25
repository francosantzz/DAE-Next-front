import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        {/* Add your header content here */}
        <nav className="container mx-auto p-4">
          {/* Add navigation items */}
        </nav>
      </header>

      <main className="container mx-auto p-4">
        {children}
      </main>

      <footer className="border-t">
        {/* Add your footer content here */}
        <div className="container mx-auto p-4">
          {/* Add footer content */}
        </div>
      </footer>
    </div>
  );
}