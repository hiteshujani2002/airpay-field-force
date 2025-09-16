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
    <section id="workflow" className="py-16 sm:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From onboarding to report generation, our platform handles every step of the verification process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-white">{step.number}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {step.description}
                  </p>
                  <Button 
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2 rounded-lg"
                  >
                    {step.cta}
                  </Button>
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <img 
                  src={step.image} 
                  alt={step.title}
                  className="w-48 h-32 object-cover rounded-lg"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Workflow;