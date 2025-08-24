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
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CPVLead {
  id: string;
  merchant_name: string;
  merchant_phone: string;
  merchant_address: string;
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
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CPV Form Completion Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Merchant info
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Merchant Name: ${lead.merchant_name}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Phone: ${lead.merchant_phone}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Address: ${lead.merchant_address}`, 20, yPosition);
      yPosition += 15;

      // Form sections
      sections.forEach((section) => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(section.name, 20, yPosition);
        yPosition += 10;

        section.fields.forEach((field) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }

          let value = formData[field.id] || '';
          
          // Handle special cases
          if (field.id === 'visit_date' && visitDate) {
            value = format(visitDate, 'PPP');
          } else if (field.id === 'visit_time' && visitTime) {
            value = visitTime;
          } else if (field.id === 'agent_signature' && agentSignature) {
            value = agentSignature.name;
          }

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`${field.title}: ${value || 'Not provided'}`, 25, yPosition);
          yPosition += 6;
        });

        yPosition += 5;
      });

      // Add completion info
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Completion Information', 20, yPosition);
      yPosition += 10;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Completed on: ${new Date().toLocaleDateString()}`, 25, yPosition);
      yPosition += 6;
      pdf.text(`Completed at: ${new Date().toLocaleTimeString()}`, 25, yPosition);

      return pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      toast.loading('Generating CPV report...');
      
      // Generate PDF
      const pdfBlob = await generatePDF();
      
      // Here you would upload the PDF to storage and get the URL
      // For now, we'll simulate this
      const pdfUrl = `cpv-reports/${lead.id}-${Date.now()}.pdf`;
      
      // Update the merchant status with PDF URL and completion status
      const { error } = await supabase
        .from('cpv_merchant_status')
        .update({ 
          verification_status: 'completed',
          verification_pdf_url: pdfUrl 
        })
        .eq('id', lead.id);

      if (error) throw error;

      toast.success('CPV form completed and PDF generated successfully!');
      onComplete();
    } catch (error) {
      console.error('Error completing CPV form:', error);
      toast.error('Failed to complete CPV form. Please try again.');
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