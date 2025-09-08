import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AuthGate } from '@/components/AuthGate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Upload, Users, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import MerchantDataDialog from '@/components/MerchantDataDialog'
import { generateStandardizedCPVPDF, downloadPDF } from '@/lib/pdfGenerator'
import * as XLSX from 'xlsx'

interface MerchantData {
  id: string;
  merchant_name: string;
  merchant_phone: string;
  merchant_address: string;
  city: string;
  state: string;
  pincode: string;
  assigned_lead_assigner_id?: string;
  assigned_cpv_agent_id?: string;
  cpv_agent?: string;
  assigned_on?: string;
  cpv_agent_assigned_on?: string;
  uploaded_on: string;
  verification_status: string;
  verification_file_url?: string;
  verification_pdf_url?: string;
  completed_form_data?: any;
}

interface CPVForm {
  id: string;
  name: string;
  initiative: string;
}

const MerchantDataView = () => {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [merchantData, setMerchantData] = useState<MerchantData[]>([])
  const [cpvForm, setCPVForm] = useState<CPVForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showReassignDialog, setShowReassignDialog] = useState(false)
  const [leadAssigners, setLeadAssigners] = useState<{ [key: string]: string }>({})
  const [cpvAgents, setCPVAgents] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (formId && user) {
      loadData()
    }
  }, [formId, user])

  const loadData = async () => {
    if (!formId || !user) return;
    
    setLoading(true)
    try {
      // Load CPV form details
      const { data: formData, error: formError } = await supabase
        .from('cpv_forms')
        .select('id, name, initiative')
        .eq('id', formId)
        .eq('user_id', user.id)
        .single()

      if (formError) throw formError
      setCPVForm(formData)

      // Load merchant data
      const { data: merchantsData, error: merchantsError } = await supabase
        .from('cpv_merchant_status')
        .select('*, verification_pdf_url')
        .eq('cpv_form_id', formId)
        .order('uploaded_on', { ascending: false })

      if (merchantsError) throw merchantsError
      setMerchantData(merchantsData || [])

      // Load lead assigners names for display
      if (merchantsData && merchantsData.length > 0) {
        const uniqueLeadAssignerIds = [...new Set(merchantsData
          .map(m => m.assigned_lead_assigner_id)
          .filter(Boolean)
        )]

        if (uniqueLeadAssignerIds.length > 0) {
          const { data: leadAssignersData, error: leadAssignersError } = await supabase
            .from('user_roles')
            .select('user_id, username')
            .in('user_id', uniqueLeadAssignerIds)

          if (!leadAssignersError && leadAssignersData) {
            const leadAssignersMap = leadAssignersData.reduce((acc, la) => {
              acc[la.user_id] = la.username
              return acc
            }, {} as { [key: string]: string })
            setLeadAssigners(leadAssignersMap)
          }
        }

        // Load CPV agents names for display
        const uniqueCPVAgentIds = [...new Set(merchantsData
          .map(m => m.assigned_cpv_agent_id)
          .filter(Boolean)
        )]

        console.log('Debug CPV Agents:', {
          merchantsData: merchantsData.map(m => ({ 
            id: m.id, 
            merchant_name: m.merchant_name,
            assigned_cpv_agent_id: m.assigned_cpv_agent_id 
          })),
          uniqueCPVAgentIds,
          uniqueCPVAgentIdsCount: uniqueCPVAgentIds.length
        });

        if (uniqueCPVAgentIds.length > 0) {
          const { data: cpvAgentsData, error: cpvAgentsError } = await supabase
            .from('user_roles')
            .select('user_id, username')
            .in('user_id', uniqueCPVAgentIds)

          console.log('CPV Agents query result:', { cpvAgentsData, cpvAgentsError });

          if (!cpvAgentsError && cpvAgentsData) {
            const cpvAgentsMap = cpvAgentsData.reduce((acc, ca) => {
              acc[ca.user_id] = ca.username
              return acc
            }, {} as { [key: string]: string })
            console.log('CPV Agents map:', cpvAgentsMap);
            setCPVAgents(cpvAgentsMap)
          }
        }
      }

    } catch (error: any) {
      console.error('Error loading data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load merchant data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { variant: 'secondary' as const, className: 'bg-yellow-500 text-white' },
      'in_progress': { variant: 'default' as const, className: 'bg-blue-500 text-white' },
      'completed': { variant: 'default' as const, className: 'bg-green-500 text-white' },
      'rejected': { variant: 'destructive' as const, className: 'bg-red-500 text-white' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, className: '' }
    return <Badge variant={config.variant} className={config.className}>{status}</Badge>
  }

  const getLeadAssignerName = (leadAssignerId?: string) => {
    return leadAssignerId ? (leadAssigners[leadAssignerId] || 'Unknown') : 'Not Assigned'
  }

  const getCPVAgentName = (cpvAgentId?: string) => {
    console.log('Getting CPV agent name for ID:', cpvAgentId, 'Available agents:', cpvAgents);
    return cpvAgentId ? (cpvAgents[cpvAgentId] || 'Unknown') : 'NA'
  }

  const handleDownloadFile = async (merchant: MerchantData) => {
    if (!merchant.verification_status || !['completed', 'verified'].includes(merchant.verification_status.toLowerCase())) {
      toast({
        title: 'File not available',
        description: 'Verification file will be available after CPV Agent completes the process',
        variant: 'destructive',
      })
      return
    }

    try {
      // First, check if there's already a stored PDF URL
      if (merchant.verification_pdf_url) {
        // Download directly from the stored URL
        const response = await fetch(merchant.verification_pdf_url);
        if (response.ok) {
          const blob = await response.blob();
          downloadPDF(blob, `CPV_Report_${merchant.merchant_name}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
          
          toast({
            title: 'Success',
            description: 'CPV report downloaded successfully',
          });
          return;
        }
      }

      // Fallback: Generate PDF if no stored URL or fetch failed
      // Fetch the CPV form structure and completed form data
      const [formResult, merchantResult] = await Promise.all([
        supabase
          .from('cpv_forms')
          .select('name, initiative, sections, form_preview_data')
          .eq('id', formId)
          .single(),
        supabase
          .from('cpv_merchant_status')
          .select('completed_form_data, verification_pdf_url')
          .eq('id', merchant.id)
          .single()
      ]);

      if (formResult.error || !formResult.data) {
        toast({
          title: 'Error',
          description: 'Unable to fetch form structure',
          variant: 'destructive',
        })
        return
      }

      const formStructure = formResult.data;
      const merchantData = merchantResult.data;

      // Ensure we have completed form data - this should exist for verified merchants
      if (!merchantData?.completed_form_data) {
        toast({
          title: 'Error',
          description: 'No completed form data found. Please complete the CPV verification first.',
          variant: 'destructive',
        });
        return;
      }

      const completedFormData = merchantData.completed_form_data as any;
      
      console.log('=== PDF Generation Debug ===');
      console.log('User role generating PDF:', user);
      console.log('Merchant data:', merchant);
      console.log('Form structure:', formStructure);
      console.log('Retrieved completed form data:', completedFormData);
      console.log('Type of completed form data:', typeof completedFormData);
      console.log('Keys in completed form data:', completedFormData ? Object.keys(completedFormData) : 'No data');
      console.log('=== End PDF Generation Debug ===');
      
      // Validate that essential form data is present
      if (!completedFormData || typeof completedFormData !== 'object') {
        toast({
          title: 'Error',
          description: 'Invalid form data found. The CPV verification may be incomplete.',
          variant: 'destructive',
        });
        return;
      }

      // Convert visit_date back to Date object if it's a string  
      if (completedFormData && typeof completedFormData === 'object' && completedFormData.visit_date && typeof completedFormData.visit_date === 'string') {
        completedFormData.visit_date = new Date(completedFormData.visit_date);
      }

      // Generate PDF with the actual completed data
      const pdfBlob = await generateStandardizedCPVPDF(
        {
          id: merchant.id,
          merchant_name: merchant.merchant_name,
          merchant_phone: merchant.merchant_phone,
          merchant_address: merchant.merchant_address,
          city: merchant.city,
          state: merchant.state,
          pincode: merchant.pincode,
          verification_status: merchant.verification_status,
          cpv_agent_name: merchant.cpv_agent || 'Not Assigned',
          cpv_agent_assigned_on: merchant.cpv_agent_assigned_on || undefined
        },
        {
          name: formStructure.name || 'CPV Form',
          initiative: formStructure.initiative || 'Not specified',
          sections: formStructure.sections || [],
          form_preview_data: formStructure.form_preview_data || {}
        },
        completedFormData
      )

      downloadPDF(pdfBlob, `CPV_Report_${merchant.merchant_name}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`)
      
      toast({
        title: 'Success',
        description: 'CPV report downloaded successfully',
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate PDF report',
        variant: 'destructive',
      })
    }
  }

  const parseExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsBinaryString(file)
    })
  }

  const handleUploadData = async (file: File, leadAssignerId: string) => {
    if (!user || !formId) return;

    try {
      const excelData = await parseExcelFile(file)
      
      if (!excelData || excelData.length === 0) {
        toast({
          title: 'Error',
          description: 'Excel file is empty or invalid',
          variant: 'destructive',
        })
        return
      }

      const merchantRecords = excelData.map((row: any) => ({
        cpv_form_id: formId,
        uploaded_by_user_id: user.id,
        assigned_lead_assigner_id: leadAssignerId,
        merchant_name: row['Merchant Name'] || '',
        merchant_phone: row['Merchant Phone Number'] || '',
        merchant_address: row['Merchant Address'] || '',
        city: row['City'] || '',
        state: row['State'] || '',
        pincode: row['Pincode'] || '',
        verification_status: 'pending'
      }))

      const { error } = await supabase
        .from('cpv_merchant_status')
        .insert(merchantRecords)

      if (error) throw error

      toast({
        title: 'Success',
        description: `${merchantRecords.length} merchants uploaded successfully`,
      })

      loadData() // Reload the data to show new entries
    } catch (error: any) {
      console.error('Error uploading data:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload merchant data',
        variant: 'destructive',
      })
    }
  }

  const handleReassignData = async (file: File, leadAssignerId: string) => {
    if (!user || !formId) return;

    try {
      const excelData = await parseExcelFile(file)
      
      if (!excelData || excelData.length === 0) {
        toast({
          title: 'Error',
          description: 'Excel file is empty or invalid',
          variant: 'destructive',
        })
        return
      }

      let updatedCount = 0

      // Process each row in the Excel file
      for (const row of excelData) {
        const merchantName = row['Merchant Name']
        const merchantPhone = row['Merchant Phone Number']

        if (merchantName && merchantPhone) {
          // Find and update matching records
          const { error } = await supabase
            .from('cpv_merchant_status')
            .update({ 
              assigned_lead_assigner_id: leadAssignerId,
              assigned_on: new Date().toISOString()
            })
            .eq('cpv_form_id', formId)
            .eq('merchant_name', merchantName)
            .eq('merchant_phone', merchantPhone)

          if (!error) {
            updatedCount++
          }
        }
      }

      toast({
        title: 'Success',
        description: `${updatedCount} merchants reassigned successfully`,
      })

      loadData() // Reload the data to show updates
    } catch (error: any) {
      console.error('Error reassigning data:', error)
      toast({
        title: 'Error',
        description: 'Failed to reassign merchant data',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthGate>
    )
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/cpv-merchant-status')}
                  className="mb-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to CPV Merchant Status
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">
                  Merchant Data - {cpvForm?.name}
                </h1>
                <p className="text-muted-foreground">
                  Initiative: {cpvForm?.initiative} | Total Merchants: {merchantData.length}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowReassignDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Reassign Lead Assigner
                </Button>
                <Button
                  onClick={() => setShowUploadDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Data
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Uploaded Merchant Data</CardTitle>
              </CardHeader>
              <CardContent>
                {merchantData.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    No merchant data uploaded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sr. No</TableHead>
                          <TableHead>Merchant Name</TableHead>
                          <TableHead>Phone Number</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead>State</TableHead>
                          <TableHead>Pincode</TableHead>
                          <TableHead>Lead Assigner</TableHead>
                          <TableHead>CPV Agent</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Uploaded On</TableHead>
                          <TableHead>Assigned On</TableHead>
                          <TableHead>File</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {merchantData.map((merchant, index) => (
                          <TableRow key={merchant.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{merchant.merchant_name}</TableCell>
                            <TableCell>{merchant.merchant_phone}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{merchant.merchant_address}</TableCell>
                            <TableCell>{merchant.city}</TableCell>
                            <TableCell>{merchant.state}</TableCell>
                            <TableCell>{merchant.pincode}</TableCell>
                            <TableCell>{getLeadAssignerName(merchant.assigned_lead_assigner_id)}</TableCell>
                            <TableCell>{getCPVAgentName(merchant.assigned_cpv_agent_id)}</TableCell>
                            <TableCell>{getStatusBadge(merchant.verification_status)}</TableCell>
                            <TableCell>{new Date(merchant.uploaded_on).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {merchant.assigned_on ? new Date(merchant.assigned_on).toLocaleDateString() : 'Not Assigned'}
                            </TableCell>
                            <TableCell>
                              {merchant.verification_status && ['completed', 'verified'].includes(merchant.verification_status.toLowerCase()) ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadFile(merchant)}
                                  className="text-primary hover:bg-primary/10"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled
                                  className="text-muted-foreground cursor-not-allowed"
                                  title="Verification file will be available after CPV Agent completes the process"
                                >
                                  <FileText className="h-4 w-4" />
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

            <MerchantDataDialog
              open={showUploadDialog}
              onOpenChange={setShowUploadDialog}
              onSubmit={handleUploadData}
              title="Upload Additional Data"
              description="Upload new merchant data and assign to a Lead Assigner. This will add to existing data."
              isReassign={false}
            />

            <MerchantDataDialog
              open={showReassignDialog}
              onOpenChange={setShowReassignDialog}
              onSubmit={handleReassignData}
              title="Reassign Lead Assigner"
              description="Upload Excel file with merchant data to reassign to a new Lead Assigner. Matching records will be updated."
              isReassign={true}
            />
          </div>
        </div>
      </div>
    </AuthGate>
  )
}

export default MerchantDataView