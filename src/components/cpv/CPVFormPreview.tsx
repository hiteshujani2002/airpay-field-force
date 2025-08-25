import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Camera, FileText } from 'lucide-react';

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

interface CPVFormPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: CPVLead;
}

export const CPVFormPreview = ({
  open,
  onOpenChange,
  lead,
}: CPVFormPreviewProps) => {
  // Define the three main sections (read-only version)
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

  const renderReadOnlyField = (field: any) => {
    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.title} {field.mandatory && <span className="text-destructive">*</span>}
            </Label>
            <Input
              value=""
              placeholder={`${field.title} (to be filled by agent)`}
              disabled
              className="bg-muted"
            />
          </div>
        );

      case 'dropdown':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.title} {field.mandatory && <span className="text-destructive">*</span>}
            </Label>
            <Select disabled>
              <SelectTrigger className="bg-muted">
                <SelectValue placeholder={`Select ${field.title.toLowerCase()} (to be filled by agent)`} />
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
            <Label>
              {field.title} {field.mandatory && <span className="text-destructive">*</span>}
            </Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center bg-muted">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {field.title} (to be uploaded by agent)
              </span>
            </div>
          </div>
        );

      case 'image':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.title} {field.mandatory && <span className="text-destructive">*</span>}
            </Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center bg-muted">
              <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {field.title} (to be uploaded by agent)
              </span>
            </div>
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.title} {field.mandatory && <span className="text-destructive">*</span>}
            </Label>
            <Button
              variant="outline"
              disabled
              className="w-full justify-start text-left font-normal bg-muted text-muted-foreground"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>Date to be selected by agent</span>
            </Button>
          </div>
        );

      case 'time':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.title} {field.mandatory && <span className="text-destructive">*</span>}
            </Label>
            <Input
              type="time"
              disabled
              placeholder="Time to be filled by agent"
              className="bg-muted"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Form Preview - {lead.cpv_forms?.name || 'CPV Form'}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            This is a read-only preview of the form that was assigned to the CPV agent for merchant: {lead.merchant_name}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Merchant Information */}
          <Card>
            <CardHeader>
              <CardTitle>Merchant Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Merchant Name</Label>
                  <Input value={lead.merchant_name} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>Merchant Phone</Label>
                  <Input value={lead.merchant_phone} disabled className="bg-muted" />
                </div>
              </div>
              <div>
                <Label>Merchant Address</Label>
                <Input value={lead.merchant_address} disabled className="bg-muted" />
              </div>
            </CardContent>
          </Card>

          {/* Form Sections */}
          {sections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.fields.map(renderReadOnlyField)}
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This is a preview of the form structure. The CPV agent will fill in all the required fields and upload necessary documents when completing the verification.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};