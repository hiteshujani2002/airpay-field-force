import { Users, FileText, Building2, Shield, LogOut } from "lucide-react";
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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CPVHubLogo from "@/components/CPVHubLogo";
import { useAuth } from "@/hooks/useAuth";
import { AuthGate } from "@/components/AuthGate";

type UserRole = 'super_admin' | 'client_admin' | 'lead_assigner' | 'cpv_agent';

const menuItems = [
  {
    title: "Entity Onboarding",
    icon: Building2,
    url: "/entity-onboarding",
    roles: ['super_admin'] as UserRole[],
  },
  {
    title: "Create CPV Forms", 
    icon: FileText,
    url: "/dashboard/create-forms",
    roles: ['client_admin'] as UserRole[],
  },
  {
    title: "CPV Merchant Status",
    icon: Shield,
    url: "/dashboard/merchant-status",
    roles: ['super_admin', 'client_admin', 'lead_assigner', 'cpv_agent'] as UserRole[],
  },
  {
    title: "User Management",
    icon: Users,
    url: "/dashboard/user-management",
    roles: ['super_admin', 'client_admin', 'lead_assigner'] as UserRole[],
  },
];

const roleLabels = {
  super_admin: 'Super Admin',
  client_admin: 'Client Admin', 
  lead_assigner: 'Lead Assigner',
  cpv_agent: 'CPV Agent'
};

function AppSidebar({ userRole }: { userRole: UserRole | null }) {
  const { signOut } = useAuth();

  const filteredMenuItems = menuItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  return (
    <Sidebar 
      className="w-64 lg:w-64 md:w-16 hidden md:flex" 
      collapsible="icon"
    >
      <SidebarContent>
        <div className="p-4 border-b">
          <CPVHubLogo className="h-8 w-auto" />
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="hidden lg:block">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t">
        <div className="space-y-2">
          {userRole && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground hidden lg:block">Role:</span>
              <Badge variant="outline" className="lg:w-auto w-full justify-center">
                <span className="hidden lg:block">{roleLabels[userRole]}</span>
                <span className="lg:hidden">{roleLabels[userRole].split(' ')[0]}</span>
              </Badge>
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={signOut}
            className="w-full flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:block">Sign Out</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

const Dashboard = () => {
  const { userRole, user } = useAuth();

  console.log('Dashboard - User:', user?.email, 'Role:', userRole);

  return (
    <AuthGate>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar userRole={userRole} />
          
          <div className="flex-1 flex flex-col min-w-0">
            {/* Mobile-First Header */}
            <header className="h-16 border-b bg-card flex items-center px-4 lg:px-6">
              <SidebarTrigger className="mr-2 md:mr-4 md:hidden" />
              <h1 className="text-base lg:text-lg font-semibold text-foreground truncate">
                CPV Hub Dashboard
              </h1>
            </header>
            
            {/* Main Content */}
            <main className="flex-1 p-4 lg:p-6 overflow-auto">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6 lg:mb-8">
                  <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-2">
                    Welcome to CPV Hub
                  </h2>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    Manage your offline verification processes for financial services efficiently.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                  {menuItems
                    .filter(item => userRole && item.roles.includes(userRole))
                    .map((item) => (
                      <Card key={item.title} className="h-full">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                            <item.icon className="h-4 w-4 lg:h-5 lg:w-5 text-primary flex-shrink-0" />
                            <span className="truncate">{item.title}</span>
                          </CardTitle>
                          <CardDescription className="text-xs lg:text-sm">
                            {item.title === "Entity Onboarding" && "Onboard and manage companies and agencies in the verification process."}
                            {item.title === "Create CPV Forms" && "Create and manage Customer Physical Verification forms."}
                            {item.title === "CPV Merchant Status" && "Monitor and track verification status across merchants."}
                            {item.title === "User Management" && "Manage user roles and permissions across the platform."}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-xs lg:text-sm text-muted-foreground">
                            {item.title === "Entity Onboarding" && "Access entity onboarding tools and manage organizational structures."}
                            {item.title === "Create CPV Forms" && "Design verification forms and manage the documentation process."}
                            {item.title === "CPV Merchant Status" && "View real-time status updates and verification progress."}
                            {item.title === "User Management" && "Control access levels for admins, assigners, and agents."}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AuthGate>
  );
};

export default Dashboard;