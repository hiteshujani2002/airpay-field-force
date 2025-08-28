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
      const { data, error } = await supabase
        .from('cpv_merchant_status')
        .select(`
          *,
          cpv_forms:cpv_form_id (
            id,
            name,
            initiative,
            sections
          )
        `)
        .eq('assigned_cpv_agent_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
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
      toast({
        title: 'Generating PDF',
        description: 'Creating comprehensive PDF from completed form data...',
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CPV Verification Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Form details
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Form: ${lead.cpv_forms?.name || 'CPV Form'}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Initiative: ${lead.cpv_forms?.initiative || 'N/A'}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, yPosition);
      yPosition += 15;

      // Merchant info
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Merchant Information', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Name: ${lead.merchant_name}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Phone: ${lead.merchant_phone}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Address: ${lead.merchant_address}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`City: ${lead.city}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`State: ${lead.state}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Pincode: ${lead.pincode}`, 20, yPosition);
      yPosition += 15;

      // Verification details
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Verification Details', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Status: ${lead.verification_status.toUpperCase()}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Assigned Date: ${format(new Date(lead.cpv_agent_assigned_on), 'MMM dd, yyyy')}`, 20, yPosition);
      yPosition += 15;

      // Add form sections if available
      if (lead.cpv_forms?.sections && Array.isArray(lead.cpv_forms.sections) && lead.cpv_forms.sections.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Completed Form Data', 20, yPosition);
        yPosition += 10;

        lead.cpv_forms.sections.forEach((section: any) => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(section.name || 'Section', 20, yPosition);
          yPosition += 8;

          if (section.fields && Array.isArray(section.fields)) {
            section.fields.forEach((field: any) => {
              if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
              }

              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'normal');
              const fieldValue = field.value || field.defaultValue || 'Not provided';
              pdf.text(`${field.title || field.label}: ${fieldValue}`, 25, yPosition);
              yPosition += 6;
            });
          }
          yPosition += 5;
        });
      }

      // Add completion timestamp
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Report Information', 20, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Report Generated: ${format(new Date(), 'PPP')} at ${format(new Date(), 'p')}`, 20, yPosition);

      // Generate PDF blob and download
      const pdfBlob = pdf.output('blob');
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `CPV_Report_${lead.merchant_name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Comprehensive PDF report downloaded successfully!',
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
            <TableCell>Lead Assigner</TableCell>
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