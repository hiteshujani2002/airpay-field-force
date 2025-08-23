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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Camera, ArrowRight, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const [agentName, setAgentName] = useState('');
  const [agentSignature, setAgentSignature] = useState('');

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
        { id: 'office_pincode', title: 'Pincode', type: 'text', mandatory: true },
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
        { id: 'agent_signature', title: 'Agent Signature', type: 'signature', mandatory: true },
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
            <Textarea
              id={field.id}
              value={agentSignature}
              onChange={(e) => setAgentSignature(e.target.value)}
              placeholder="Type your signature or full name"
              rows={3}
            />
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

  const handleSubmit = () => {
    // Here you would save the form data to the database
    onComplete();
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
              
              {/* Special handling for agent details section */}
              {currentSection === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="agent_name">
                      Agent Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="agent_name"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="Enter agent name"
                    />
                  </div>
                </div>
              )}
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
              <Button onClick={handleSubmit}>
                Complete CPV Form
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