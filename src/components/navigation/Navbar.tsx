"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, User, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (status === "loading") {
    return (
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-[#1E3A8A]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E3A8A]">GeoSafe</h1>
          </div>
          <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
        </div>
      </header>
    );
  }

  if (!session) {
    return (
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-[#1E3A8A]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E3A8A]">GeoSafe</h1>
          </Link>
          <div className="flex space-x-2 sm:space-x-4">
            <Link href="/auth/signin">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-xs sm:text-sm" size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href={session.user?.role === "ADMIN" ? "/admin" : "/user"} className="flex items-center space-x-2">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-[#1E3A8A]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E3A8A]">GeoSafe</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {session.user?.role === "ADMIN" ? (
              <>
                <Link href="/admin" className="text-sm font-medium text-gray-700 hover:text-[#1E3A8A]">
                  Dashboard
                </Link>
              </>
            ) : (
              <Link href="/user" className="text-sm font-medium text-gray-700 hover:text-[#1E3A8A]">
                Dashboard
              </Link>
            )}
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-[#1E3A8A] text-white">
                      {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{session.user?.name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {session.user?.email}
                    </p>
                    <p className="text-xs text-[#1E3A8A] font-medium">
                      {session.user?.role}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col space-y-4">
              {session.user?.role === "ADMIN" ? (
                <>
                  <Link 
                    href="/admin" 
                    className="text-sm font-medium text-gray-700 hover:text-[#1E3A8A]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <Link 
                  href="/user" 
                  className="text-sm font-medium text-gray-700 hover:text-[#1E3A8A]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              
              <div className="flex items-center space-x-3 pt-2 border-t">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#1E3A8A] text-white">
                    {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{session.user?.name}</p>
                  <p className="text-xs text-gray-500">{session.user?.email}</p>
                  <p className="text-xs text-[#1E3A8A] font-medium">{session.user?.role}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
