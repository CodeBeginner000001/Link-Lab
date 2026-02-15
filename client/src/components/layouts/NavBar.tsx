"use client";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import ToggleTheme from "@/components/ui/ToggleTheme";
import { useAuth } from "@/Provider/AuthUserProvider";
import { navItems } from "@/utils/content";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
export default function NavBar() {
  const user = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 nav-background backdrop-blur-lg border-b border-[hsl(var(--border)/0.5)]"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <Logo size="sm" />
          </Link>
          {/* Nav List desktop view */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((items) => (
              <a
                key={items.label}
                href={items.href}
                className="text-mute-foreground font-medium transition-colors "
              >
                {items.label}
              </a>
            ))}
          </div>
          {/* Action */}
          <div className="hidden md:flex items-center gap-3">
            <ToggleTheme />
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
                
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>

                <Link href="/signup">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* mobile view */}
          <div className="flex md:hidden items-center gap-2">
            <ToggleTheme />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {/* Mobile Nav */}
        {isOpen && (
          <motion.div
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="md:hidden py-4 border-t border-[hsl(var(--border)/0.5)] overflow-hidden"
          >
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors font-medium text-center"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 pt-4 border-t border-[hsl(var(--border)/0.5)] justify-center">
                <Link href="/login">
                  <Button variant="outline" className="mx-auto w-full sm:w-60">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="mb-4 mx-auto w-full sm:w-60">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
