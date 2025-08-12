import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AuthGate } from '@/components/AuthGate'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Download } from 'lucide-react'
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
  cpv_agent: string;
  assigned_on: string | null;
  uploaded_on: string;
  verification_status: string;
  verification_file_url: string | null;
}

interface CPVForm {
  id: string;
  name: string;
  initiative: string;
}

const MerchantDataView = () => {
  const { formId } = useParams<{ formId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [merchantData, setMerchantData] = useState<MerchantData[]>([])
  const [cpvForm, setCpvForm] = useState<CPVForm | null>(null)
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
      setCpvForm(formData)

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
      'pending': { variant: 'outline' as const, className: 'bg-yellow-100 text-yellow-800' },
      'in_progress': { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' },
      'completed': { variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      'rejected': { variant: 'destructive' as const, className: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, className: '' }
    return <Badge variant={config.variant} className={config.className}>{status}</Badge>
  }

  const handleDownloadFile = (fileUrl: string | null) => {
    if (!fileUrl) return;
    // This would normally trigger file download
    toast({
      title: 'Download',
      description: 'File download would be triggered here',
    })
  }

  if (loading) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </AuthGate>
    )
  }

  if (!cpvForm) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center p-8">
              <h2 className="text-xl font-semibold mb-2">Form Not Found</h2>
              <p className="text-muted-foreground mb-4">The requested CPV form could not be found.</p>
              <Button onClick={() => navigate('/cpv-merchant-status')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to CPV Merchant Status
              </Button>
            </div>
          </div>
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
                <h1 className="text-3xl font-bold tracking-tight">Merchant Data View</h1>
                <p className="text-muted-foreground">
                  {cpvForm.name} - {cpvForm.initiative}
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Uploaded Merchants</CardTitle>
                <CardDescription>
                  View and manage merchant verification data for this CPV form
                </CardDescription>
              </CardHeader>
              <CardContent>
                {merchantData.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    No merchant data uploaded yet. Use "More Details" to upload merchant data.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Merchant Name</TableHead>
                          <TableHead>Phone</TableHead>
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
                        {merchantData.map((merchant) => (
                          <TableRow key={merchant.id}>
                            <TableCell className="font-medium">{merchant.merchant_name}</TableCell>
                            <TableCell>{merchant.merchant_phone}</TableCell>
                            <TableCell>{merchant.merchant_address}</TableCell>
                            <TableCell>{merchant.city}</TableCell>
                            <TableCell>{merchant.state}</TableCell>
                            <TableCell>{merchant.pincode}</TableCell>
                            <TableCell>{merchant.cpv_agent}</TableCell>
                            <TableCell>{getStatusBadge(merchant.verification_status)}</TableCell>
                            <TableCell>{new Date(merchant.uploaded_on).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {merchant.assigned_on 
                                ? new Date(merchant.assigned_on).toLocaleDateString() 
                                : '-'
                              }
                            </TableCell>
                            <TableCell>
                              {merchant.verification_status === 'completed' && merchant.verification_file_url ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDownloadFile(merchant.verification_file_url)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              ) : (
                                <FileText className="h-4 w-4 text-muted-foreground" />
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
        </div>
      </div>
    </AuthGate>
  )
}

export default MerchantDataView