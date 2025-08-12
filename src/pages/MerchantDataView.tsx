import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AuthGate } from '@/components/AuthGate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface MerchantData {
  id: string;
  merchant_name: string;
  merchant_phone: string;
  merchant_address: string;
  city: string;
  state: string;
  pincode: string;
  cpv_agent?: string;
  assigned_on?: string;
  uploaded_on: string;
  verification_status: string;
  verification_file_url?: string;
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
        .select('*')
        .eq('cpv_form_id', formId)
        .order('uploaded_on', { ascending: false })

      if (merchantsError) throw merchantsError
      setMerchantData(merchantsData || [])

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

  const handleDownloadFile = (fileUrl?: string) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank')
    } else {
      toast({
        title: 'File not available',
        description: 'Verification file will be available after CPV Agent completes the process',
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
                            <TableCell>{merchant.cpv_agent || 'Not Assigned'}</TableCell>
                            <TableCell>{getStatusBadge(merchant.verification_status)}</TableCell>
                            <TableCell>{new Date(merchant.uploaded_on).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {merchant.assigned_on ? new Date(merchant.assigned_on).toLocaleDateString() : 'Not Assigned'}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadFile(merchant.verification_file_url)}
                                disabled={!merchant.verification_file_url}
                                className={merchant.verification_file_url ? 'text-primary hover:text-primary/80' : 'text-muted-foreground cursor-not-allowed'}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
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
        </div>
      </div>
    </AuthGate>
  )
}

export default MerchantDataView