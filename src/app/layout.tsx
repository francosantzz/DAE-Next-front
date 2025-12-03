// This is the root layout component for your Next.js app.
// Learn more: https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#root-layout-required
import { Manrope } from 'next/font/google'
import { cn } from '@/lib/utils'
import './globals.css'
import SessionAuthProvider from '@/context/SessionAuthProvider'
import { Sidebar } from '@/components/ui/Sidebar'

const fontHeading = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
})

const fontBody = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
})

export const metadata = {
  title: 'Mi App',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
};

export default function Layout({ 
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body 
        className={cn(
          'antialiased',
          fontHeading.variable,
          fontBody.variable
        )}
      >
        <SessionAuthProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 md:ml-64 pt-16 md:pt-0">
              {children}
            </main>
          </div>
        </SessionAuthProvider>
      </body>
    </html>
  )
}