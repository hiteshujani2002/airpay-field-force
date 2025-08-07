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
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-50 border-b border-purple-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <CPVHubLogo className="h-8 w-auto" />
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-purple-600 transition-colors">
                Features
              </a>
              <a href="#workflow" className="text-gray-600 hover:text-purple-600 transition-colors">
                Workflow
              </a>
              <a href="#contact" className="text-gray-600 hover:text-purple-600 transition-colors">
                Contact
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                className="hidden sm:inline-flex text-gray-600 hover:text-purple-600"
                onClick={handleSignInClick}
              >
                Sign In
              </Button>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                onClick={handleGetStartedClick}
              >
                Get Started
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