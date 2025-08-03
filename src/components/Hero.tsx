import { Button } from "@/components/ui/button";
import { CheckCircle, Shield, Users } from "lucide-react";
import heroImage from "@/assets/hero-banking-verification.jpg";

const Hero = () => {
  return (
    <section className="pt-20 pb-16 sm:pt-24 sm:pb-20 bg-gradient-to-br from-purple-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Streamline Your{" "}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Contact Point Verification
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Transform your CPV process with our comprehensive digital platform. 
                Enable seamless offline verification, automated reporting, and real-time tracking 
                for all your financial services.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg">
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-purple-300 text-purple-700 hover:bg-purple-50">
                Schedule Demo
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Geo-tagged Photos</span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Secure Reports</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Multi-Role Access</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-purple-600/20 rounded-3xl blur-3xl"></div>
            <img 
              src={heroImage} 
              alt="Contact Point Verification Process" 
              className="relative rounded-3xl shadow-2xl w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;