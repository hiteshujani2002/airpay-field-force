import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-banking-verification.jpg";

const Hero = () => {
  return (
    <section className="pt-20 pb-16 sm:pt-24 sm:pb-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                India's first integrated{" "}
                <span className="text-primary">
                  Contact Point Verification
                </span>{" "}
                platform
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Transform your CPV process with our comprehensive digital platform. 
                Enable seamless offline verification, automated reporting, and real-time tracking 
                for all your financial services.
              </p>
            </div>

            <div className="flex justify-center sm:justify-start">
              <Button size="lg" className="text-lg px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold" asChild>
                <a href="/dashboard">Get Started Now</a>
              </Button>
            </div>
          </div>

          <div className="relative flex justify-center">
            <img 
              src={heroImage} 
              alt="Contact Point Verification Process" 
              className="rounded-2xl shadow-lg w-full max-w-md h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;