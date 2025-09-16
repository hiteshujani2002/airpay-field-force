import { Button } from "@/components/ui/button";
import { Check, Mail, Phone } from "lucide-react";

const Pricing = () => {
  return (
    <section id="pricing" className="py-16 sm:py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Get started with our comprehensive CPV platform tailored for your business needs
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 lg:p-12 shadow-sm">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left side - Features */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">Enterprise Solution</h3>
                  <p className="text-lg text-gray-600">
                    Powerful CPV platform designed for financial institutions and enterprises requiring robust verification workflows.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    "Unlimited CPV forms and verifications",
                    "Multi-role user management",
                    "Advanced geo-location tracking",
                    "Automated report generation",
                    "Offline verification capabilities", 
                    "Real-time analytics dashboard",
                    "API integrations",
                    "24/7 premium support",
                    "Custom branding options",
                    "SOC 2 compliance"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right side - Contact */}
              <div className="bg-blue-50 rounded-xl p-8 text-center space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xl font-semibold text-gray-900">Ready to Transform Your CPV Process?</h4>
                  <p className="text-gray-600">
                    Contact our sales team to discuss your specific requirements and get a customized quote for your organization.
                  </p>
                </div>

                <div className="space-y-4">
                  <Button 
                    size="lg" 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 text-lg rounded-lg"
                    asChild
                  >
                    <a href="/dashboard">
                      <Mail className="w-5 h-5 mr-2" />
                      Contact Sales
                    </a>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full border-primary text-primary hover:bg-primary/5 font-semibold py-4 text-lg rounded-lg"
                    asChild
                  >
                    <a href="/dashboard">
                      <Phone className="w-5 h-5 mr-2" />
                      Schedule a Call
                    </a>
                  </Button>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Trusted by 500+ financial institutions worldwide
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;