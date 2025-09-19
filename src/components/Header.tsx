import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import CPVHubLogo from "./CPVHubLogo";
import { AuthDialog } from "./AuthDialog";

const Header = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignInClick = () => {
    setAuthMode('signin');
    setAuthDialogOpen(true);
  };

  const handleGetStartedClick = () => {
    setAuthMode('signup');
    setAuthDialogOpen(true);
  };

  const navItems = [
    { href: "#features", label: "Business" },
    { href: "#workflow", label: "Solutions" },
    { href: "#pricing", label: "Platform" },
    { href: "#contact", label: "About Us" }
  ];

  return (
    <>
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-50 border-b border-gray-100">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 lg:py-4">
            <div className="flex items-center space-x-3">
              <CPVHubLogo className="h-7 lg:h-8 w-auto" />
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => (
                <a 
                  key={item.href}
                  href={item.href} 
                  className="text-gray-600 hover:text-primary transition-colors font-medium"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden sm:flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-600 hover:text-primary font-medium"
                onClick={handleSignInClick}
              >
                Sign In
              </Button>
              <Button 
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-lg"
                onClick={handleGetStartedClick}
              >
                Sign Up
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-2 sm:hidden">
              <Button 
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-3 py-2 rounded-lg text-xs"
                onClick={handleGetStartedClick}
              >
                Sign Up
              </Button>
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col h-full">
                    <div className="py-4">
                      <CPVHubLogo className="h-8 w-auto" />
                    </div>
                    
                    <nav className="flex-1 space-y-4 py-4">
                      {navItems.map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors font-medium"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.label}
                        </a>
                      ))}
                    </nav>
                    
                    <div className="border-t pt-4 space-y-3">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-gray-600 hover:text-primary font-medium"
                        onClick={() => {
                          handleSignInClick();
                          setMobileMenuOpen(false);
                        }}
                      >
                        Sign In
                      </Button>
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
                        onClick={() => {
                          handleGetStartedClick();
                          setMobileMenuOpen(false);
                        }}
                      >
                        Sign Up
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      
      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen}
        defaultMode={authMode}
      />
    </>
  );
};

export default Header;