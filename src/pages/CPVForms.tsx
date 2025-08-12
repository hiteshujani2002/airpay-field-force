import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Eye, EyeOff, X, Upload, Trash2, Edit, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { InitiativeSelector } from "@/components/cpv/InitiativeSelector";
import { FieldEditor } from "@/components/cpv/FieldEditor";
import { ImagePlaceholder } from "@/components/cpv/ImagePlaceholder";

interface CustomField {
  id: string;
  title: string;
  dataType: "alphabets" | "numbers" | "alphanumeric";
  mandatory: boolean;
  visible: boolean;
  type: "text" | "image";
  numberOfClicks?: number;
  documentName?: string;
}

interface FormSection {
  id: string;
  name: string;
  fields: CustomField[];
}

interface CPVForm {
  id: string;
  name: string;
  initiative: string;
  sections: FormSection[];
  createdAt: string;
}

const CPVForms = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  
  // Main state
  const [currentView, setCurrentView] = useState<"dashboard" | "create" | "preview" | "edit">("dashboard");
  const [currentStep, setCurrentStep] = useState(1);
  const [forms, setForms] = useState<CPVForm[]>([]);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form creation state
  const [selectedInitiative, setSelectedInitiative] = useState("");
  const [customSections, setCustomSections] = useState<FormSection[]>([]);
  const [currentSection, setCurrentSection] = useState<"personal" | "business" | "custom" | "agent">("personal");
  const [currentCustomSectionId, setCurrentCustomSectionId] = useState<string | null>(null);
  
  // Field management with section-specific images
  const [personalFields, setPersonalFields] = useState<CustomField[]>([
    { id: "1", title: "Person Name", dataType: "alphabets", mandatory: true, visible: true, type: "text" },
    { id: "2", title: "Contact Number", dataType: "numbers", mandatory: true, visible: true, type: "text" },
    { id: "3", title: "Designation", dataType: "alphabets", mandatory: false, visible: true, type: "text" },
    { id: "4", title: "Personal Address", dataType: "alphanumeric", mandatory: true, visible: true, type: "text" },
  ]);
  
  const [businessFields, setBusinessFields] = useState<CustomField[]>([
    { id: "1", title: "Name of Business", dataType: "alphabets", mandatory: true, visible: true, type: "text" },
    { id: "2", title: "Office Address", dataType: "alphanumeric", mandatory: true, visible: true, type: "text" },
    { id: "3", title: "Pincode", dataType: "numbers", mandatory: true, visible: true, type: "text" },
    { id: "4", title: "Nearby Landmark", dataType: "alphanumeric", mandatory: false, visible: true, type: "text" },
    { id: "5", title: "Address Confirmed", dataType: "alphabets", mandatory: true, visible: true, type: "text" },
    { id: "6", title: "Nature of Business", dataType: "alphabets", mandatory: true, visible: true, type: "text" },
    { id: "7", title: "Type of business", dataType: "alphabets", mandatory: true, visible: true, type: "text" },
    { id: "8", title: "Office Ownership", dataType: "alphabets", mandatory: true, visible: true, type: "text" },
    { id: "9", title: "Number of years in present business", dataType: "numbers", mandatory: false, visible: true, type: "text" },
    { id: "10", title: "Number of years in the present office", dataType: "numbers", mandatory: false, visible: true, type: "text" },
  ]);

  const [agentFields] = useState<CustomField[]>([
    { id: "1", title: "Visit Date", dataType: "alphanumeric", mandatory: true, visible: true, type: "text" },
    { id: "2", title: "Visit Time", dataType: "alphanumeric", mandatory: true, visible: true, type: "text" },
    { id: "3", title: "Employee Name", dataType: "alphabets", mandatory: true, visible: true, type: "text" },
    { id: "4", title: "Employee Code", dataType: "alphanumeric", mandatory: true, visible: true, type: "text" },
    { id: "5", title: "Employee Signature", dataType: "alphabets", mandatory: true, visible: true, type: "text" },
  ]);

  // Dialog states
  const [showAddQuestionDialog, setShowAddQuestionDialog] = useState(false);
  const [showCreateImageDialog, setShowCreateImageDialog] = useState(false);
  const [showAdditionalSectionDialog, setShowAdditionalSectionDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showBackToDashboardDialog, setShowBackToDashboardDialog] = useState(false);
  
  // Form data
  const [newQuestion, setNewQuestion] = useState({ title: "", dataType: "alphabets", mandatory: false });
  const [newImageField, setNewImageField] = useState({ documentName: "", mandatory: false, numberOfClicks: 1 });
  const [newSectionName, setNewSectionName] = useState("");

  // Load forms from Supabase on component mount
  useEffect(() => {
    if (currentView === 'dashboard') {
      loadForms();
    }
  }, [currentView]);

  const loadForms = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cpv_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedForms: CPVForm[] = data.map(form => ({
        id: form.id,
        name: form.name,
        initiative: form.initiative,
        sections: (form.sections as unknown) as FormSection[],
        createdAt: new Date(form.created_at).toLocaleDateString()
      }));
      
      setForms(transformedForms);
    } catch (error: any) {
      console.error('Error loading forms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load CPV forms',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getCurrentFields = () => {
    switch (currentSection) {
      case "personal": return personalFields;
      case "business": return businessFields;
      case "agent": return agentFields;
      case "custom": 
        const section = customSections.find(s => s.id === currentCustomSectionId);
        return section ? section.fields : [];
      default: return [];
    }
  };

  const setCurrentFields = (fields: CustomField[]) => {
    switch (currentSection) {
      case "personal": setPersonalFields(fields); break;
      case "business": setBusinessFields(fields); break;
      case "agent": break; // Agent fields are read-only
      case "custom":
        setCustomSections(sections => 
          sections.map(s => 
            s.id === currentCustomSectionId ? { ...s, fields } : s
          )
        );
        break;
    }
  };

  const updateField = (updatedField: CustomField) => {
    const currentFields = getCurrentFields();
    const updatedFields = currentFields.map(field => 
      field.id === updatedField.id ? updatedField : field
    );
    setCurrentFields(updatedFields);
  };

  const goBack = () => {
    if (currentStep === 1) {
      setShowBackToDashboardDialog(true);
    } else if (currentStep === 6) {
      // Go back from preview based on whether custom sections exist
      if (customSections.length > 0) {
        setCurrentSection("custom");
        setCurrentCustomSectionId(customSections[customSections.length - 1].id);
        setCurrentStep(4);
      } else {
        setCurrentSection("agent");
        setCurrentStep(5);
      }
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBackToDashboard = () => {
    setShowBackToDashboardDialog(false);
    setCurrentView("dashboard");
    resetForm();
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      title: newQuestion.title,
      dataType: newQuestion.dataType as "alphabets" | "numbers" | "alphanumeric",
      mandatory: newQuestion.mandatory,
      visible: true,
      type: "text"
    };
    
    const currentFields = getCurrentFields();
    setCurrentFields([...currentFields, newField]);
    setNewQuestion({ title: "", dataType: "alphabets", mandatory: false });
    setShowAddQuestionDialog(false);
  };

  const addImageField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      title: newImageField.documentName,
      dataType: "alphanumeric",
      mandatory: newImageField.mandatory,
      visible: true,
      type: "image",
      documentName: newImageField.documentName,
      numberOfClicks: newImageField.numberOfClicks
    };
    
    const currentFields = getCurrentFields();
    setCurrentFields([...currentFields, newField]);
    setNewImageField({ documentName: "", mandatory: false, numberOfClicks: 1 });
    setShowCreateImageDialog(false);
  };

  const toggleFieldVisibility = (fieldId: string) => {
    const currentFields = getCurrentFields();
    const updatedFields = currentFields.map(field => 
      field.id === fieldId ? { ...field, visible: !field.visible } : field
    );
    setCurrentFields(updatedFields);
  };

  const removeField = (fieldId: string) => {
    const currentFields = getCurrentFields();
    const updatedFields = currentFields.filter(field => field.id !== fieldId);
    setCurrentFields(updatedFields);
  };

  const handleBusinessSubmit = () => {
    setShowAdditionalSectionDialog(true);
  };

  const handleAdditionalSectionResponse = (createAdditional: boolean) => {
    setShowAdditionalSectionDialog(false);
    if (createAdditional) {
      setCurrentStep(4);
      setCurrentSection("custom");
    } else {
      setCurrentStep(5);
      setCurrentSection("agent");
    }
  };

  const createAdditionalSection = () => {
    if (!newSectionName.trim()) return;
    
    const newSection: FormSection = {
      id: Date.now().toString(),
      name: newSectionName,
      fields: []
    };
    
    setCustomSections([...customSections, newSection]);
    setCurrentCustomSectionId(newSection.id);
    setCurrentSection("custom");
    setNewSectionName("");
  };

  const finalizeCPVForm = async () => {
    setIsLoading(true);
    try {
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Authentication error:', authError);
        toast({
          title: 'Authentication Error',
          description: 'Please sign in again.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      if (!user) {
        console.error('No authenticated user found');
        toast({
          title: 'Authentication Required',
          description: 'You must be signed in to create a CPV form.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      console.log('Authenticated user:', user.id);
      
      const allSections = [
        { id: "personal", name: "Personal Details", fields: personalFields },
        { id: "business", name: "Business Details", fields: businessFields },
        ...customSections,
        { id: "agent", name: "CPV Agent Details", fields: agentFields }
      ];

      const formData = {
        name: `CPV Form ${Date.now()}`,
        initiative: selectedInitiative,
        sections: allSections as any,
        user_id: user.id,
        status: 'active',
        current_status: 'draft',
        form_preview_data: allSections as any
      };

      console.log('Form data being saved:', formData);

      let result;
      if (editingFormId) {
        const { data, error } = await supabase
          .from('cpv_forms')
          .update(formData)
          .eq('id', editingFormId)
          .select();
        result = { data, error };
      } else {
        const { data, error } = await supabase
          .from('cpv_forms')
          .insert([formData])
          .select();
        result = { data, error };
      }

      if (result.error) throw result.error;

      toast({
        title: 'Success!',
        description: editingFormId ? 'CPV form updated successfully!' : 'CPV form created successfully!',
      });
      
      setShowSuccessDialog(true);
    } catch (error: any) {
      console.error('Error saving CPV form:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save CPV form',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const editForm = async (formId: string) => {
    const form = forms.find(f => f.id === formId);
    if (form) {
      setEditingFormId(formId);
      setSelectedInitiative(form.initiative);
      const personalSection = form.sections.find(s => s.id === "personal");
      const businessSection = form.sections.find(s => s.id === "business");
      if (personalSection) setPersonalFields(personalSection.fields);
      if (businessSection) setBusinessFields(businessSection.fields);
      setCustomSections(form.sections.filter(s => s.id !== "personal" && s.id !== "business"));
      setCurrentView("create");
      setCurrentStep(1);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedInitiative("");
    setCurrentSection("personal");
    setCustomSections([]);
    setEditingFormId(null);
    setNewSectionName("");
    setCurrentCustomSectionId("");
    setPersonalFields([
      { id: "1", title: "Person Name", dataType: "alphabets", mandatory: true, visible: true, type: "text" },
      { id: "2", title: "Contact Number", dataType: "numbers", mandatory: true, visible: true, type: "text" },
      { id: "3", title: "Designation", dataType: "alphabets", mandatory: false, visible: true, type: "text" },
      { id: "4", title: "Personal Address", dataType: "alphanumeric", mandatory: true, visible: true, type: "text" },
    ]);
    setBusinessFields([
      { id: "1", title: "Name of Business", dataType: "alphabets", mandatory: true, visible: true, type: "text" },
      { id: "2", title: "Office Address", dataType: "alphanumeric", mandatory: true, visible: true, type: "text" },
      { id: "3", title: "Pincode", dataType: "numbers", mandatory: true, visible: true, type: "text" },
      { id: "4", title: "Nearby Landmark", dataType: "alphanumeric", mandatory: false, visible: true, type: "text" },
      { id: "5", title: "Address Confirmed", dataType: "alphabets", mandatory: true, visible: true, type: "text" },
      { id: "6", title: "Nature of Business", dataType: "alphabets", mandatory: true, visible: true, type: "text" },
      { id: "7", title: "Type of business", dataType: "alphabets", mandatory: true, visible: true, type: "text" },
      { id: "8", title: "Office Ownership", dataType: "alphabets", mandatory: true, visible: true, type: "text" },
      { id: "9", title: "Number of years in present business", dataType: "numbers", mandatory: false, visible: true, type: "text" },
      { id: "10", title: "Number of years in the present office", dataType: "numbers", mandatory: false, visible: true, type: "text" },
    ]);
    setCurrentView("dashboard");
  };

  const renderImagePlaceholders = (field: CustomField) => {
    if (field.type !== "image" || !field.numberOfClicks) return null;
    
    const placeholders = [];
    for (let i = 0; i < field.numberOfClicks; i++) {
      placeholders.push(
        <ImagePlaceholder
          key={`${field.id}-${i}`}
          documentName={field.documentName || field.title}
          imageIndex={i}
          totalImages={field.numberOfClicks}
        />
      );
    }
    return (
      <div className="grid grid-cols-2 gap-3 mt-3">
        {placeholders}
      </div>
    );
  };

  const renderBusinessField = (field: CustomField) => {
    // Special rendering for specific business fields
    switch (field.title) {
      case "Address Confirmed":
        return (
          <RadioGroup disabled className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="yes" />
              <Label htmlFor="yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="no" />
              <Label htmlFor="no">No</Label>
            </div>
          </RadioGroup>
        );
      case "Nature of Business":
      case "Type of business":
      case "Office Ownership":
        return (
          <Select disabled>
            <SelectTrigger className="bg-gray-50">
              <SelectValue placeholder={`Select ${field.title.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom options will be available</SelectItem>
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input 
            placeholder={`Enter ${field.title.toLowerCase()}`} 
            disabled 
            className="bg-gray-50"
          />
        );
    }
  };

  const renderPreviewForm = () => {
    const allSections = [
      { id: "personal", name: "Personal Details", fields: personalFields },
      { id: "business", name: "Business Details", fields: businessFields },
      ...customSections,
      { id: "agent", name: "CPV Agent Details", fields: agentFields }
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle>CPV Form Preview</CardTitle>
          <CardDescription>
            This is how your form will appear to CPV agents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {allSections.map((section) => (
            <div key={section.id} className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">{section.name}</h3>
              {section.fields
                .filter(field => field.visible)
                .map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      {field.title}
                      {field.mandatory && <span className="text-red-500">*</span>}
                    </Label>
                    {field.type === "text" ? (
                      section.id === "business" ? renderBusinessField(field) : (
                        section.id === "agent" ? renderAgentField(field) : (
                          <Input 
                            placeholder={`Enter ${field.title.toLowerCase()}`} 
                            disabled 
                            className="bg-gray-50"
                          />
                        )
                      )
                    ) : (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Document: {field.documentName} | Required uploads: {field.numberOfClicks}
                        </p>
                        {renderImagePlaceholders(field)}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ))}
          

          <div className="flex gap-4 pt-4">
            <Button onClick={goBack} variant="outline" className="w-full">
              Back
            </Button>
            <Button onClick={finalizeCPVForm} className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingFormId ? 'Update Form' : 'Confirm & Create'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAgentField = (field: CustomField) => {
    switch (field.title) {
      case "Visit Date":
        return <Input type="date" disabled className="bg-gray-50" />;
      case "Visit Time":
        return <Input type="time" disabled className="bg-gray-50" />;
      case "Employee Signature":
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
            <p className="text-muted-foreground">Signature area for CPV agent</p>
          </div>
        );
      default:
        return (
          <Input 
            placeholder={`Agent will fill this`} 
            disabled 
            className="bg-gray-50"
          />
        );
    }
  };

  const renderDashboard = () => (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">CPV Forms Dashboard</h1>
        </div>
        <Button onClick={() => setCurrentView("create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading forms...</span>
        </div>
      ) : forms.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>No CPV Forms Created Yet</CardTitle>
            <CardDescription>
              Create your first Customer Physical Verification form to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setCurrentView("create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <Card 
              key={form.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => editForm(form.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {form.name}
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  Initiative: {form.initiative}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Created: {form.createdAt}
                </p>
                <p className="text-sm text-muted-foreground">
                  Sections: {form.sections.length}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You must be signed in to access CPV Forms.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {currentView === "dashboard" ? renderDashboard() : (
        <div className="max-w-4xl mx-auto">
          {currentStep === 6 ? renderPreviewForm() : (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {currentStep === 1 ? "Back to Dashboard" : "Back"}
                </Button>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">{editingFormId ? 'Edit' : 'Create'} CPV Form</h1>
                  <Progress value={(currentStep / 6) * 100} className="mt-2" />
                  <p className="text-sm text-muted-foreground mt-1">
                    Step {currentStep} of 6
                  </p>
                </div>
              </div>

              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Select Initiative</CardTitle>
                    <CardDescription>Choose the initiative for this CPV form</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InitiativeSelector
                      value={selectedInitiative}
                      onChange={setSelectedInitiative}
                    />
                    <div className="flex justify-end mt-6">
                      <Button 
                        onClick={() => setCurrentStep(2)} 
                        disabled={!selectedInitiative}
                      >
                        Continue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Details Verification</CardTitle>
                    <CardDescription>Configure the personal details section</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-end space-x-2">
                      <Button
                        onClick={() => {
                          setCurrentSection("personal");
                          setShowAddQuestionDialog(true);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                      <Button
                        onClick={() => {
                          setCurrentSection("personal");
                          setShowCreateImageDialog(true);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Add Image Upload
                      </Button>
                    </div>

                    {personalFields.map((field) => (
                      <FieldEditor
                        key={field.id}
                        field={field}
                        onUpdate={updateField}
                        onToggleVisibility={toggleFieldVisibility}
                        onRemove={removeField}
                        canRemove={false}
                      />
                    ))}

                    <div className="flex justify-between mt-6">
                      <Button variant="outline" onClick={goBack}>
                        Back
                      </Button>
                      <Button onClick={() => {
                        setCurrentStep(3);
                        setCurrentSection("business");
                      }}>
                        Continue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Business Details Verification</CardTitle>
                    <CardDescription>Configure the business details section</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-end space-x-2">
                      <Button
                        onClick={() => {
                          setCurrentSection("business");
                          setShowAddQuestionDialog(true);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                      <Button
                        onClick={() => {
                          setCurrentSection("business");
                          setShowCreateImageDialog(true);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Add Image Upload
                      </Button>
                    </div>

                    {businessFields.map((field) => (
                      <FieldEditor
                        key={field.id}
                        field={field}
                        onUpdate={updateField}
                        onToggleVisibility={toggleFieldVisibility}
                        onRemove={removeField}
                        canRemove={false}
                      />
                    ))}

                    <div className="flex justify-between mt-6">
                      <Button variant="outline" onClick={goBack}>
                        Back
                      </Button>
                      <Button onClick={handleBusinessSubmit}>
                        Submit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {currentCustomSectionId ? 
                        customSections.find(s => s.id === currentCustomSectionId)?.name || "Additional Section" :
                        "Create Additional Section"
                      }
                    </CardTitle>
                    <CardDescription>
                      {currentCustomSectionId ? 
                        "Configure this additional section" :
                        "Create a new section for your CPV form"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!currentCustomSectionId ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="section-name">Section Name</Label>
                          <Input
                            id="section-name"
                            value={newSectionName}
                            onChange={(e) => setNewSectionName(e.target.value)}
                            placeholder="Enter section name"
                          />
                        </div>
                        <div className="flex justify-between">
                          <Button variant="outline" onClick={() => {
                            setCurrentStep(5);
                            setCurrentSection("agent");
                          }}>
                            Back
                          </Button>
                          <Button onClick={createAdditionalSection} disabled={!newSectionName.trim()}>
                            Create Section
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-end space-x-2">
                          <Button
                            onClick={() => {
                              setCurrentSection("custom");
                              setShowAddQuestionDialog(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Question
                          </Button>
                          <Button
                            onClick={() => {
                              setCurrentSection("custom");
                              setShowCreateImageDialog(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Add Image Upload
                          </Button>
                        </div>

                        {getCurrentFields().map((field) => (
                          <FieldEditor
                            key={field.id}
                            field={field}
                            onUpdate={updateField}
                            onToggleVisibility={toggleFieldVisibility}
                            onRemove={removeField}
                            canRemove={true}
                          />
                        ))}

                        <div className="flex justify-between mt-6">
                          <Button variant="outline" onClick={() => {
                            setCurrentStep(3);
                            setCurrentSection("business");
                          }}>
                            Back
                          </Button>
                          <Button onClick={() => {
                            setCurrentStep(5);
                            setCurrentSection("agent");
                          }}>
                            Proceed
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {currentStep === 5 && (
                <Card>
                  <CardHeader>
                    <CardTitle>CPV Agent Details</CardTitle>
                    <CardDescription>Final mandatory section - Agent information fields</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                      This section contains mandatory fields that cannot be modified. These will be filled by the CPV agent during verification.
                    </p>

                    {agentFields.map((field) => (
                      <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{field.title}</span>
                          <span className="text-red-500">*</span>
                        </div>
                        <span className="text-sm text-muted-foreground">Mandatory</span>
                      </div>
                    ))}

                    <div className="flex justify-between mt-6">
                      <Button variant="outline" onClick={() => {
                        if (customSections.length > 0) {
                          setCurrentStep(4);
                          setCurrentSection("custom");
                          setCurrentCustomSectionId(customSections[customSections.length - 1].id);
                        } else {
                          setCurrentStep(3);
                          setCurrentSection("business");
                        }
                      }}>
                        Back
                      </Button>
                      <Button onClick={() => setCurrentStep(6)}>
                        Preview Form
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={showAddQuestionDialog} onOpenChange={setShowAddQuestionDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Add Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="question-title">Question Title</Label>
              <Input
                id="question-title"
                value={newQuestion.title}
                onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                placeholder="Enter question title"
              />
            </div>
            <div>
              <Label htmlFor="data-type">Data Type</Label>
              <Select 
                value={newQuestion.dataType} 
                onValueChange={(value) => setNewQuestion({ ...newQuestion, dataType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-md z-50">
                  <SelectItem value="alphabets">Alphabets</SelectItem>
                  <SelectItem value="numbers">Numbers</SelectItem>
                  <SelectItem value="alphanumeric">Alphanumeric</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mandatory"
                checked={newQuestion.mandatory}
                onCheckedChange={(checked) => setNewQuestion({ ...newQuestion, mandatory: !!checked })}
              />
              <Label htmlFor="mandatory">Mandatory field</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddQuestionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addCustomField} disabled={!newQuestion.title}>
                Add Question
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateImageDialog} onOpenChange={setShowCreateImageDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Add Image Upload Field</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="document-name">Document Name</Label>
              <Input
                id="document-name"
                value={newImageField.documentName}
                onChange={(e) => setNewImageField({ ...newImageField, documentName: e.target.value })}
                placeholder="Enter document name"
              />
            </div>
            <div>
              <Label htmlFor="number-of-clicks">Number of Images</Label>
              <Input
                id="number-of-clicks"
                type="number"
                min="1"
                max="10"
                value={newImageField.numberOfClicks}
                onChange={(e) => setNewImageField({ ...newImageField, numberOfClicks: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="image-mandatory"
                checked={newImageField.mandatory}
                onCheckedChange={(checked) => setNewImageField({ ...newImageField, mandatory: !!checked })}
              />
              <Label htmlFor="image-mandatory">Mandatory field</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateImageDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addImageField} disabled={!newImageField.documentName}>
                Add Image Field
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Success!</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="mb-4">
              {editingFormId ? 'CPV form updated successfully!' : 'CPV form created successfully!'}
            </p>
            <Button onClick={() => {
              setShowSuccessDialog(false);
              setCurrentView("dashboard");
              resetForm();
            }}>
              Back to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBackToDashboardDialog} onOpenChange={setShowBackToDashboardDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Confirm Navigation</DialogTitle>
          </DialogHeader>
          <div>
            <p className="mb-4">Are you sure you want to go back to the dashboard? All unsaved changes will be lost.</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBackToDashboardDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBackToDashboard} variant="destructive">
                Yes, Go Back
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showAdditionalSectionDialog} onOpenChange={setShowAdditionalSectionDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Additional Section</AlertDialogTitle>
            <AlertDialogDescription>
              Do you wish to create an additional section for your CPV Form?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleAdditionalSectionResponse(false)}>
              No
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleAdditionalSectionResponse(true)}>
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CPVForms;
