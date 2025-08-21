import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, MoreHorizontal } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'

interface AssignedCPVForm {
  id: string;
  name: string;
  initiative: string;
  current_status: string;
  created_at: string;
  updated_at: string;
  assigned_by: string;
  assigned_on: string;
  assigned_by_username?: string;
}

const LeadAssignerDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [assignedForms, setAssignedForms] = useState<AssignedCPVForm[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadAssignedForms()
    }
  }, [user])

  const loadAssignedForms = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Get all CPV forms that have merchants assigned to this lead assigner
      const { data: merchantData, error } = await supabase
        .from('cpv_merchant_status')
        .select(`
          cpv_form_id,
          assigned_on,
          uploaded_by_user_id,
          cpv_forms:cpv_form_id (
            id,
            name,
            initiative,
            current_status,
            created_at,
            updated_at
          )
        `)
        .eq('assigned_lead_assigner_id', user.id)

      if (error) throw error

      // Group by form and get unique forms
      const uniqueForms = new Map()
      
      for (const item of merchantData || []) {
        if (item.cpv_forms) {
          const formId = item.cpv_forms.id
          if (!uniqueForms.has(formId)) {
            uniqueForms.set(formId, {
              id: item.cpv_forms.id,
              name: item.cpv_forms.name,
              initiative: item.cpv_forms.initiative,
              current_status: item.cpv_forms.current_status,
              created_at: item.cpv_forms.created_at,
              updated_at: item.cpv_forms.updated_at,
              assigned_by: item.uploaded_by_user_id,
              assigned_on: item.assigned_on
            })
          }
        }
      }

      const formsArray = Array.from(uniqueForms.values())

      // Get usernames for assigned_by users
      if (formsArray.length > 0) {
        const userIds = [...new Set(formsArray.map(form => form.assigned_by))]
        const { data: userData, error: userError } = await supabase
          .from('user_roles')
          .select('user_id, username')
          .in('user_id', userIds)

        if (!userError && userData) {
          const userMap = new Map(userData.map(u => [u.user_id, u.username]))
          formsArray.forEach(form => {
            form.assigned_by_username = userMap.get(form.assigned_by) || 'Unknown'
          })
        }
      }

      setAssignedForms(formsArray)
    } catch (error: any) {
      console.error('Error loading assigned forms:', error)
      toast({
        title: 'Error',
        description: 'Failed to load assigned forms',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Completed</Badge>
      default:
        return <Badge variant="outline">{status || 'Draft'}</Badge>
    }
  }

  const handleViewForm = (form: AssignedCPVForm) => {
    // TODO: Implement form preview modal
    toast({
      title: 'Form Preview',
      description: 'Form preview functionality will be implemented',
    })
  }

  const handleMoreDetails = (form: AssignedCPVForm) => {
    navigate(`/leads-management/${form.id}`)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return 'N/A'
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
    } catch {
      return 'N/A'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assigned forms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>CPV Forms Dashboard</CardTitle>
          <CardDescription>
            Manage CPV forms assigned to you for lead processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignedForms.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">No CPV forms assigned to you yet</p>
              <p className="text-sm text-muted-foreground">
                Forms will appear here when a Client Admin assigns merchant data to you
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Sr. No</TableHead>
                    <TableHead>CPV Form</TableHead>
                    <TableHead>Initiative</TableHead>
                    <TableHead>Assigned By</TableHead>
                    <TableHead>Assigned On</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead>Current Status</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-center">View Form</TableHead>
                    <TableHead className="text-center">More Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedForms.map((form, index) => (
                    <TableRow key={form.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{form.name}</TableCell>
                      <TableCell>{form.initiative}</TableCell>
                      <TableCell>{form.assigned_by_username}</TableCell>
                      <TableCell>{formatDate(form.assigned_on)}</TableCell>
                      <TableCell>{formatDate(form.created_at)}</TableCell>
                      <TableCell>{getStatusBadge(form.current_status)}</TableCell>
                      <TableCell>{formatDateTime(form.updated_at)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewForm(form)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoreDetails(form)}
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
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
  )
}

export default LeadAssignerDashboard