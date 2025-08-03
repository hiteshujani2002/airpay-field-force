import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Smartphone, 
  MapPin, 
  FileText, 
  Users, 
  Shield, 
  Zap,
  Clock,
  BarChart3,
  CheckSquare
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Optimized for field agents with intuitive mobile interface and offline capabilities."
    },
    {
      icon: MapPin,
      title: "Geo-Tagged Verification",
      description: "Automatic location capture with every photo and form submission for authenticity."
    },
    {
      icon: FileText,
      title: "Custom Forms",
      description: "Create flexible CPV forms with configurable fields and photo requirements."
    },
    {
      icon: Users,
      title: "Multi-Role Management",
      description: "Seamless collaboration between Super Admins, Client Admins, Lead Assigners, and CPV Agents."
    },
    {
      icon: Shield,
      title: "Secure Data Handling",
      description: "Enterprise-grade security ensuring sensitive financial data protection."
    },
    {
      icon: Zap,
      title: "Real-Time Updates",
      description: "Instant notifications and status updates across all user roles."
    },
    {
      icon: Clock,
      title: "Automated Workflows",
      description: "Streamlined lead assignment and reporting processes to reduce manual effort."
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Comprehensive insights into CPV performance and agent productivity."
    },
    {
      icon: CheckSquare,
      title: "Digital Reports",
      description: "Automated generation of comprehensive CPV reports with all captured data."
    }
  ];

  return (
    <section id="features" className="py-16 sm:py-20 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Powerful Features for Complete CPV Management
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to digitize and streamline your contact point verification process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;