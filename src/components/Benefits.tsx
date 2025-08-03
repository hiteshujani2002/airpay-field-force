import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Clock, Shield, Users } from "lucide-react";

const Benefits = () => {
  const benefits = [
    {
      icon: TrendingUp,
      title: "Increase Efficiency",
      value: "75%",
      description: "Faster verification process compared to traditional methods"
    },
    {
      icon: Clock,
      title: "Reduce Turnaround Time", 
      value: "50%",
      description: "Quicker lead processing and report generation"
    },
    {
      icon: Shield,
      title: "Improve Accuracy",
      value: "95%",
      description: "Enhanced data accuracy with geo-tagged verification"
    },
    {
      icon: Users,
      title: "Scale Operations",
      value: "10x",
      description: "Handle more verifications with the same team size"
    }
  ];

  return (
    <section id="benefits" className="py-16 sm:py-20 bg-gradient-to-br from-primary-light to-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Measurable Business Impact
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transform your CPV operations with quantifiable improvements across key metrics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="text-center border-0 shadow-lg bg-card/50 backdrop-blur">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2 mb-4">
                  <div className="text-4xl font-bold text-primary">{benefit.value}</div>
                  <h3 className="text-lg font-semibold text-foreground">{benefit.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;