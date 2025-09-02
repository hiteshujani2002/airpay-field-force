import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Camera, ArrowRight, ArrowLeft, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CPVLead {
  id: string;
  merchant_name: string;
  merchant_phone: string;
  merchant_address: string;
  city?: string;
  state?: string;
  pincode?: string;
  cpv_agent?: string;
  form_name?: string;
  initiative?: string;
  cpv_forms: {
    name: string;
    sections: any;
  };
}

interface CPVFormCompletionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: CPVLead;
  onComplete: () => void;
}

export const CPVFormCompletion = ({
  open,
  onOpenChange,
  lead,
  onComplete,
}: CPVFormCompletionProps) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({
    // Initialize with agent name from lead data
    agent_name: lead.cpv_agent || ''
  });
  const [visitDate, setVisitDate] = useState<Date>();
  const [visitTime, setVisitTime] = useState('');
  const [agentSignature, setAgentSignature] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define the three main sections
  const sections = [
    {
      id: 'personal',
      name: 'Personal Details',
      fields: (Array.isArray(lead.cpv_forms?.sections) ? lead.cpv_forms.sections[0]?.fields : null) || [
        { id: 'person_name', title: 'Person Name', type: 'text', mandatory: true },
        { id: 'contact_number', title: 'Contact Number', type: 'text', mandatory: true },
        { id: 'designation', title: 'Designation', type: 'text', mandatory: true },
        { id: 'person_photo', title: 'Person Photo', type: 'image', mandatory: true },
      ]
    },
    {
      id: 'business',
      name: 'Business Details',
      fields: (Array.isArray(lead.cpv_forms?.sections) ? lead.cpv_forms.sections[1]?.fields : null) || [
        { id: 'business_name', title: 'Name of Business', type: 'text', mandatory: true },
        { id: 'office_address', title: 'Office Address', type: 'text', mandatory: true },
        { id: 'office_pincode', title: 'Pincode', type: 'number', mandatory: true },
        { id: 'office_ownership', title: 'Office Ownership', type: 'dropdown', mandatory: true, options: ['Rented', 'Owned'] },
        { id: 'years_in_business', title: 'Number of years in present business', type: 'number', mandatory: true },
        { id: 'years_in_office', title: 'Number of years in the present office', type: 'number', mandatory: true },
        { id: 'business_photo', title: 'Business Photo', type: 'image', mandatory: true },
        { id: 'office_photo', title: 'Office Photo', type: 'image', mandatory: true },
      ]
    },
    {
      id: 'agent',
      name: 'CPV Agent Details',
      fields: [
        { id: 'visit_date', title: 'Visit Date', type: 'date', mandatory: true },
        { id: 'visit_time', title: 'Visit Time', type: 'time', mandatory: true },
        { id: 'agent_name', title: 'Agent Name', type: 'text', mandatory: true, value: lead.cpv_agent || '' },
        { id: 'agent_signature', title: 'Agent Signature', type: 'file', mandatory: true },
      ]
    }
  ];

  const totalSections = sections.length;
  const progress = ((currentSection + 1) / totalSections) * 100;

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleImageUpload = async (fieldId: string, file: File) => {
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${fieldId}_${lead.id}_${Date.now()}.${fileExt}`;
      const filePath = `cpv-images/${fileName}`;

      const { data, error } = await supabase.storage
        .from('cpv-pdfs')  // Using existing bucket
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        toast({
          title: 'Upload failed',
          description: 'Failed to upload image. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('cpv-pdfs')
        .getPublicUrl(filePath);

      // Store both file info and URL
      handleFieldChange(fieldId, {
        fileName: file.name,
        filePath: filePath,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size
      });

      toast({
        title: 'Upload successful',
        description: 'Image uploaded successfully',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const renderField = (field: any) => {
    // Use field.value as default for agent_name, otherwise use formData
    const value = field.id === 'agent_name' ? (formData[field.id] || field.value || '') : (formData[field.id] || '');

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.title} {field.mandatory && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={`Enter ${field.title.toLowerCase()}`}
            />
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.title} {field.mandatory && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.id}
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={`Enter ${field.title.toLowerCase()}`}
            />
          </div>
        );

      case 'dropdown':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.title} {field.mandatory && <span className="text-destructive">*</span>}
            </Label>
            <Select value={value} onValueChange={(value) => handleFieldChange(field.id, value)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.title.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'file':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.title} {field.mandatory && <span className="text-destructive">*</span>}
            </Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <Input
                id={field.id}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && field.id === 'agent_signature') {
                    setAgentSignature(file);
                    // Also upload to storage
                    handleImageUpload(field.id, file);
                  } else if (file) {
                    handleImageUpload(field.id, file);
                  }
                }}
                className="hidden"
              />
              <Label htmlFor={field.id} className="cursor-pointer">
                <span className="text-sm text-muted-foreground">
                  {(field.id === 'agent_signature' && agentSignature) ? 
                    `Uploaded: ${agentSignature.name}` : 
                    (formData[field.id] && typeof formData[field.id] === 'object' && formData[field.id].fileName) ?
                    `Uploaded: ${formData[field.id].fileName}` :
                    formData[field.id] ? `Uploaded: ${formData[field.id]}` : 'Click to upload file'}
                </span>
              </Label>
            </div>
          </div>
        );

      case 'image':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.title} {field.mandatory && <span className="text-destructive">*</span>}
            </Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <Input
                id={field.id}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(field.id, file);
                }}
                className="hidden"
              />
              <Label htmlFor={field.id} className="cursor-pointer">
                <span className="text-sm text-muted-foreground">
                  {(formData[field.id] && typeof formData[field.id] === 'object' && formData[field.id].fileName) ?
                    `Uploaded: ${formData[field.id].fileName}` :
                    formData[field.id] ? `Uploaded: ${formData[field.id]}` : 'Click to upload image'}
                </span>
              </Label>
            </div>
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.title} {field.mandatory && <span className="text-destructive">*</span>}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !visitDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {visitDate ? format(visitDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={visitDate}
                  onSelect={(date) => {
                    setVisitDate(date);
                    handleFieldChange(field.id, date?.toISOString() || '');
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        );

      case 'time':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.title} {field.mandatory && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.id}
              type="time"
              value={visitTime}
              onChange={(e) => {
                setVisitTime(e.target.value);
                handleFieldChange(field.id, e.target.value);
              }}
            />
          </div>
        );

      case 'signature':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.title} {field.mandatory && <span className="text-destructive">*</span>}
            </Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <Input
                id={field.id}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setAgentSignature(file);
                    handleFieldChange(field.id, file.name);
                  }
                }}
                className="hidden"
              />
              <Label htmlFor={field.id} className="cursor-pointer">
                <span className="text-sm text-muted-foreground">
                  {agentSignature ? `Uploaded: ${agentSignature.name}` : 'Click to upload signature'}
                </span>
              </Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleNext = () => {
    if (currentSection < totalSections - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const generatePDF = async () => {
    try {
      // Import the standardized PDF generator
      const { generateStandardizedCPVPDF } = await import('@/lib/pdfGenerator');
      
      // Prepare merchant info
      const merchantInfo = {
        id: lead.id,
        merchant_name: lead.merchant_name,
        merchant_phone: lead.merchant_phone,
        merchant_address: lead.merchant_address,
        city: lead.city || '',
        state: lead.state || '',
        pincode: lead.pincode || '',
        verification_status: 'verified',
        cpv_agent_name: lead.cpv_agent || 'Current Agent'
      };

      // Prepare form data
      const formDataForPDF = {
        sections: sections,
        name: lead.form_name || 'CPV Form',
        initiative: lead.initiative || 'Standard Initiative'
      };

      // Prepare completed form data with all captured values
      const completedFormData = {
        ...formData,
        visit_date: visitDate,
        visit_time: visitTime,
        agent_signature: agentSignature
      };

      return await generateStandardizedCPVPDF(merchantInfo, formDataForPDF, completedFormData);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Ensure all form fields have values - compile complete form data
      const allFormFields: Record<string, any> = {};
      
      // Collect all field values from all sections
      sections.forEach(section => {
        if (Array.isArray(section.fields)) {
          section.fields.forEach(field => {
            // Use existing form data or field default values
            if (formData[field.id] !== undefined && formData[field.id] !== null && formData[field.id] !== '') {
              allFormFields[field.id] = formData[field.id];
            } else if (field.value !== undefined && field.value !== null && field.value !== '') {
              allFormFields[field.id] = field.value;
            }
          });
        }
      });
      
      // Add special fields that might not be in the form structure
      if (visitDate) allFormFields['visit_date'] = visitDate.toISOString();
      if (visitTime) allFormFields['visit_time'] = visitTime;
      if (agentSignature) {
        // Upload agent signature first
        try {
          const fileExt = agentSignature.name.split('.').pop();
          const fileName = `agent_signature_${lead.id}_${Date.now()}.${fileExt}`;
          const filePath = `cpv-images/${fileName}`;

          const { data, error } = await supabase.storage
            .from('cpv-pdfs')
            .upload(filePath, agentSignature, {
              cacheControl: '3600',
              upsert: false
            });

          if (!error) {
            const { data: urlData } = supabase.storage
              .from('cpv-pdfs')
              .getPublicUrl(filePath);

            allFormFields['agent_signature'] = {
              name: agentSignature.name,
              fileName: agentSignature.name,
              url: urlData.publicUrl,
              type: agentSignature.type,
              size: agentSignature.size
            };
          } else {
            console.error('Agent signature upload error:', error);
            allFormFields['agent_signature'] = {
              name: agentSignature.name,
              fileName: agentSignature.name,
              type: agentSignature.type,
              size: agentSignature.size
            };
          }
        } catch (uploadError) {
          console.error('Error uploading agent signature:', uploadError);
          allFormFields['agent_signature'] = {
            name: agentSignature.name,
            fileName: agentSignature.name,
            type: agentSignature.type,
            size: agentSignature.size
          };
        }
      }
      if (lead.cpv_agent) allFormFields['agent_name'] = lead.cpv_agent;
      
      // Prepare completed form data with all captured values including all form fields
      const completedFormData = {
        ...allFormFields, // Start with all form fields
        ...formData, // Override with any explicitly set form data
        visit_date: visitDate?.toISOString() || null,
        visit_time: visitTime,
        agent_signature: allFormFields['agent_signature'] || null,
        form_sections: sections, // Store the complete form structure
        merchant_info: {
          id: lead.id,
          merchant_name: lead.merchant_name,
          merchant_phone: lead.merchant_phone,
          merchant_address: lead.merchant_address,
          city: lead.city,
          state: lead.state,
          pincode: lead.pincode
        },
        completion_timestamp: new Date().toISOString(),
        cpv_agent_name: lead.cpv_agent || formData.agent_name
      };
      
      console.log('Completed form data being stored:', completedFormData); // Debug log
      
      // Generate standardized PDF
      const pdfBlob = await generatePDF();
      
      // Generate unique filename for storage
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const storageFileName = `cpv-report-${lead.id}-${timestamp}.pdf`;
      
      // Upload PDF to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cpv-pdfs')
        .upload(storageFileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        console.error('PDF upload error:', uploadError);
        throw new Error('Failed to store PDF report');
      }

      // Get the public URL for the uploaded PDF
      const { data: urlData } = supabase.storage
        .from('cpv-pdfs')
        .getPublicUrl(storageFileName);

      // Import download utility and download for immediate user access
      const { downloadPDF } = await import('@/lib/pdfGenerator');
      const filename = `CPV_Report_${lead.merchant_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      downloadPDF(pdfBlob, filename);

      // Update the merchant status with all data including the PDF URL
      const { error } = await supabase
        .from('cpv_merchant_status')
        .update({ 
          verification_status: 'verified',
          completed_form_data: completedFormData,
          verification_pdf_url: urlData.publicUrl
        })
        .eq('id', lead.id);

      if (error) throw error;

      toast({
        title: 'CPV Completed',
        description: 'Verification report has been generated and downloaded successfully',
      });

      onComplete();
    } catch (error) {
      console.error('Error completing CPV form:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete CPV form. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSectionData = sections[currentSection];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>CPV Form Completion - {lead.merchant_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Section {currentSection + 1} of {totalSections}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {sections.map((section, index) => (
                <span 
                  key={section.id}
                  className={cn(
                    "px-2 py-1 rounded",
                    index === currentSection ? "bg-primary text-primary-foreground" : "",
                    index < currentSection ? "text-green-600" : ""
                  )}
                >
                  {section.name}
                </span>
              ))}
            </div>
          </div>

          {/* Current Section Form */}
          <Card>
            <CardHeader>
              <CardTitle>{currentSectionData.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentSectionData.fields.map(renderField)}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentSection === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentSection === totalSections - 1 ? (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Generating PDF...' : 'Complete CPV Form'}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};