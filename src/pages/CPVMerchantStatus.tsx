import React, { useState, useEffect, useCallback } from 'react'
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
  
  console.log('=== CPVMerchantStatus Component Debug ===')
  console.log('User:', user)
  console.log('UserRole:', userRole)
  
  // Main component state
  const [cpvForms, setCPVForms] = useState<CPVForm[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedForm, setSelectedForm] = useState<CPVForm | null>(null)
  const [showFormPreview, setShowFormPreview] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [selectedFormForStatus, setSelectedFormForStatus] = useState<CPVForm | null>(null)
  const [showMerchantDetails, setShowMerchantDetails] = useState(false)
  const [leadAssigners, setLeadAssigners] = useState<any[]>([])
  const [loadingLeadAssigners, setLoadingLeadAssigners] = useState(false)
  
  // Lead Assigner state
  const [assignedMerchants, setAssignedMerchants] = useState<any[]>([])
  const [cpvAgents, setCPVAgents] = useState<any[]>([])
  const [loadingMerchants, setLoadingMerchants] = useState(true)
  const [loadingAgents, setLoadingAgents] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null)
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  
  // CPV Agent state
  const [agentLeads, setAgentLeads] = useState<any[]>([])
  const [loadingAgentLeads, setLoadingAgentLeads] = useState(true)

  // Move useCallback hooks to component level
  const loadAssignedMerchants = useCallback(async () => {
    if (!user || userRole !== 'lead_assigner') return
    
    setLoadingMerchants(true)
    try {
      const { data, error } = await supabase
        .from('cpv_merchant_status')
        .select(`
          *,
          cpv_forms:cpv_form_id (
            name,
            initiative
          )
        `)
        .eq('assigned_lead_assigner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAssignedMerchants(data || [])
    } catch (error: any) {
      console.error('Error loading assigned merchants:', error)
      toast({
        title: 'Error',
        description: 'Failed to load assigned merchants',
        variant: 'destructive',
      })
    } finally {
      setLoadingMerchants(false)
    }
  }, [user, userRole, toast])

  const loadCPVAgents = useCallback(async () => {
    if (!user || userRole !== 'lead_assigner') return
    
    setLoadingAgents(true)
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, username, email')
        .eq('role', 'cpv_agent')
        .eq('created_by_user_id', user.id)
        .order('username', { ascending: true })

      if (error) throw error
      setCPVAgents(data || [])
    } catch (error: any) {
      console.error('Error loading CPV agents:', error)
      toast({
        title: 'Error',
        description: 'Failed to load CPV agents',
        variant: 'destructive',
      })
    } finally {
      setLoadingAgents(false)
    }
  }, [user, userRole, toast])

  const loadAgentLeads = useCallback(async () => {
    if (!user || userRole !== 'cpv_agent') return
    
    setLoadingAgentLeads(true)
    try {
      const { data, error } = await supabase
        .from('cpv_merchant_status')
        .select(`
          *,
          cpv_forms:cpv_form_id (
            name,
            initiative
          )
        `)
        .eq('assigned_cpv_agent_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAgentLeads(data || [])
    } catch (error: any) {
      console.error('Error loading agent leads:', error)
      toast({
        title: 'Error',
        description: 'Failed to load leads',
        variant: 'destructive',
      })
    } finally {
      setLoadingAgentLeads(false)
    }
  }, [user, userRole, toast])

  // Lead Assigner useEffect
  useEffect(() => {
    if (userRole === 'lead_assigner') {
      loadAssignedMerchants()
      loadCPVAgents()
    }
  }, [userRole, loadAssignedMerchants, loadCPVAgents])

  // CPV Agent useEffect
  useEffect(() => {
    if (userRole === 'cpv_agent') {
      loadAgentLeads()
    }
  }, [userRole, loadAgentLeads])

  // Real-time updates for Lead Assigner
  useEffect(() => {
    if (!user || userRole !== 'lead_assigner') return

    const channel = supabase
      .channel('lead-assigner-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cpv_merchant_status',
          filter: `assigned_lead_assigner_id=eq.${user.id}`
        },
        () => {
          loadAssignedMerchants()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, userRole, loadAssignedMerchants])

  // Real-time updates for CPV Agent
  useEffect(() => {
    if (!user || userRole !== 'cpv_agent') return

    const channel = supabase
      .channel('cpv-agent-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cpv_merchant_status',
          filter: `assigned_cpv_agent_id=eq.${user.id}`
        },
        () => {
          loadAgentLeads()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, userRole, loadAgentLeads])

  // Load CPV forms from Supabase
  useEffect(() => {
    console.log('=== Main useEffect triggered ===')
    console.log('UserRole:', userRole)
    console.log('User:', user)
    console.log('Loading state:', loading)
    
    // Only load CPV forms for Client Admin and Super Admin
    // Lead Assigners and CPV Agents don't need to load forms but should set loading to false
    if (userRole === 'client_admin' || userRole === 'super_admin') {
      console.log('Loading forms for Client Admin/Super Admin')
      loadCPVForms()
      loadLeadAssigners()
    } else if (userRole && user) {
      // For other roles, just set loading to false once we have the user role
      console.log('Setting loading to false for other roles')
      setLoading(false)
    } else {
      console.log('No action taken - waiting for userRole and user')
    }
  }, [user, userRole])

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

  const handleMoreDetails = async (form: CPVForm) => {
    if (!user) return;
    
    try {
      // Check if merchant data exists for this form
      const { data: merchantData, error } = await supabase
        .from('cpv_merchant_status')
        .select('id')
        .eq('cpv_form_id', form.id)
        .limit(1)

      if (error) throw error

      if (merchantData && merchantData.length > 0) {
        // Data exists, redirect to view
        navigate(`/merchant-data/${form.id}`)
      } else {
        // No data exists, show upload dialog
        setSelectedForm(form)
        setShowMerchantDetails(true)
      }
    } catch (error: any) {
      console.error('Error checking merchant data:', error)
      // Fallback to showing upload dialog
      setSelectedForm(form)
      setShowMerchantDetails(true)
    }
  }

  const loadLeadAssigners = async () => {
    if (!user) return;
    
    setLoadingLeadAssigners(true)
    try {
      // Get current user's company first
      const { data: currentUserData, error: userError } = await supabase
        .from('user_roles')
        .select('company')
        .eq('user_id', user.id)
        .single()

      if (userError) throw userError

      // Fetch lead assigners from the same company
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, username, email, company')
        .eq('role', 'lead_assigner')
        .eq('company', currentUserData.company)
        .order('username', { ascending: true })

      if (error) throw error

      setLeadAssigners(data || [])
    } catch (error: any) {
      console.error('Error loading lead assigners:', error)
      toast({
        title: 'Error',
        description: 'Failed to load lead assigners',
        variant: 'destructive',
      })
    } finally {
      setLoadingLeadAssigners(false)
    }
  }

  const handleUploadAndAssign = async (file: File, leadAssignerId: string) => {
    console.log('=== UPLOAD DEBUG START ===')
    if (!selectedForm || !user) {
      console.log('Missing selectedForm or user:', { selectedForm, user })
      return
    }

    try {
      console.log('Starting Excel upload process...')
      console.log('Selected form:', selectedForm)
      console.log('User:', { id: user.id, email: user.email })
      console.log('File:', file)
      console.log('Lead Assigner ID:', leadAssignerId)

      // Verify user owns the form first
      const { data: formOwnership, error: ownershipError } = await supabase
        .from('cpv_forms')
        .select('id, user_id, name')
        .eq('id', selectedForm.id)
        .eq('user_id', user.id)
        .single()

      console.log('Form ownership check:', { formOwnership, ownershipError })

      if (ownershipError || !formOwnership) {
        console.error('User does not own this form or form not found')
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to upload data to this form',
          variant: 'destructive',
        })
        return
      }

      // Parse Excel file
      const XLSX = await import('xlsx')
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

      console.log('Parsed Excel data:', jsonData)

      // Validate required columns
      const requiredColumns = ['Merchant Name', 'Merchant Phone Number', 'Merchant Address', 'City', 'State', 'Pincode']
      const firstRow = jsonData[0] || {}
      const missingColumns = requiredColumns.filter(col => !(col in firstRow))
      
      console.log('First row:', firstRow)
      console.log('Missing columns:', missingColumns)
      
      if (missingColumns.length > 0) {
        toast({
          title: 'Invalid Excel Format',
          description: `Missing columns: ${missingColumns.join(', ')}`,
          variant: 'destructive',
        })
        return
      }

      // Prepare merchant data for insertion
      const merchantRecords = jsonData.map(row => ({
        cpv_form_id: selectedForm.id,
        merchant_name: row['Merchant Name'],
        merchant_phone: row['Merchant Phone Number'],
        merchant_address: row['Merchant Address'],
        city: row['City'],
        state: row['State'],
        pincode: row['Pincode'],
        cpv_agent: 'NA',
        assigned_lead_assigner_id: leadAssignerId === 'unassigned' ? null : leadAssignerId,
        uploaded_by_user_id: user.id,
        assigned_on: new Date().toISOString(),
        verification_status: 'pending'
      }))

      console.log('Merchant records to insert:', merchantRecords)

      // Verify we have at least one record
      if (merchantRecords.length === 0) {
        toast({
          title: 'No Data',
          description: 'No valid merchant data found in the Excel file',
          variant: 'destructive',
        })
        return
      }

      // Insert into Supabase with detailed error handling
      console.log('Attempting to insert into Supabase...')
      const { data: insertedData, error } = await supabase
        .from('cpv_merchant_status')
        .insert(merchantRecords)
        .select()

      console.log('Supabase insert response:', { insertedData, error })

      if (error) {
        console.error('Supabase error details:', error)
        
        // Provide more specific error messages
        let errorMessage = 'Failed to upload merchant data'
        if (error.message.includes('row-level security')) {
          errorMessage = 'Access denied: You do not have permission to upload data to this form'
        } else if (error.message.includes('violates')) {
          errorMessage = 'Data validation error: Please check your Excel file format'
        } else if (error.message.includes('uuid')) {
          errorMessage = 'Invalid Lead Assigner selection'
        }
        
        toast({
          title: 'Upload Failed',
          description: errorMessage,
          variant: 'destructive',
        })
        throw error
      }

      console.log('Upload successful! Inserted records:', insertedData)

      toast({
        title: 'Success',
        description: `${merchantRecords.length} merchants uploaded and assigned successfully`,
      })

      setShowMerchantDetails(false)
      
      // Redirect to merchant data view
      navigate(`/merchant-data/${selectedForm.id}`)

    } catch (error: any) {
      console.error('Error uploading merchants:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      toast({
        title: 'Error',
        description: 'Failed to upload merchant data',
        variant: 'destructive',
      })
    }
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
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
    const [selectedLeadAssigner, setSelectedLeadAssigner] = React.useState<string>('')
    const [uploading, setUploading] = React.useState(false)

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        setSelectedFile(file)
      }
    }

    const handleUploadClick = async () => {
      if (!selectedFile || !selectedLeadAssigner) {
        toast({
          title: 'Missing Information',
          description: 'Please select both an Excel file and a Lead Assigner option',
          variant: 'destructive',
        })
        return
      }

      setUploading(true)
      await handleUploadAndAssign(selectedFile, selectedLeadAssigner)
      setUploading(false)
    }

    return (
      <Dialog open={showMerchantDetails} onOpenChange={setShowMerchantDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Upload Merchant Data - {selectedForm?.name}</DialogTitle>
            <DialogDescription>
              Upload an Excel file with merchant data and assign to a Lead Assigner
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Expected Excel Columns:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <span>• Merchant Name</span>
                <span>• Merchant Phone Number</span>
                <span>• Merchant Address</span>
                <span>• City</span>
                <span>• State</span>
                <span>• Pincode</span>
                
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="merchant-file">Upload Merchant Excel File</Label>
                <Input 
                  id="merchant-file" 
                  type="file" 
                  accept=".xlsx,.xls" 
                  onChange={handleFileChange}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Assign Lead Assigner</Label>
                <Select value={selectedLeadAssigner} onValueChange={setSelectedLeadAssigner}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Lead Assigner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned (Will be assigned later)</SelectItem>
                    {leadAssigners.map((assigner) => (
                      <SelectItem key={assigner.user_id} value={assigner.user_id}>
                        {assigner.username} ({assigner.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowMerchantDetails(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUploadClick}
                disabled={!selectedFile || !selectedLeadAssigner || uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload & Assign'}
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

  // Lead Assigner View - shows merchants assigned to them
  const renderLeadAssignerView = () => {
    console.log('=== renderLeadAssignerView called ===')
    console.log('User in Lead Assigner view:', user)

    const assignToCPVAgent = async () => {
      if (!selectedMerchant || !selectedAgent) return

      try {
        const { error } = await supabase
          .from('cpv_merchant_status')
          .update({
            assigned_cpv_agent_id: selectedAgent,
            cpv_agent_assigned_on: new Date().toISOString()
          })
          .eq('id', selectedMerchant.id)

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Merchant assigned to CPV agent successfully',
        })

        setAssignDialogOpen(false)
        setSelectedMerchant(null)
        setSelectedAgent('')
        loadAssignedMerchants()
      } catch (error: any) {
        console.error('Error assigning merchant:', error)
        toast({
          title: 'Error',
          description: 'Failed to assign merchant to CPV agent',
          variant: 'destructive',
        })
      }
    }


    return (
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
            <h1 className="text-3xl font-bold tracking-tight">Assigned Merchants</h1>
            <p className="text-muted-foreground">Manage merchants assigned to you and assign them to CPV agents</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Merchants ({assignedMerchants.length})</CardTitle>
            <CardDescription>
              Merchants assigned to you for verification management
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMerchants ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : assignedMerchants.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Merchants Assigned</h3>
                <p>You don't have any merchants assigned to you yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Merchant Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City, State</TableHead>
                      <TableHead>Form</TableHead>
                      <TableHead>CPV Agent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedMerchants.map((merchant) => (
                      <TableRow key={merchant.id}>
                        <TableCell className="font-medium">{merchant.merchant_name}</TableCell>
                        <TableCell>{merchant.merchant_phone}</TableCell>
                        <TableCell>{merchant.city}, {merchant.state}</TableCell>
                        <TableCell>{merchant.cpv_forms?.name}</TableCell>
                        <TableCell>
                          {merchant.assigned_cpv_agent_id ? (
                            <Badge variant="secondary">Assigned</Badge>
                          ) : (
                            <Badge variant="outline">Unassigned</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(merchant.verification_status)}
                        </TableCell>
                        <TableCell>
                          {!merchant.assigned_cpv_agent_id && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedMerchant(merchant)
                                setAssignDialogOpen(true)
                              }}
                            >
                              Assign to Agent
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign to CPV Agent</DialogTitle>
              <DialogDescription>
                Assign merchant "{selectedMerchant?.merchant_name}" to a CPV agent for verification
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select CPV Agent</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a CPV agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {cpvAgents.map((agent) => (
                      <SelectItem key={agent.user_id} value={agent.user_id}>
                        {agent.username} ({agent.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setAssignDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={assignToCPVAgent}
                  disabled={!selectedAgent}
                  className="flex-1"
                >
                  Assign
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // CPV Agent View - shows leads assigned to them
  const renderCPVAgentView = () => {

    const updateLeadStatus = async (leadId: string, newStatus: string) => {
      try {
        const { error } = await supabase
          .from('cpv_merchant_status')
          .update({ verification_status: newStatus })
          .eq('id', leadId)

        if (error) throw error

        toast({
          title: 'Success',
          description: `Lead status updated to ${newStatus}`,
        })

        loadAgentLeads()
      } catch (error: any) {
        console.error('Error updating lead status:', error)
        toast({
          title: 'Error',
          description: 'Failed to update lead status',
          variant: 'destructive',
        })
      }
    }

    const pendingLeads = (agentLeads || []).filter(lead => lead.verification_status === 'pending')
    const completedLeads = (agentLeads || []).filter(lead => lead.verification_status === 'verified')
    const rejectedLeads = (agentLeads || []).filter(lead => lead.verification_status === 'rejected')

    const renderLeadTable = (leads: any[], showActions = false) => (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Merchant Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Form</TableHead>
            <TableHead>Assigned On</TableHead>
            {showActions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">{lead.merchant_name}</TableCell>
              <TableCell>{lead.merchant_phone}</TableCell>
              <TableCell>{lead.merchant_address}</TableCell>
              <TableCell>{lead.cpv_forms?.name}</TableCell>
              <TableCell>
                {lead.cpv_agent_assigned_on ? 
                  new Date(lead.cpv_agent_assigned_on).toLocaleDateString() : 
                  'N/A'
                }
              </TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateLeadStatus(lead.id, 'verified')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateLeadStatus(lead.id, 'rejected')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )

    return (
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
            <h1 className="text-3xl font-bold tracking-tight">CPV Agent Dashboard</h1>
            <p className="text-muted-foreground">Manage merchant verification leads assigned to you</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lead Management</CardTitle>
            <CardDescription>
              Manage merchant leads assigned to you for verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending Leads ({pendingLeads.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Completed Leads ({completedLeads.length})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Rejected Leads ({rejectedLeads.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending" className="mt-6">
                {loadingAgentLeads ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : pendingLeads.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
                    <h3 className="text-lg font-medium mb-2">No Pending Leads</h3>
                    <p>You don't have any pending leads to verify at the moment.</p>
                  </div>
                ) : (
                  renderLeadTable(pendingLeads, true)
                )}
              </TabsContent>
              
              <TabsContent value="completed" className="mt-6">
                {completedLeads.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
                    <h3 className="text-lg font-medium mb-2">No Completed Leads</h3>
                    <p>You haven't completed any lead verifications yet.</p>
                  </div>
                ) : (
                  renderLeadTable(completedLeads)
                )}
              </TabsContent>
              
              <TabsContent value="rejected" className="mt-6">
                {rejectedLeads.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <XCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                    <h3 className="text-lg font-medium mb-2">No Rejected Leads</h3>
                    <p>You haven't rejected any leads yet.</p>
                  </div>
                ) : (
                  renderLeadTable(rejectedLeads)
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderContent = () => {
    console.log('=== renderContent called ===')
    console.log('Current userRole:', userRole)
    console.log('About to switch on userRole...')
    
    switch (userRole) {
      case 'client_admin':
        console.log('Rendering Client Admin view')
        return renderClientAdminView()
      case 'super_admin':
        console.log('Rendering Super Admin view')
        return renderSuperAdminView()
      case 'lead_assigner':
        console.log('Rendering Lead Assigner view')
        return renderLeadAssignerView()
      case 'cpv_agent':
        console.log('Rendering CPV Agent view')
        return renderCPVAgentView()
      default:
        console.log('Rendering default Access Denied view for role:', userRole)
        return (
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access this module.</p>
          </div>
        )
    }
  }

  console.log('=== About to render CPVMerchantStatus ===')
  console.log('Loading state:', loading)
  console.log('UserRole:', userRole)
  console.log('User:', user)

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