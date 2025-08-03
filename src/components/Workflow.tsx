import { Button } from "@/components/ui/button";
import onboardingImage from "@/assets/workflow-onboarding.jpg";
import formsImage from "@/assets/workflow-forms.jpg";
import assignmentImage from "@/assets/workflow-assignment.jpg";
import verificationImage from "@/assets/workflow-verification.jpg";
import reportsImage from "@/assets/workflow-reports.jpg";

const Workflow = () => {
  const steps = [
    {
      number: "01",
      title: "Company & Agency Onboarding",
      description: "Super Admin onboards companies and agencies, creating initial admin users and establishing mappings.",
      image: onboardingImage,
      cta: "Start Onboarding"
    },
    {
      number: "02", 
      title: "CPV Form Creation",
      description: "Client Admins design customizable forms with specific field types and photo requirements.",
      image: formsImage,
      cta: "Create a CPV Form"
    },
    {
      number: "03",
      title: "Lead Assignment",
      description: "Client Admins upload user data and assign leads to Agency Lead Assigners for distribution.",
      image: assignmentImage,
      cta: "Assign Now"
    },
    {
      number: "04",
      title: "Agent Assignment & On-Site Verification",
      description: "Lead Assigners distribute leads to individual CPV Agents who visit locations, complete forms, and capture geo-tagged photos using mobile devices.",
      image: verificationImage,
      cta: "Start Verification"
    },
    {
      number: "05",
      title: "Report Generation",
      description: "Completed verifications automatically generate comprehensive digital reports for all stakeholders.",
      image: reportsImage,
      cta: "Generate Reports"
    }
  ];

  return (
    <section id="workflow" className="py-16 sm:py-20 bg-gradient-to-br from-primary-light to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Streamlined CPV Workflow
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From onboarding to report generation, our platform handles every step of the verification process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="group">
              <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-soft hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 hover:bg-white/90">
                {/* Image Container */}
                <div className="relative mb-6 mx-auto w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <img 
                    src={step.image} 
                    alt={step.title}
                    className="w-16 h-16 object-cover rounded-xl"
                  />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xs font-bold text-white">{step.number}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4 text-center">
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {step.description}
                  </p>
                  
                  {/* CTA Button */}
                  <div className="pt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-white/50 border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 rounded-xl px-6"
                    >
                      {step.cta}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Workflow;