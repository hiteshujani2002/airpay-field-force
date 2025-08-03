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

        <div className="space-y-12 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="group">
              <div className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-12 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                {/* Content Side */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-lg font-bold text-white">{step.number}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                      {step.title}
                    </h3>
                  </div>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  
                  <div className="pt-2">
                    <Button 
                      variant="default" 
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {step.cta}
                    </Button>
                  </div>
                </div>

                {/* Image Side */}
                <div className="flex-1 flex justify-center">
                  <div className="relative w-80 h-80 rounded-3xl overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center shadow-soft hover:shadow-elegant transition-all duration-500 group-hover:scale-105">
                    <img 
                      src={step.image} 
                      alt={step.title}
                      className="w-64 h-64 object-cover rounded-2xl"
                    />
                  </div>
                </div>
              </div>
              
              {/* Separator line between sections (except last) */}
              {index < steps.length - 1 && (
                <div className="mt-12 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Workflow;