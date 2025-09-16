import { useState } from "react";
import { Button } from "@/components/ui/button";
import CPVHubLogo from "./CPVHubLogo";
import { AuthDialog } from "./AuthDialog";

const Header = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const handleSignInClick = () => {
    setAuthMode('signin');
    setAuthDialogOpen(true);
  };

  const handleGetStartedClick = () => {
    setAuthMode('signup');
    setAuthDialogOpen(true);
  };

  return (
    <>
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <CPVHubLogo className="h-8 w-auto" />
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-primary transition-colors font-medium">
                Business
              </a>
              <a href="#workflow" className="text-gray-600 hover:text-primary transition-colors font-medium">
                Solutions
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-primary transition-colors font-medium">
                Platform
              </a>
              <a href="#contact" className="text-gray-600 hover:text-primary transition-colors font-medium">
                About Us
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                className="hidden sm:inline-flex text-gray-600 hover:text-primary font-medium"
                onClick={handleSignInClick}
              >
                Sign In
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2 rounded-lg"
                onClick={handleGetStartedClick}
              >
                Sign Up
              </Button>
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