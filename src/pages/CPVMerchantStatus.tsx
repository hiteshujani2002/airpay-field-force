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
import LeadAssignerDashboard from '@/components/LeadAssignerDashboard'
import { CPVAgentDashboard } from '@/components/cpv/CPVAgentDashboard'


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
  company?: string;
  agency?: string;
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
    if ((userRole === 'client_admin' || userRole === 'super_admin') && user) {
      console.log('Loading forms for Client Admin/Super Admin')
      loadCPVForms()
      if (userRole === 'client_admin') {
        loadLeadAssigners()
      }
    } else if (userRole && user) {
      // For other roles, just set loading to false once we have the user role
      console.log('Setting loading to false for other roles')
      setLoading(false)
    } else {
      console.log('No action taken - waiting for userRole and user')
    }
  }, [user, userRole])

  const loadCPVForms = async () => {
    if (!user) {
      console.log('No user found, skipping loadCPVForms')
      return;
    }
    
    console.log('=== loadCPVForms starting ===')
    console.log('User ID:', user.id)
    console.log('User role:', userRole)
    
    setLoading(true)
    try {
      let query = supabase
        .from('cpv_forms')
        .select('*')
        .order('created_at', { ascending: false })

      // For Super Admin, show all forms. For Client Admin, show only their forms
      if (userRole !== 'super_admin') {
        console.log('Filtering by user_id for Client Admin')
        query = query.eq('user_id', user.id)
      } else {
        console.log('Super Admin - fetching ALL forms')
      }

      const { data, error } = await query

      console.log('=== Supabase query result ===')
      console.log('Data:', data)
      console.log('Error:', error)
      console.log('Data length:', data?.length)

      if (error) {
        console.error('Supabase query error:', error)
        throw error
      }

      console.log('CPV Forms raw data:', data)

      // For Super Admin, we need to fetch additional data for company and agency columns
      let formsWithUserData: CPVForm[] = []
      
      if (userRole === 'super_admin' && data && data.length > 0) {
        // Get form creators' company info
        const userIds = [...new Set(data.map(form => form.user_id).filter(Boolean))]
        const leadAssignerIds = [...new Set(data.map(form => form.assigned_lead_assigner_id).filter(Boolean))]
        
        console.log('User IDs for company lookup:', userIds)
        console.log('Lead Assigner IDs for agency lookup:', leadAssignerIds)

        // Fetch user data for form creators (company info)
        let usersData = { data: [] }
        if (userIds.length > 0) {
          const userResult = await supabase
            .from('user_roles')
            .select('user_id, company')
            .in('user_id', userIds)
          
          console.log('Users query result:', userResult)
          usersData = userResult
        }

        // Fetch user data for lead assigners (agency info)
        let leadAssignersData = { data: [] }
        if (leadAssignerIds.length > 0) {
          const leadAssignerResult = await supabase
            .from('user_roles')
            .select('user_id, company')
            .in('user_id', leadAssignerIds)
          
          console.log('Lead assigners query result:', leadAssignerResult)
          leadAssignersData = leadAssignerResult
        }

        const userCompanyMap = (usersData.data || []).reduce((acc, user) => {
          acc[user.user_id] = user.company
          return acc
        }, {} as Record<string, string>)

        const leadAssignerCompanyMap = (leadAssignersData.data || []).reduce((acc, user) => {
          acc[user.user_id] = user.company
          return acc
        }, {} as Record<string, string>)

        console.log('User company map:', userCompanyMap)
        console.log('Lead assigner company map:', leadAssignerCompanyMap)

        formsWithUserData = data.map(form => ({
          id: form.id,
          name: form.name,
          created_at: form.created_at,
          status: form.status || 'active',
          current_status: form.current_status || 'draft',
          initiative: form.initiative,
          sections: Array.isArray(form.sections) ? form.sections : [],
          form_preview_data: form.form_preview_data,
          merchants_data: Array.isArray(form.merchants_data) ? form.merchants_data : [],
          assigned_lead_assigner_id: form.assigned_lead_assigner_id,
          company: userCompanyMap[form.user_id] || 'Unknown Company',
          agency: form.assigned_lead_assigner_id ? (leadAssignerCompanyMap[form.assigned_lead_assigner_id] || 'Unknown Agency') : 'Not Assigned'
        }))

        console.log('Final forms with user data:', formsWithUserData)
      } else {
        formsWithUserData = (data || []).map(form => ({
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
      }

      setCPVForms(formsWithUserData)
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
    console.log('=== handleMoreDetails clicked ===')
    console.log('Form:', form)
    console.log('User:', user)
    
    if (!user) {
      console.log('No user found, returning')
      return;
    }
    
    try {
      console.log('Checking if merchant data exists for form:', form.id)
      
      // First verify the user owns this form (for non-Super Admin users)
      if (userRole !== 'super_admin') {
        const { data: formOwnership, error: ownershipError } = await supabase
          .from('cpv_forms')
          .select('id, user_id, name')
          .eq('id', form.id)
          .eq('user_id', user.id)
          .maybeSingle()

        console.log('Form ownership check:', { formOwnership, ownershipError })

        if (ownershipError) {
          console.error('Error checking form ownership:', ownershipError)
          toast({
            title: 'Error',
            description: 'Failed to verify form access',
            variant: 'destructive',
          })
          return
        }

        if (!formOwnership) {
          console.error('User does not own this form or form not found')
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this form',
            variant: 'destructive',
          })
          return
        }
      }
      
      // Check if merchant data exists for this form
      const { data: merchantData, error } = await supabase
        .from('cpv_merchant_status')
        .select('id, merchant_name')
        .eq('cpv_form_id', form.id)
        .limit(5) // Check for a few records to be more certain

      console.log('Merchant data query result:', { merchantData, error })

      if (error) {
        console.error('Error in merchant data query:', error)
        // Don't throw error, just log and show upload dialog
        toast({
          title: 'Warning',
          description: 'Could not check existing data. Showing upload dialog.',
          variant: 'destructive',
        })
        setSelectedForm(form)
        setShowMerchantDetails(true)
        return
      }

      if (merchantData && merchantData.length > 0) {
        console.log(`Found ${merchantData.length} merchant records, redirecting to view`)
        // Data exists, redirect to view
        navigate(`/merchant-data/${form.id}`)
      } else {
        console.log('No merchant data exists, showing upload dialog')
        // No data exists, show upload dialog
        setSelectedForm(form)
        setShowMerchantDetails(true)
      }
    } catch (error: any) {
      console.error('Error checking merchant data:', error)
      console.log('Fallback: showing upload dialog due to error')
      toast({
        title: 'Error',
        description: 'Failed to check existing data. Please try again.',
        variant: 'destructive',
      })
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
        .maybeSingle()

      if (userError) throw userError
      
      if (!currentUserData) {
        toast({
          title: 'Error',
          description: 'User profile not found',
          variant: 'destructive',
        })
        return
      }

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
        .maybeSingle()

      console.log('Form ownership check:', { formOwnership, ownershipError })

      if (ownershipError) {
        console.error('Error checking form ownership:', ownershipError)
        toast({
          title: 'Error',
          description: 'Failed to verify form ownership',
          variant: 'destructive',
        })
        return
      }

      if (!formOwnership) {
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
      console.log('Sample merchant record for validation:', merchantRecords[0])
      
      // Validate required fields before insert
      for (let i = 0; i < merchantRecords.length; i++) {
        const record = merchantRecords[i]
        if (!record.merchant_name || !record.merchant_phone || !record.merchant_address || 
            !record.city || !record.state || !record.pincode) {
          toast({
            title: 'Data Validation Error',
            description: `Row ${i + 2}: Missing required fields. Please ensure all columns (Merchant Name, Phone, Address, City, State, Pincode) are filled.`,
            variant: 'destructive',
          })
          return
        }
      }

      const { data: insertedData, error } = await supabase
        .from('cpv_merchant_status')
        .insert(merchantRecords)
        .select()

      console.log('Supabase insert response:', { insertedData, error })

      if (error) {
        console.error('Supabase error details:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        
        // Provide more specific error messages
        let errorMessage = 'Failed to upload merchant data'
        if (error.message.includes('row-level security') || error.message.includes('permission denied')) {
          errorMessage = 'Access denied: You do not have permission to upload data to this form. Please ensure you own this CPV form.'
        } else if (error.message.includes('violates') || error.message.includes('constraint')) {
          errorMessage = 'Data validation error: Please check your Excel file format and ensure all required columns are present'
        } else if (error.message.includes('uuid') || error.message.includes('invalid input syntax')) {
          errorMessage = 'Invalid Lead Assigner selection or data format issue'
        } else if (error.message.includes('null value in column')) {
          errorMessage = 'Missing required data: Please ensure all mandatory fields are filled in your Excel file'
        } else if (error.message.includes('foreign key')) {
          errorMessage = 'Invalid reference: The selected Lead Assigner or CPV Form may not exist'
        } else {
          errorMessage = `Upload failed: ${error.message}`
        }
        
        toast({
          title: 'Upload Failed',
          description: errorMessage,
          variant: 'destructive',
        })
        return // Don't throw error, just return
      }

      console.log('Upload successful! Inserted records:', insertedData)

      // Update CPV form to assign it to the Lead Assigner
      // Get unique Lead Assigner IDs from the inserted data
      const uniqueLeadAssignerIds = [...new Set(
        merchantRecords
          .map(record => record.assigned_lead_assigner_id)
          .filter(id => id && id !== 'unassigned')
      )]

      console.log('Unique Lead Assigner IDs found:', uniqueLeadAssignerIds)

      if (uniqueLeadAssignerIds.length > 0) {
        // For simplicity, assign the form to the first Lead Assigner
        // In a more complex scenario, you might want to handle multiple assignments differently
        const primaryLeadAssignerId = uniqueLeadAssignerIds[0]
        
        console.log('Assigning CPV form to primary Lead Assigner:', primaryLeadAssignerId)
        const { error: formUpdateError } = await supabase
          .from('cpv_forms')
          .update({ assigned_lead_assigner_id: primaryLeadAssignerId })
          .eq('id', selectedForm.id)
          .eq('user_id', user.id)

        if (formUpdateError) {
          console.error('Error updating CPV form assignment:', formUpdateError)
          // Don't throw error here as merchant data was uploaded successfully
        } else {
          console.log('CPV form assigned to Lead Assigner successfully')
        }
      }

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
                        
                        {userRole === 'client_admin' && (
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
                        )}
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

  const renderSuperAdminView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 sm:gap-4 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1 sm:gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Dashboard</span>
          <span className="sm:hidden">Back</span>
        </Button>
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CPV Merchant Status - Super Admin</h1>
        <p className="text-muted-foreground">Monitor all CPV forms and merchant verification status across the system</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All CPV Forms</CardTitle>
          <CardDescription>
            View and monitor all CPV forms in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : cpvForms.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No CPV forms found in the system.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sr. No</TableHead>
                  <TableHead>CPV Form</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Agency</TableHead>
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
                    <TableCell>{form.company || 'Unknown'}</TableCell>
                    <TableCell>{form.agency || 'Not Assigned'}</TableCell>
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
                          onClick={() => navigate(`/merchant-data/${form.id}`)}
                        >
                          <MoreHorizontal className="h-4 w-4 mr-1" />
                          More Details
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

  // Lead Assigner View - shows CPV forms dashboard
  const renderLeadAssignerView = () => {
    return <LeadAssignerDashboard />
  }

  // CPV Agent View - shows leads assigned to them  
  const renderCPVAgentView = () => {
    return <CPVAgentDashboard />
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