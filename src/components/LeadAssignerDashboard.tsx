import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, MoreHorizontal, ArrowLeft } from 'lucide-react'
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

  // Real-time updates for Lead Assigner assignments
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('lead-assigner-form-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cpv_merchant_status',
          filter: `assigned_lead_assigner_id=eq.${user.id}`
        },
        () => {
          console.log('Real-time update detected for Lead Assigner assignments')
          loadAssignedForms()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const loadAssignedForms = async () => {
    if (!user) return

    setLoading(true)
    try {
      console.log('=== Loading CPV forms for Lead Assigner ===')
      console.log('User ID:', user.id)
      console.log('User email:', user.email)
      
      // Get CPV forms that have merchants assigned to this lead assigner
      // We need to find forms that have merchant data assigned to this user
      const { data: merchantAssignments, error: merchantError } = await supabase
        .from('cpv_merchant_status')
        .select('cpv_form_id')
        .eq('assigned_lead_assigner_id', user.id)

      if (merchantError) {
        console.error('Error fetching merchant assignments:', merchantError)
        throw merchantError
      }

      console.log('Found merchant assignments:', merchantAssignments)

      if (!merchantAssignments || merchantAssignments.length === 0) {
        console.log('No merchant assignments found for lead assigner')
        console.log('Trying alternative approach - checking cpv_forms directly...')
        
        // Fallback: Try to get forms that might be directly assigned
        const { data: directForms, error: directError } = await supabase
          .from('cpv_forms')
          .select(`
            id,
            name,
            initiative,
            current_status,
            created_at,
            updated_at,
            user_id
          `)
          .eq('assigned_lead_assigner_id', user.id)

        console.log('Direct form assignment results:', { directForms, directError })
        
        if (directForms && directForms.length > 0) {
          console.log('Found directly assigned forms:', directForms)
          // Process these forms without merchant assignment data
          const formsArray = directForms.map(form => ({
            id: form.id,
            name: form.name,
            initiative: form.initiative,
            current_status: form.current_status,
            created_at: form.created_at,
            updated_at: form.updated_at,
            assigned_by: form.user_id,
            assigned_by_username: 'Unknown',
            assigned_on: form.updated_at
          }))
          setAssignedForms(formsArray)
        } else {
          setAssignedForms([])
        }
        return
      }

      // Get unique form IDs
      const formIds = [...new Set(merchantAssignments.map(m => m.cpv_form_id))]
      console.log('Unique form IDs:', formIds)

      // Get CPV forms for these assignments
      const { data: formsData, error: formsError } = await supabase
        .from('cpv_forms')
        .select(`
          id,
          name,
          initiative,
          current_status,
          created_at,
          updated_at,
          user_id
        `)
        .in('id', formIds)

      if (formsError) {
        console.error('Error fetching CPV forms:', formsError)
        throw formsError
      }

      console.log('Found CPV forms:', formsData)

      if (!formsData || formsData.length === 0) {
        console.log('No CPV forms found for lead assigner')
        setAssignedForms([])
        return
      }

      // Get the first assignment date for each form from merchant status
      const assignedFormIds = formsData.map(form => form.id)
      const { data: merchantStatusData, error: statusError } = await supabase
        .from('cpv_merchant_status')
        .select('cpv_form_id, assigned_on, uploaded_by_user_id')
        .in('cpv_form_id', assignedFormIds)
        .eq('assigned_lead_assigner_id', user.id)
        .order('assigned_on', { ascending: true })

      if (statusError) {
        console.error('Error fetching merchant status:', statusError)
      }

      // Create a map of form assignments
      const assignmentMap = new Map()
      if (merchantStatusData) {
        merchantStatusData.forEach(status => {
          if (!assignmentMap.has(status.cpv_form_id)) {
            assignmentMap.set(status.cpv_form_id, {
              assigned_on: status.assigned_on,
              assigned_by: status.uploaded_by_user_id
            })
          }
        })
      }

      // Get usernames for the form creators (assigned_by users)
      const userIds = [...new Set(formsData.map(form => form.user_id))]
      const { data: userData, error: userError } = await supabase
        .from('user_roles')
        .select('user_id, username')
        .in('user_id', userIds)

      const userMap = new Map()
      if (!userError && userData) {
        userData.forEach(u => userMap.set(u.user_id, u.username))
      }

      // Combine the data
      const formsArray = formsData.map(form => {
        const assignment = assignmentMap.get(form.id)
        return {
          id: form.id,
          name: form.name,
          initiative: form.initiative,
          current_status: form.current_status,
          created_at: form.created_at,
          updated_at: form.updated_at,
          assigned_by: form.user_id,
          assigned_by_username: userMap.get(form.user_id) || 'Unknown',
          assigned_on: assignment?.assigned_on || form.updated_at
        }
      })

      console.log('Processed forms array:', formsArray)
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
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
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