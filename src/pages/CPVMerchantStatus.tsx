import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { AuthGate } from '@/components/AuthGate'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, MoreHorizontal, Download, Upload, FileText, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

// Dummy data for demonstration
const dummyCPVForms = [
  {
    id: 1,
    name: "E-commerce Verification Form",
    createdOn: "2024-01-15",
    currentStatus: "Active",
    initiative: "E-commerce",
    company: "TechCorp Solutions"
  },
  {
    id: 2,
    name: "Banking KYC Form",
    createdOn: "2024-01-18",
    currentStatus: "Inactive",
    initiative: "Banking",
    company: "FinanceMax Ltd"
  },
  {
    id: 3,
    name: "Insurance Verification",
    createdOn: "2024-01-22",
    currentStatus: "Active",
    initiative: "Insurance",
    company: "InsureAll Inc"
  }
]

const dummyMerchants = [
  {
    id: 1,
    merchantName: "ABC Electronics",
    assignedAgent: "John Doe",
    status: "Completed",
    dateAssigned: "2024-01-20",
    completedDate: "2024-01-25",
    hasFile: true
  },
  {
    id: 2,
    merchantName: "XYZ Fashion",
    assignedAgent: "Jane Smith",
    status: "Pending",
    dateAssigned: "2024-01-23",
    completedDate: null,
    hasFile: false
  },
  {
    id: 3,
    merchantName: "Tech Solutions Inc",
    assignedAgent: "Not Assigned",
    status: "Failed",
    dateAssigned: "2024-01-18",
    completedDate: null,
    hasFile: false
  }
]

const dummyLeads = [
  {
    id: 1,
    merchantName: "ABC Electronics",
    contactPerson: "Raj Kumar",
    phone: "+91 9876543210",
    email: "raj@abcelec.com",
    status: "Assigned",
    assignedAgent: "John Doe",
    priority: "High"
  },
  {
    id: 2,
    merchantName: "XYZ Fashion",
    contactPerson: "Priya Sharma",
    phone: "+91 9876543211",
    email: "priya@xyzfashion.com",
    status: "Yet to be assigned",
    assignedAgent: null,
    priority: "Medium"
  },
  {
    id: 3,
    merchantName: "Tech Solutions Inc",
    contactPerson: "Amit Singh",
    phone: "+91 9876543212",
    email: "amit@techsol.com",
    status: "Completed",
    assignedAgent: "Sarah Wilson",
    priority: "Low"
  }
]

const dummyAgents = ["John Doe", "Jane Smith", "Sarah Wilson", "Mike Johnson", "Lisa Chen"]

type UserRole = 'super_admin' | 'client_admin' | 'lead_assigner' | 'cpv_agent'

const CPVMerchantStatus = () => {
  const { userRole } = useAuth()
  const navigate = useNavigate()
  
  console.log('CPVMerchantStatus - Current user role:', userRole)
  const [selectedForm, setSelectedForm] = useState<any>(null)
  const [showMerchants, setShowMerchants] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState("")

  const handleStatusChange = (formId: number, newStatus: string) => {
    toast({
      title: "Status Updated",
      description: `Form status changed to ${newStatus}`,
    })
    setShowStatusDialog(false)
  }

  const handleAgentAssignment = () => {
    if (selectedAgent && selectedMerchant) {
      toast({
        title: "Agent Assigned",
        description: `${selectedAgent} has been assigned to ${selectedMerchant.merchantName}`,
      })
      setShowAssignDialog(false)
      setSelectedAgent("")
    }
  }

  const handleFileUpload = () => {
    toast({
      title: "File Uploaded",
      description: "Merchant data has been uploaded successfully",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Active': { variant: 'default' as const, className: 'bg-green-500' },
      'Inactive': { variant: 'secondary' as const, className: 'bg-gray-500' },
      'Completed': { variant: 'default' as const, className: 'bg-green-500' },
      'Pending': { variant: 'secondary' as const, className: 'bg-yellow-500' },
      'Failed': { variant: 'destructive' as const, className: 'bg-red-500' },
      'Assigned': { variant: 'default' as const, className: 'bg-blue-500' },
      'Yet to be assigned': { variant: 'outline' as const, className: 'bg-gray-100' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, className: '' }
    return <Badge variant={config.variant} className={config.className}>{status}</Badge>
  }

  // Client Admin & Super Admin View
  const renderAdminView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">CPV Merchant Status</h1>
          <p className="text-muted-foreground">Manage and monitor CPV forms and merchant verification status</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CPV Forms Overview</CardTitle>
          <CardDescription>
            {userRole === 'super_admin' ? 'All CPV forms across companies' : 'Your CPV forms'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sr. No</TableHead>
                <TableHead>CPV Form</TableHead>
                <TableHead>Created On</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead>Initiative</TableHead>
                {userRole === 'super_admin' && <TableHead>Company</TableHead>}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyCPVForms.map((form, index) => (
                <TableRow key={form.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{form.name}</TableCell>
                  <TableCell>{form.createdOn}</TableCell>
                  <TableCell>{getStatusBadge(form.currentStatus)}</TableCell>
                  <TableCell>{form.initiative}</TableCell>
                  {userRole === 'super_admin' && <TableCell>{form.company}</TableCell>}
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Form
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{form.name}</DialogTitle>
                            <DialogDescription>Form preview</DialogDescription>
                          </DialogHeader>
                          <div className="p-4 bg-muted rounded-lg">
                            <p>Form preview content would be displayed here...</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedForm(form)
                          setShowMerchants(true)
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4 mr-1" />
                        More Details
                      </Button>
                      
                      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Change Status
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Form Status</DialogTitle>
                            <DialogDescription>
                              Update the status of {form.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex gap-4">
                              <Button 
                                onClick={() => handleStatusChange(form.id, 'Active')}
                                variant={form.currentStatus === 'Active' ? 'default' : 'outline'}
                              >
                                Active
                              </Button>
                              <Button 
                                onClick={() => handleStatusChange(form.id, 'Inactive')}
                                variant={form.currentStatus === 'Inactive' ? 'default' : 'outline'}
                              >
                                Inactive
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showMerchants && selectedForm && (
        <Card>
          <CardHeader>
            <CardTitle>Merchant Management - {selectedForm.name}</CardTitle>
            <CardDescription>Upload merchants and assign Lead Assigners</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <div className="space-y-2">
                <Label htmlFor="merchant-file">Upload Merchant Excel File</Label>
                <Input id="merchant-file" type="file" accept=".xlsx,.xls" />
              </div>
              <div className="space-y-2">
                <Label>Assign Lead Assigner</Label>
                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Lead Assigner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead1">Lead Assigner 1</SelectItem>
                    <SelectItem value="lead2">Lead Assigner 2</SelectItem>
                    <SelectItem value="lead3">Lead Assigner 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleFileUpload} className="mt-6">
                <Upload className="h-4 w-4 mr-2" />
                Upload & Assign
              </Button>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Merchant Status</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant Name</TableHead>
                    <TableHead>Assigned Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Assigned</TableHead>
                    <TableHead>Completed Date</TableHead>
                    <TableHead>File</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dummyMerchants.map((merchant) => (
                    <TableRow key={merchant.id}>
                      <TableCell className="font-medium">{merchant.merchantName}</TableCell>
                      <TableCell>{merchant.assignedAgent}</TableCell>
                      <TableCell>{getStatusBadge(merchant.status)}</TableCell>
                      <TableCell>{merchant.dateAssigned}</TableCell>
                      <TableCell>{merchant.completedDate || '-'}</TableCell>
                      <TableCell>
                        {merchant.hasFile ? (
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-1" />
                            View File
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">No file</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // Lead Assigner View
  const renderLeadAssignerView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">CPV Forms - Lead Management</h1>
          <p className="text-muted-foreground">Manage assigned CPV forms and delegate to agents</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned CPV Forms</CardTitle>
          <CardDescription>Forms assigned to you for lead management</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sr. No</TableHead>
                <TableHead>CPV Form</TableHead>
                <TableHead>Initiative</TableHead>
                <TableHead>Created On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyCPVForms.slice(0, 2).map((form, index) => (
                <TableRow key={form.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{form.name}</TableCell>
                  <TableCell>{form.initiative}</TableCell>
                  <TableCell>{form.createdOn}</TableCell>
                  <TableCell>{getStatusBadge(form.currentStatus)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedForm(form)
                        setShowMerchants(true)
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4 mr-1" />
                      More Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showMerchants && selectedForm && (
        <Card>
          <CardHeader>
            <CardTitle>Leads Management - {selectedForm.name}</CardTitle>
            <CardDescription>Assign CPV agents to merchant leads</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Leads Data
              </Button>
              <div className="space-y-2">
                <Input type="file" accept=".xlsx,.xls" placeholder="Upload Agent Assignment File" />
              </div>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Assign CPV Agents
              </Button>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Leads Status</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Agent</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dummyLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.merchantName}</TableCell>
                      <TableCell>{lead.contactPerson}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>{lead.assignedAgent || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={lead.priority === 'High' ? 'destructive' : lead.priority === 'Medium' ? 'default' : 'secondary'}>
                          {lead.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.status === "Yet to be assigned" && (
                          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedMerchant(lead)}
                              >
                                Assign Agent
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assign CPV Agent</DialogTitle>
                                <DialogDescription>
                                  Select an agent for {selectedMerchant?.merchantName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Select CPV Agent</Label>
                                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose an agent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {dummyAgents.map((agent) => (
                                        <SelectItem key={agent} value={agent}>
                                          {agent}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button onClick={handleAgentAssignment} className="w-full">
                                  Assign Agent
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // CPV Agent View
  const renderCPVAgentView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">CPV Agent Dashboard</h1>
          <p className="text-muted-foreground">Manage your assigned verification tasks</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My CPV Tasks</CardTitle>
          <CardDescription>Track and manage your verification assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending Leads</TabsTrigger>
              <TabsTrigger value="completed">Completed Leads</TabsTrigger>
              <TabsTrigger value="rejected">Rejected Leads</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Date Assigned</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dummyLeads.filter(lead => lead.status === "Assigned").map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.merchantName}</TableCell>
                      <TableCell>{lead.contactPerson}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>
                        <Badge variant={lead.priority === 'High' ? 'destructive' : lead.priority === 'Medium' ? 'default' : 'secondary'}>
                          {lead.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>2024-01-20</TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => toast({ title: "CPV Started", description: "Verification process initiated" })}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete CPV
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Completed Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Form</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dummyLeads.filter(lead => lead.status === "Completed").map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.merchantName}</TableCell>
                      <TableCell>{lead.contactPerson}</TableCell>
                      <TableCell>2024-01-25</TableCell>
                      <TableCell>{getStatusBadge("Completed")}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          View Form
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Rejection Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No rejected leads found
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )

  const renderContent = () => {
    console.log('CPVMerchantStatus - renderContent called with userRole:', userRole)
    
    if (!userRole) {
      console.log('No userRole found, showing loading...')
      return <div>Loading...</div>
    }

    console.log('Rendering view for role:', userRole)
    switch (userRole) {
      case 'super_admin':
        console.log('Rendering Super Admin view')
        return renderAdminView()
      case 'client_admin':
        console.log('Rendering Client Admin view')
        return renderAdminView()
      case 'lead_assigner':
        console.log('Rendering Lead Assigner view')
        return renderLeadAssignerView()
      case 'cpv_agent':
        console.log('Rendering CPV Agent view')
        return renderCPVAgentView()
      default:
        console.log('Unknown role, denying access:', userRole)
        return <div>Access denied</div>
    }
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {renderContent()}
        </div>
      </div>
    </AuthGate>
  )
}

export default CPVMerchantStatus