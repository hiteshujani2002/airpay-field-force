import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, ArrowLeft, Clock, CheckCircle, XCircle, FileText, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PreliminaryQuestionsDialog } from './PreliminaryQuestionsDialog';
import { CPVFormCompletion } from './CPVFormCompletion';
import { CPVFormPreview } from './CPVFormPreview';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface CPVLead {
  id: string;
  cpv_form_id: string;
  merchant_name: string;
  merchant_phone: string;
  merchant_address: string;
  city: string;
  state: string;
  pincode: string;
  verification_status: string;
  cpv_agent_assigned_on: string;
  verification_pdf_url?: string;
  cpv_agent?: string;
  sections?: any;
  form_preview_data?: any;
  form_name?: string;
  initiative?: string;
  form_status?: string;
  lead_assigner_name?: string;
  assigned_lead_assigner_id?: string;
  cpv_forms: {
    id: string;
    name: string;
    initiative: string;
    sections: any;
  };
}

export const CPVAgentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [leads, setLeads] = useState<CPVLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreliminaryDialog, setShowPreliminaryDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<CPVLead | null>(null);
  const [showCPVForm, setShowCPVForm] = useState(false);
  const [showFormPreview, setShowFormPreview] = useState(false);

  useEffect(() => {
    loadLeads();
  }, [user]);

  const loadLeads = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // First get the merchant status data
      const { data: merchantData, error: merchantError } = await supabase
        .from('cpv_merchant_status')
        .select('*')
        .eq('assigned_cpv_agent_id', user.id)
        .order('created_at', { ascending: false });

      if (merchantError) throw merchantError;

      if (!merchantData || merchantData.length === 0) {
        setLeads([]);
        setLoading(false);
        return;
      }

      // Get unique form IDs
      const formIds = [...new Set(merchantData.map(m => m.cpv_form_id))];

      // Get the corresponding CPV forms with status
      const { data: formsData, error: formsError } = await supabase
        .from('cpv_forms')
        .select('id, name, initiative, sections, current_status')
        .in('id', formIds);

      if (formsError) throw formsError;

      // Create a map of forms for easy lookup
      const formsMap = new Map(formsData?.map(form => [form.id, form]) || []);

      // Combine merchant data with form data and check form status
      const data = merchantData.map(merchant => ({
        ...merchant,
        cpv_forms: formsMap.get(merchant.cpv_form_id) || null,
        sections: formsMap.get(merchant.cpv_form_id)?.sections,
        form_name: formsMap.get(merchant.cpv_form_id)?.name,
        initiative: formsMap.get(merchant.cpv_form_id)?.initiative,
        form_status: formsMap.get(merchant.cpv_form_id)?.current_status
      }));

      // Get lead assigner usernames for assigned leads
      const leadAssignerIds = [...new Set(data?.filter(lead => lead.assigned_lead_assigner_id).map(lead => lead.assigned_lead_assigner_id))].filter(Boolean);
      
      console.log('Data with assigned_lead_assigner_id:', data?.map(d => ({ id: d.id, assigned_lead_assigner_id: d.assigned_lead_assigner_id })));
      console.log('Collected leadAssignerIds:', leadAssignerIds);
      
      let leadAssignerMap = new Map();
      if (leadAssignerIds.length > 0) {
        const { data: leadAssignerData, error: leadAssignerError } = await supabase
          .from('user_roles')
          .select('user_id, username')
          .in('user_id', leadAssignerIds);

        console.log('Lead assigner query result:', leadAssignerData, leadAssignerError);
        
        if (!leadAssignerError && leadAssignerData) {
          leadAssignerMap = new Map(leadAssignerData.map(la => [la.user_id, la.username]));
          console.log('Final leadAssignerMap:', leadAssignerMap);
        }
      }

      // Add lead assigner names to leads data
      const leadsWithAssignerNames = data?.map(lead => {
        const assignerName = lead.assigned_lead_assigner_id ? 
          (leadAssignerMap.get(lead.assigned_lead_assigner_id) || 'Unknown') : 
          'Unassigned';
        console.log(`Lead ${lead.id}: assigned_lead_assigner_id=${lead.assigned_lead_assigner_id}, assignerName=${assignerName}`);
        return {
          ...lead,
          lead_assigner_name: assignerName
        };
      }) || [];

      setLeads(leadsWithAssignerNames);
    } catch (error: any) {
      console.error('Error loading leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leads',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteCPV = (lead: CPVLead) => {
    setSelectedLead(lead);
    setShowPreliminaryDialog(true);
  };

  const handlePreliminaryAnswers = (addressCorrect: boolean, merchantPresent: boolean) => {
    if (!addressCorrect || !merchantPresent) {
      // Reject the lead
      updateLeadStatus('rejected');
    } else {
      // Proceed to CPV form
      setShowPreliminaryDialog(false);
      setShowCPVForm(true);
    }
  };

  const updateLeadStatus = async (status: string) => {
    if (!selectedLead) return;

    try {
      const { error } = await supabase
        .from('cpv_merchant_status')
        .update({ verification_status: status })
        .eq('id', selectedLead.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Lead ${status === 'rejected' ? 'rejected' : 'completed'} successfully`,
      });

      setShowPreliminaryDialog(false);
      setSelectedLead(null);
      loadLeads();
    } catch (error: any) {
      console.error('Error updating lead status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lead status',
        variant: 'destructive',
      });
    }
  };

  const handleFormComplete = () => {
    updateLeadStatus('verified');
    setShowCPVForm(false);
    setSelectedLead(null);
  };

  const handleViewForm = (lead: CPVLead) => {
    setSelectedLead(lead);
    setShowFormPreview(true);
  };

  const generateAndDownloadPDF = async (lead: CPVLead) => {
    try {
      // First, check if there's already a stored PDF URL (consistent with other roles)
      if (lead.verification_pdf_url) {
        // Download directly from the stored URL
        const response = await fetch(lead.verification_pdf_url);
        if (response.ok) {
          const blob = await response.blob();
          const { downloadPDF } = await import('@/lib/pdfGenerator');
          downloadPDF(blob, `CPV_Report_${lead.merchant_name}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
          
          toast({
            title: 'Success',
            description: 'CPV report downloaded successfully',
          });
          return;
        }
      }

      // Fallback: Generate PDF from database data if no stored URL or fetch failed
      toast({
        title: 'Generating PDF',
        description: 'Creating comprehensive PDF from completed form data...',
      });

      // Fetch the CPV form structure and completed form data from database
      const [formResult, merchantResult] = await Promise.all([
        supabase
          .from('cpv_forms')
          .select('name, initiative, sections, form_preview_data')
          .eq('id', lead.cpv_form_id)
          .single(),
        supabase
          .from('cpv_merchant_status')
          .select('completed_form_data, verification_pdf_url')
          .eq('id', lead.id)
          .single()
      ]);

      if (formResult.error || !formResult.data) {
        toast({
          title: 'Error',
          description: 'Failed to fetch form data',
          variant: 'destructive',
        });
        return;
      }

      if (merchantResult.error || !merchantResult.data) {
        toast({
          title: 'Error', 
          description: 'Failed to fetch completed form data',
          variant: 'destructive',
        });
        return;
      }

      // Import the standardized PDF generator
      const { generateStandardizedCPVPDF, downloadPDF } = await import('@/lib/pdfGenerator');
      
      // Prepare merchant info
      const merchantInfo = {
        id: lead.id,
        merchant_name: lead.merchant_name,
        merchant_phone: lead.merchant_phone,
        merchant_address: lead.merchant_address,
        city: lead.city || '',
        state: lead.state || '',
        pincode: lead.pincode || '',
        verification_status: lead.verification_status,
        cpv_agent_name: lead.cpv_agent,
        cpv_agent_assigned_on: lead.cpv_agent_assigned_on
      };

      // Prepare form data using actual database data
      const formDataForPDF = {
        sections: formResult.data.sections || [],
        form_preview_data: formResult.data.form_preview_data,
        name: formResult.data.name || 'CPV Form',
        initiative: formResult.data.initiative || 'Standard Initiative'
      };

      // Get completed form data
      const completedFormData = merchantResult.data.completed_form_data as any;
      
      // Convert visit_date back to Date object if it's a string  
      if (completedFormData && typeof completedFormData === 'object' && completedFormData.visit_date && typeof completedFormData.visit_date === 'string') {
        completedFormData.visit_date = new Date(completedFormData.visit_date);
      }

      // Use the standardized PDF generator with completed data
      const pdfBlob = await generateStandardizedCPVPDF(merchantInfo, formDataForPDF, completedFormData);
      
      // Generate filename
      const filename = `CPV_Report_${lead.merchant_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Download the PDF
      downloadPDF(pdfBlob, filename);

      toast({
        title: 'Success',
        description: 'CPV report downloaded successfully',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Filter leads by status - include both 'pending' and 'assigned' leads in pending section
  const pendingLeads = leads.filter(lead => 
    lead.verification_status === 'pending' || lead.verification_status === 'assigned'
  );
  const completedLeads = leads.filter(lead => lead.verification_status === 'verified');
  const rejectedLeads = leads.filter(lead => lead.verification_status === 'rejected');

  const renderLeadTable = (leadsToShow: CPVLead[], showActions = false, showPDF = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Unique ID</TableHead>
          <TableHead>CPV Form</TableHead>
          <TableHead>Merchant Name</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>State</TableHead>
          <TableHead>Pincode</TableHead>
          <TableHead>Lead Assigner</TableHead>
          <TableHead>View Form</TableHead>
          {showPDF && <TableHead>Digital Copy</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {leadsToShow.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell className="font-mono text-sm">{lead.id.slice(0, 8)}</TableCell>
            <TableCell>{lead.cpv_forms?.name}</TableCell>
            <TableCell className="font-medium">{lead.merchant_name}</TableCell>
            <TableCell>{`${lead.merchant_address}, ${lead.city}`}</TableCell>
            <TableCell>{lead.state}</TableCell>
            <TableCell>{lead.pincode}</TableCell>
            <TableCell>{lead.lead_assigner_name}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewForm(lead)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                 {showActions && (
                   <Button
                     variant="default"
                     size="sm"
                     onClick={() => handleCompleteCPV(lead)}
                     disabled={lead.form_status?.toLowerCase() === 'inactive'}
                     style={{
                       opacity: lead.form_status?.toLowerCase() === 'inactive' ? 0.5 : 1,
                       cursor: lead.form_status?.toLowerCase() === 'inactive' ? 'not-allowed' : 'pointer'
                     }}
                     title={lead.form_status?.toLowerCase() === 'inactive' ? 'Cannot complete CPV for inactive forms' : ''}
                   >
                     <FileText className="h-4 w-4 mr-1" />
                     Complete CPV
                   </Button>
                 )}
              </div>
            </TableCell>
            {showPDF && (
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateAndDownloadPDF(lead)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <FileDown className="h-4 w-4 mr-1" />
                  Download PDF
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
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
          <h1 className="text-3xl font-bold tracking-tight">CPV Agent Dashboard</h1>
          <p className="text-muted-foreground">Complete contact point verification for assigned merchants</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead Management</CardTitle>
          <CardDescription>
            Manage merchant leads assigned to you for contact point verification
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
              {pendingLeads.length === 0 ? (
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
                  <p>You haven't completed any leads yet.</p>
                </div>
              ) : (
                renderLeadTable(completedLeads, false, true)
              )}
            </TabsContent>
            
            <TabsContent value="rejected" className="mt-6">
              {rejectedLeads.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                  <h3 className="text-lg font-medium mb-2">No Rejected Leads</h3>
                  <p>You haven't rejected any leads.</p>
                </div>
              ) : (
                renderLeadTable(rejectedLeads, false, true)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preliminary Questions Dialog */}
      <PreliminaryQuestionsDialog
        open={showPreliminaryDialog}
        onOpenChange={setShowPreliminaryDialog}
        onSubmit={handlePreliminaryAnswers}
        merchantName={selectedLead?.merchant_name || ''}
      />

      {/* CPV Form Completion Dialog */}
      {selectedLead && (
        <CPVFormCompletion
          open={showCPVForm}
          onOpenChange={setShowCPVForm}
          lead={selectedLead}
          onComplete={handleFormComplete}
        />
      )}

      {/* Form Preview Dialog */}
      {selectedLead && (
        <CPVFormPreview
          open={showFormPreview}
          onOpenChange={setShowFormPreview}
          lead={selectedLead}
        />
      )}
    </div>
  );
};