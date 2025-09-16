import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-banking-verification.jpg";

const Hero = () => {
  return (
    <section className="pt-20 pb-16 sm:pt-24 sm:pb-20 bg-gradient-to-br from-blue-50 to-white">
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

            <div className="flex justify-center sm:justify-start">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-blue-300 text-blue-700 hover:bg-blue-50" asChild>
                <a href="/dashboard">Schedule Demo</a>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-blue-600/20 rounded-3xl blur-3xl"></div>
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