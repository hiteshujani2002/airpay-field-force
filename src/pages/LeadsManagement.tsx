import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Filter, Download, Upload, FileText, Users, FileDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'

interface MerchantData {
  id: string;
  merchant_name: string;
  merchant_phone: string;
  merchant_address: string;
  city: string;
  state: string;
  pincode: string;
  verification_status: string;
  assigned_cpv_agent_id?: string;
  cpv_agent?: string;
  uploaded_on: string;
  verification_file_url?: string;
  verification_pdf_url?: string;
  cpv_agent_name?: string;
}

interface CPVForm {
  id: string;
  name: string;
  initiative: string;
}

interface CPVAgent {
  user_id: string;
  username: string;
  email: string;
}

const LeadsManagement = () => {
  const { formId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [cpvForm, setCpvForm] = useState<CPVForm | null>(null)
  const [merchants, setMerchants] = useState<MerchantData[]>([])
  const [filteredMerchants, setFilteredMerchants] = useState<MerchantData[]>([])
  const [cpvAgents, setCpvAgents] = useState<CPVAgent[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedState, setSelectedState] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('')
  
  // Assignment states
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false)
  const [individualAssignOpen, setIndividualAssignOpen] = useState(false)
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantData | null>(null)
  const [assignFile, setAssignFile] = useState<File | null>(null)
  const [bulkAssignAgent, setBulkAssignAgent] = useState('')
  const [individualAssignAgent, setIndividualAssignAgent] = useState('')

  useEffect(() => {
    if (formId && user) {
      loadData()
    }
  }, [formId, user])

  useEffect(() => {
    applyFilters()
  }, [merchants, selectedState, selectedStatus, selectedAgent])

  const loadData = async () => {
    if (!formId || !user) return

    setLoading(true)
    try {
      // Load CPV form details
      const { data: formData, error: formError } = await supabase
        .from('cpv_forms')
        .select('id, name, initiative')
        .eq('id', formId)
        .single()

      if (formError) throw formError
      setCpvForm(formData)

      // Load merchant data
      const { data: merchantData, error: merchantError } = await supabase
        .from('cpv_merchant_status')
        .select('*')
        .eq('cpv_form_id', formId)
        .eq('assigned_lead_assigner_id', user.id)
        .order('uploaded_on', { ascending: false })

      if (merchantError) throw merchantError

      // Load CPV agents created by this lead assigner
      const { data: agentData, error: agentError } = await supabase
        .from('user_roles')
        .select('user_id, username, email')
        .eq('role', 'cpv_agent')
        .eq('created_by_user_id', user.id)
        .order('username', { ascending: true })

      if (agentError) throw agentError
      setCpvAgents(agentData || [])

      // Get agent names for assigned merchants
      const assignedAgentIds = merchantData
        ?.filter(m => m.assigned_cpv_agent_id)
        .map(m => m.assigned_cpv_agent_id) || []

      if (assignedAgentIds.length > 0) {
        const { data: agentNames, error: agentNameError } = await supabase
          .from('user_roles')
          .select('user_id, username')
          .in('user_id', assignedAgentIds)

        if (!agentNameError && agentNames) {
          const agentMap = new Map(agentNames.map(a => [a.user_id, a.username]))
          merchantData?.forEach((merchant: any) => {
            if (merchant.assigned_cpv_agent_id) {
              merchant.cpv_agent_name = agentMap.get(merchant.assigned_cpv_agent_id) || 'Unknown Agent'
            }
          })
        }
      }

      // Debug logging for merchant data
      console.log('=== MERCHANT DATA DEBUG ===')
      console.log('Merchant data loaded:', merchantData)
      merchantData?.forEach((merchant, index) => {
        console.log(`Merchant ${index}:`, {
          name: merchant.merchant_name,
          status: merchant.verification_status,
          pdf_url: merchant.verification_pdf_url,
          agent_id: merchant.assigned_cpv_agent_id
        })
      })

      setMerchants(merchantData || [])
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...merchants]

    if (selectedState) {
      filtered = filtered.filter(m => m.state.toLowerCase().includes(selectedState.toLowerCase()))
    }

    if (selectedStatus) {
      filtered = filtered.filter(m => m.verification_status === selectedStatus)
    }

    if (selectedAgent) {
      if (selectedAgent === 'unassigned') {
        filtered = filtered.filter(m => !m.assigned_cpv_agent_id)
      } else {
        filtered = filtered.filter(m => m.assigned_cpv_agent_id === selectedAgent)
      }
    }

    setFilteredMerchants(filtered)
  }

  const clearFilters = () => {
    setSelectedState('')
    setSelectedStatus('')
    setSelectedAgent('')
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'assigned':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Assigned</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>
    }
  }

  const handleDownloadData = () => {
    const exportData = filteredMerchants.map((merchant, index) => ({
      'Sr. No': index + 1,
      'Unique ID': merchant.id,
      'Merchant Name': merchant.merchant_name,
      'Phone': merchant.merchant_phone,
      'Address': merchant.merchant_address,
      'City': merchant.city,
      'State': merchant.state,
      'Pincode': merchant.pincode,
      'Current Status': merchant.verification_status,
      'CPV Agent': merchant.cpv_agent_name || 'Yet to be Assigned',
      'Uploaded On': format(new Date(merchant.uploaded_on), 'MMM dd, yyyy HH:mm')
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Merchant Data')
    XLSX.writeFile(wb, `${cpvForm?.name || 'Merchant_Data'}.xlsx`)

    toast({
      title: 'Success',
      description: 'Data downloaded successfully',
    })
  }

  const handleBulkAssign = async () => {
    if (!assignFile || !bulkAssignAgent) {
      toast({
        title: 'Error',
        description: 'Please select both a file and a CPV agent',
        variant: 'destructive',
      })
      return
    }

    try {
      // Parse Excel file
      const data = await assignFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

      // Validate required columns
      const firstRow = jsonData[0] || {}
      if (!('Unique ID' in firstRow)) {
        toast({
          title: 'Invalid File',
          description: 'File must contain a "Unique ID" column',
          variant: 'destructive',
        })
        return
      }

      const merchantIds = jsonData.map(row => row['Unique ID']).filter(Boolean)
      
      if (merchantIds.length === 0) {
        toast({
          title: 'No Data',
          description: 'No valid merchant IDs found in the file',
          variant: 'destructive',
        })
        return
      }

      // Update assignments
      const { error } = await supabase
        .from('cpv_merchant_status')
        .update({ 
          assigned_cpv_agent_id: bulkAssignAgent,
          cpv_agent_assigned_on: new Date().toISOString(),
          verification_status: 'assigned'
        })
        .in('id', merchantIds)
        .eq('assigned_lead_assigner_id', user?.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: `${merchantIds.length} merchants assigned successfully`,
      })

      setBulkAssignOpen(false)
      setAssignFile(null)
      setBulkAssignAgent('')
      loadData()
    } catch (error: any) {
      console.error('Error in bulk assignment:', error)
      toast({
        title: 'Error',
        description: 'Failed to assign merchants',
        variant: 'destructive',
      })
    }
  }

  const handleIndividualAssign = async () => {
    if (!selectedMerchant || !individualAssignAgent) return

    try {
      const { error } = await supabase
        .from('cpv_merchant_status')
        .update({ 
          assigned_cpv_agent_id: individualAssignAgent,
          cpv_agent_assigned_on: new Date().toISOString(),
          verification_status: 'assigned'
        })
        .eq('id', selectedMerchant.id)
        .eq('assigned_lead_assigner_id', user?.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Merchant assigned successfully',
      })

      setIndividualAssignOpen(false)
      setSelectedMerchant(null)
      setIndividualAssignAgent('')
      loadData()
    } catch (error: any) {
      console.error('Error in individual assignment:', error)
      toast({
        title: 'Error',
        description: 'Failed to assign merchant',
        variant: 'destructive',
      })
    }
  }

  const handleDownloadPDF = async (merchant: MerchantData) => {
    if (merchant.verification_status === 'completed' && merchant.verification_pdf_url) {
      // Download the existing PDF
      try {
        const response = await fetch(merchant.verification_pdf_url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `${merchant.merchant_name}_CPV_Report.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: 'Success',
          description: 'CPV report downloaded successfully',
        })
      } catch (error) {
        console.error('Error downloading PDF:', error)
        toast({
          title: 'Error',
          description: 'Failed to download PDF',
          variant: 'destructive',
        })
      }
    } else {
      toast({
        title: 'Not Available',
        description: 'PDF is only available for completed verifications',
        variant: 'destructive',
      })
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
    } catch {
      return 'N/A'
    }
  }

  const uniqueStates = [...new Set(merchants.map(m => m.state))].filter(Boolean).sort()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leads data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{cpvForm?.name}</h1>
          <p className="text-muted-foreground">Initiative: {cpvForm?.initiative}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Leads Management</CardTitle>
              <CardDescription>
                Manage and assign merchant leads to CPV agents
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Filter Leads</DialogTitle>
                    <DialogDescription>
                      Filter leads by state, status, or assigned agent
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="state-filter">State</Label>
                      <Select value={selectedState} onValueChange={setSelectedState}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All States</SelectItem>
                          {uniqueStates.map(state => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status-filter">Current Status</Label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="agent-filter">CPV Agent</Label>
                      <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select agent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Agents</SelectItem>
                          <SelectItem value="unassigned">Yet to be Assigned</SelectItem>
                          {cpvAgents.map(agent => (
                            <SelectItem key={agent.user_id} value={agent.user_id}>
                              {agent.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => setFilterOpen(false)}>Apply</Button>
                      <Button variant="outline" onClick={clearFilters}>Clear</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                onClick={handleDownloadData}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>

              <Dialog open={bulkAssignOpen} onOpenChange={setBulkAssignOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assign
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Assignment</DialogTitle>
                    <DialogDescription>
                      Upload a spreadsheet to assign multiple merchants to a CPV agent
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="assign-agent">Select CPV Agent</Label>
                      <Select value={bulkAssignAgent} onValueChange={setBulkAssignAgent}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an agent" />
                        </SelectTrigger>
                        <SelectContent>
                          {cpvAgents.map(agent => (
                            <SelectItem key={agent.user_id} value={agent.user_id}>
                              {agent.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="assign-file">Upload File</Label>
                      <Input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setAssignFile(e.target.files?.[0] || null)}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        File must contain a "Unique ID" column with merchant IDs
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleBulkAssign}
                        disabled={!assignFile || !bulkAssignAgent}
                      >
                        Assign All
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setBulkAssignOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMerchants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">
                {merchants.length === 0 ? 'No leads found' : 'No leads match your filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unique ID</TableHead>
                    <TableHead>Merchant Name</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Pincode</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Current Status</TableHead>
                    <TableHead>CPV Agent</TableHead>
                    <TableHead>Uploaded On</TableHead>
                    <TableHead>Digital Copy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMerchants.map(merchant => (
                    <TableRow key={merchant.id}>
                      <TableCell className="font-mono text-sm">{merchant.id.slice(-8)}</TableCell>
                      <TableCell className="font-medium">{merchant.merchant_name}</TableCell>
                      <TableCell>{merchant.state}</TableCell>
                      <TableCell>{merchant.city}</TableCell>
                      <TableCell>{merchant.pincode}</TableCell>
                      <TableCell className="max-w-xs truncate" title={merchant.merchant_address}>
                        {merchant.merchant_address}
                      </TableCell>
                      <TableCell>{getStatusBadge(merchant.verification_status)}</TableCell>
                      <TableCell>
                        {merchant.assigned_cpv_agent_id ? (
                          <span className="text-sm">{merchant.cpv_agent_name}</span>
                        ) : (
                          <Dialog open={individualAssignOpen && selectedMerchant?.id === merchant.id} 
                                 onOpenChange={(open) => {
                                   setIndividualAssignOpen(open)
                                   if (open) setSelectedMerchant(merchant)
                                   else setSelectedMerchant(null)
                                 }}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-xs"
                              >
                                Yet to be Assigned
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assign Merchant</DialogTitle>
                                <DialogDescription>
                                  Assign {merchant.merchant_name} to a CPV agent
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Select CPV Agent</Label>
                                  <Select 
                                    value={individualAssignAgent} 
                                    onValueChange={setIndividualAssignAgent}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose an agent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {cpvAgents.map(agent => (
                                        <SelectItem key={agent.user_id} value={agent.user_id}>
                                          {agent.username}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={handleIndividualAssign}
                                    disabled={!individualAssignAgent}
                                  >
                                    Assign
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setIndividualAssignOpen(false)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(merchant.uploaded_on)}</TableCell>
                      <TableCell>
                        {/* Debug info */}
                        <div className="text-xs text-muted-foreground mb-1">
                          Status: {merchant.verification_status} | PDF: {merchant.verification_pdf_url ? 'Yes' : 'No'}
                        </div>
                        {merchant.verification_status === 'completed' ? (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadPDF(merchant)}
                            className="h-8 w-8 p-0"
                            title="Download CPV Report PDF"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">Pending completion</span>
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
    </div>
  )
}

export default LeadsManagement