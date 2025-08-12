import React, { useState, useEffect } from 'react'
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
import { Eye, MoreHorizontal, Download, Upload, FileText, CheckCircle, XCircle, Clock, ArrowLeft, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface CPVForm {
  id: string;
  name: string;
  created_at: string;
  status: string;
  current_status: string;
  initiative: string;
  sections: any[];
  form_preview_data?: any;
  merchants_data?: any[];
  assigned_lead_assigner_id?: string;
}

interface FormSection {
  id: string;
  name: string;
  fields: CustomField[];
}

interface CustomField {
  id: string;
  title: string;
  dataType: "alphabets" | "numbers" | "alphanumeric";
  mandatory: boolean;
  visible: boolean;
  type: "text" | "image";
  numberOfClicks?: number;
  documentName?: string;
}

type UserRole = 'super_admin' | 'client_admin' | 'lead_assigner' | 'cpv_agent'

const CPVMerchantStatus = () => {
  const { userRole, user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [cpvForms, setCPVForms] = useState<CPVForm[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedForm, setSelectedForm] = useState<CPVForm | null>(null)
  const [showFormPreview, setShowFormPreview] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [selectedFormForStatus, setSelectedFormForStatus] = useState<CPVForm | null>(null)
  const [showMerchantDetails, setShowMerchantDetails] = useState(false)

  // Load CPV forms from Supabase
  useEffect(() => {
    loadCPVForms()
  }, [user])

  const loadCPVForms = async () => {
    if (!user) return;
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('cpv_forms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const transformedForms: CPVForm[] = data.map(form => ({
        id: form.id,
        name: form.name,
        created_at: form.created_at,
        status: form.status || 'active',
        current_status: form.current_status || 'draft',
        initiative: form.initiative,
        sections: Array.isArray(form.sections) ? form.sections : [],
        form_preview_data: form.form_preview_data,
        merchants_data: Array.isArray(form.merchants_data) ? form.merchants_data : [],
        assigned_lead_assigner_id: form.assigned_lead_assigner_id
      }))

      setCPVForms(transformedForms)
    } catch (error: any) {
      console.error('Error loading CPV forms:', error)
      toast({
        title: 'Error',
        description: 'Failed to load CPV forms',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewForm = (form: CPVForm) => {
    setSelectedForm(form)
    setShowFormPreview(true)
  }

  const handleMoreDetails = (form: CPVForm) => {
    setSelectedForm(form)
    setShowMerchantDetails(true)
  }

  const handleStatusChange = async (form: CPVForm, newStatus: 'active' | 'inactive') => {
    try {
      const { error } = await supabase
        .from('cpv_forms')
        .update({ status: newStatus })
        .eq('id', form.id)

      if (error) throw error

      toast({
        title: "Status Updated",
        description: `Form status changed to ${newStatus}`,
      })

      // Update local state
      setCPVForms(forms => 
        forms.map(f => 
          f.id === form.id ? { ...f, status: newStatus } : f
        )
      )
      
      setShowStatusDialog(false)
      setSelectedFormForStatus(null)
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update form status',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { variant: 'default' as const, className: 'bg-green-500 text-white' },
      'inactive': { variant: 'secondary' as const, className: 'bg-gray-500 text-white' },
      'draft': { variant: 'outline' as const, className: 'bg-gray-100' },
      'submitted': { variant: 'default' as const, className: 'bg-blue-500 text-white' },
      'under_review': { variant: 'secondary' as const, className: 'bg-yellow-500 text-white' },
      'approved': { variant: 'default' as const, className: 'bg-green-500 text-white' },
      'rejected': { variant: 'destructive' as const, className: 'bg-red-500 text-white' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, className: '' }
    return <Badge variant={config.variant} className={config.className}>{status}</Badge>
  }

  const renderFormField = (field: CustomField) => {
    if (!field.visible) return null;

    const baseClasses = "w-full p-2 border rounded-md bg-gray-50"
    
    if (field.type === "image") {
      return (
        <div key={field.id} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.title}
            {field.mandatory && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Click to upload {field.documentName || field.title}</p>
            <p className="text-xs text-gray-400">Maximum {field.numberOfClicks || 1} image(s)</p>
          </div>
        </div>
      )
    }

    // Special rendering for business fields
    if (field.title === "Address Confirmed") {
      return (
        <div key={field.id} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.title}
            {field.mandatory && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <div className="flex gap-4">
            <label className="flex items-center space-x-2">
              <input type="radio" name={field.id} disabled className="text-primary" />
              <span>Yes</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="radio" name={field.id} disabled className="text-primary" />
              <span>No</span>
            </label>
          </div>
        </div>
      )
    }

    if (["Nature of Business", "Type of business", "Office Ownership"].includes(field.title)) {
      return (
        <div key={field.id} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.title}
            {field.mandatory && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <select disabled className={baseClasses}>
            <option>Select {field.title.toLowerCase()}</option>
          </select>
        </div>
      )
    }

    return (
      <div key={field.id} className="space-y-2">
        <Label className="text-sm font-medium">
          {field.title}
          {field.mandatory && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <input
          type="text"
          disabled
          placeholder={`Enter ${field.title.toLowerCase()}`}
          className={baseClasses}
        />
      </div>
    )
  }

  const renderFormPreview = () => {
    if (!selectedForm) return null;

    return (
      <Dialog open={showFormPreview} onOpenChange={setShowFormPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {selectedForm.name} - Form Preview
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFormPreview(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              Initiative: {selectedForm.initiative} | Created: {new Date(selectedForm.created_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {selectedForm.sections.map((section: FormSection) => (
              <Card key={section.id} className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{section.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.fields.map(renderFormField)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const renderStatusChangeDialog = () => {
    return (
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Form Status</DialogTitle>
            <DialogDescription>
              Update the status of {selectedFormForStatus?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={() => selectedFormForStatus && handleStatusChange(selectedFormForStatus, 'active')}
                variant={selectedFormForStatus?.status === 'active' ? 'default' : 'outline'}
                className="flex-1"
              >
                Active
              </Button>
              <Button 
                onClick={() => selectedFormForStatus && handleStatusChange(selectedFormForStatus, 'inactive')}
                variant={selectedFormForStatus?.status === 'inactive' ? 'default' : 'outline'}
                className="flex-1"
              >
                Inactive
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const renderMerchantDetailsDialog = () => {
    return (
      <Dialog open={showMerchantDetails} onOpenChange={setShowMerchantDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Merchant Management - {selectedForm?.name}</DialogTitle>
            <DialogDescription>Upload merchants and assign Lead Assigners</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex gap-4 items-end">
              <div className="space-y-2 flex-1">
                <Label htmlFor="merchant-file">Upload Merchant Excel File</Label>
                <Input id="merchant-file" type="file" accept=".xlsx,.xls" />
              </div>
              <div className="space-y-2 flex-1">
                <Label>Assign Lead Assigner</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Lead Assigner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead1">Lead Assigner 1</SelectItem>
                    <SelectItem value="lead2">Lead Assigner 2</SelectItem>
                    <SelectItem value="lead3">Lead Assigner 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload & Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Client Admin View
  const renderClientAdminView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
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
          <CardTitle>Your CPV Forms</CardTitle>
          <CardDescription>
            View and manage your created CPV forms
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : cpvForms.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No CPV forms found. Create your first form to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sr. No</TableHead>
                  <TableHead>CPV Form</TableHead>
                  <TableHead>Created On</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead>Initiative</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cpvForms.map((form, index) => (
                  <TableRow key={form.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{form.name}</TableCell>
                    <TableCell>{new Date(form.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(form.status)}</TableCell>
                    <TableCell>{form.initiative}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewForm(form)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Form
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMoreDetails(form)}
                        >
                          <MoreHorizontal className="h-4 w-4 mr-1" />
                          More Details
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedFormForStatus(form)
                            setShowStatusDialog(true)
                          }}
                        >
                          Change Status
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderSuperAdminView = () => renderClientAdminView()
  const renderLeadAssignerView = () => renderClientAdminView()
  const renderCPVAgentView = () => renderClientAdminView()

  const renderContent = () => {
    switch (userRole) {
      case 'client_admin':
        return renderClientAdminView()
      case 'super_admin':
        return renderSuperAdminView()
      case 'lead_assigner':
        return renderLeadAssignerView()
      case 'cpv_agent':
        return renderCPVAgentView()
      default:
        return (
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access this module.</p>
          </div>
        )
    }
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {renderContent()}
          {renderFormPreview()}
          {renderStatusChangeDialog()}
          {renderMerchantDetailsDialog()}
        </div>
      </div>
    </AuthGate>
  )
}

export default CPVMerchantStatus