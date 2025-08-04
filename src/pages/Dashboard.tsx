import { Users, FileText, Building2, Shield } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CPVHubLogo from "@/components/CPVHubLogo";

const menuItems = [
  {
    title: "Entity Onboarding",
    icon: Building2,
    url: "/entity-onboarding",
  },
  {
    title: "Create CPV Forms", 
    icon: FileText,
    url: "/dashboard/create-forms",
  },
  {
    title: "CPV Merchant Status",
    icon: Shield,
    url: "/dashboard/merchant-status",
  },
  {
    title: "User Management",
    icon: Users,
    url: "/dashboard/user-management",
  },
];

function AppSidebar() {
  return (
    <Sidebar className="w-64">
      <SidebarContent>
        <div className="p-4 border-b">
          <CPVHubLogo className="h-8 w-auto" />
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

const Dashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b bg-card flex items-center px-6">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-lg font-semibold text-foreground">CPV Hub Dashboard</h1>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to CPV Hub</h2>
                <p className="text-muted-foreground">
                  Manage your offline verification processes for financial services efficiently.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Entity Management
                    </CardTitle>
                    <CardDescription>
                      Onboard and manage companies and agencies in the verification process.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Access entity onboarding tools and manage organizational structures.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      CPV Forms
                    </CardTitle>
                    <CardDescription>
                      Create and manage Customer Physical Verification forms.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Design verification forms and manage the documentation process.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Merchant Status
                    </CardTitle>
                    <CardDescription>
                      Monitor and track verification status across merchants.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      View real-time status updates and verification progress.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      User Management
                    </CardTitle>
                    <CardDescription>
                      Manage user roles and permissions across the platform.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Control access levels for admins, assigners, and agents.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;