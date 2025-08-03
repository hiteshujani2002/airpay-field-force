const Workflow = () => {
  const steps = [
    {
      number: "01",
      title: "Company & Agency Onboarding",
      description: "Super Admin onboards companies and agencies, creating initial admin users and establishing mappings."
    },
    {
      number: "02", 
      title: "CPV Form Creation",
      description: "Client Admins design customizable forms with specific field types and photo requirements."
    },
    {
      number: "03",
      title: "Lead Assignment",
      description: "Client Admins upload user data and assign leads to Agency Lead Assigners for distribution."
    },
    {
      number: "04",
      title: "Agent Assignment",
      description: "Lead Assigners distribute leads to individual CPV Agents with notifications and instructions."
    },
    {
      number: "05",
      title: "On-Site Verification",
      description: "CPV Agents visit locations, complete forms, and capture geo-tagged photos using mobile devices."
    },
    {
      number: "06",
      title: "Report Generation",
      description: "Completed verifications automatically generate comprehensive digital reports for all stakeholders."
    }
  ];

  return (
    <section id="workflow" className="py-16 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Streamlined CPV Workflow
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From onboarding to report generation, our platform handles every step of the verification process
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-xl mb-6 mx-auto relative z-10">
                    <span className="text-2xl font-bold text-primary-foreground">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-center leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Workflow;