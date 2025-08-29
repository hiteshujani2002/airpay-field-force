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
  const [formData, setFormData] = useState<Record<string, any>>({});
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
        { id: 'agent_name', title: 'Agent Name', type: 'text', mandatory: true },
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

  const handleImageUpload = (fieldId: string, file: File) => {
    // In a real implementation, you would upload the file to storage
    // For now, we'll just store the file name
    handleFieldChange(fieldId, file.name);
  };

  const renderField = (field: any) => {
    const value = formData[field.id] || '';

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
                    handleFieldChange(field.id, file.name);
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
                    value ? `Uploaded: ${value}` : 'Click to upload file'}
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
                  {value ? `Uploaded: ${value}` : 'Click to upload image'}
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
                  onSelect={setVisitDate}
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
              onChange={(e) => setVisitTime(e.target.value)}
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
      
      // Generate standardized PDF
      const pdfBlob = await generatePDF();
      
      // Import download utility
      const { downloadPDF } = await import('@/lib/pdfGenerator');
      
      // Generate filename
      const filename = `CPV_Report_${lead.merchant_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Download the PDF
      downloadPDF(pdfBlob, filename);

      // Update the merchant status to verified
      const { error } = await supabase
        .from('cpv_merchant_status')
        .update({ 
          verification_status: 'verified'
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