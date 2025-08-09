import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-heading font-bold text-primary-500">Power2ADAPT</h1>
            </Link>
          </div>

          {isAuthenticated && (
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/classes">
                  <Button
                    variant={location === "/classes" ? "default" : "ghost"}
                    className="text-gray-700 hover:text-primary-500"
                  >
                    Programs
                  </Button>
                </Link>
                <Link href="/">
                  <Button
                    variant={location === "/" ? "default" : "ghost"}
                    className="text-gray-700 hover:text-primary-500"
                  >
                    My Family
                  </Button>
                </Link>
                {((user as any)?.role === "coach" || (user as any)?.role === "admin") && (
                  <Link href="/attendance">
                    <Button
                      variant={location === "/attendance" ? "default" : "ghost"}
                      className="text-gray-700 hover:text-primary-500"
                    >
                      Attendance
                    </Button>
                  </Link>
                )}
                {(user as any)?.role === "admin" && (
                  <>
                    <Link href="/admin">
                      <Button
                        variant={location === "/admin" ? "default" : "ghost"}
                        className="text-gray-700 hover:text-primary-500"
                      >
                        Admin
                      </Button>
                    </Link>
                    <Link href="/analytics">
                      <Button
                        variant={location === "/analytics" ? "default" : "ghost"}
                        className="text-gray-700 hover:text-primary-500"
                      >
                        Analytics
                      </Button>
                    </Link>
                    <Link href="/import">
                      <Button
                        variant={location === "/import" ? "default" : "ghost"}
                        className="text-gray-700 hover:text-primary-500"
                      >
                        Import Data
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="hidden md:block text-gray-700">
                  Hi, {(user as any)?.firstName}!
                </span>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="text-primary-500 hover:text-primary-700"
                >
                  Logout
                </Button>
              </>
            ) : (
              <div className="text-gray-700">Not authenticated</div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && isAuthenticated && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link href="/classes">
                <Button
                  variant={location === "/classes" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Programs
                </Button>
              </Link>
              <Link href="/">
                <Button
                  variant={location === "/" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Family
                </Button>
              </Link>
              {(user as any)?.role === "admin" && (
                <Link href="/admin">
                  <Button
                    variant={location === "/admin" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
