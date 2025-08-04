import React, { useState } from "react";
import { ArrowLeft, Plus, Eye, EyeOff, X, Upload, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

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
  
  // Main state
  const [currentView, setCurrentView] = useState<"dashboard" | "create">("dashboard");
  const [currentStep, setCurrentStep] = useState(1);
  const [forms, setForms] = useState<CPVForm[]>([]);
  
  // Form creation state
  const [selectedInitiative, setSelectedInitiative] = useState("");
  const [customSections, setCustomSections] = useState<FormSection[]>([]);
  const [currentSection, setCurrentSection] = useState<"personal" | "business" | "custom" | "agent">("personal");
  
  // Field management
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

  // Dialog states
  const [showAddQuestionDialog, setShowAddQuestionDialog] = useState(false);
  const [showCreateImageDialog, setShowCreateImageDialog] = useState(false);
  const [showAdditionalSectionDialog, setShowAdditionalSectionDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  // Form data
  const [newQuestion, setNewQuestion] = useState({ title: "", dataType: "alphabets", mandatory: false });
  const [newImageField, setNewImageField] = useState({ documentName: "", mandatory: false, numberOfClicks: 1 });
  const [newSectionName, setNewSectionName] = useState("");

  const initiatives = ["Banking Initiative", "Insurance Initiative", "NA"];
  
  const getCurrentFields = () => {
    switch (currentSection) {
      case "personal": return personalFields;
      case "business": return businessFields;
      default: return [];
    }
  };

  const setCurrentFields = (fields: CustomField[]) => {
    switch (currentSection) {
      case "personal": setPersonalFields(fields); break;
      case "business": setBusinessFields(fields); break;
    }
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

  const handleSubmitForm = () => {
    setShowAdditionalSectionDialog(true);
  };

  const finalizeCPVForm = () => {
    const newForm: CPVForm = {
      id: Date.now().toString(),
      name: `CPV Form ${forms.length + 1}`,
      initiative: selectedInitiative,
      sections: [
        { id: "personal", name: "Personal Details", fields: personalFields },
        { id: "business", name: "Business Details", fields: businessFields },
        ...customSections
      ],
      createdAt: new Date().toLocaleDateString()
    };
    
    setForms([...forms, newForm]);
    setShowSuccessDialog(true);
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedInitiative("");
    setCurrentSection("personal");
    setCustomSections([]);
    setCurrentView("dashboard");
  };

  if (currentView === "dashboard") {
    return (
      <div className="min-h-screen bg-background p-6">
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

          {forms.length === 0 ? (
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
                <Card key={form.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {form.name}
                      <span className="text-sm font-normal text-muted-foreground">
                        #{form.id}
                      </span>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => setCurrentView("dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forms
          </Button>
          <h1 className="text-2xl font-bold">Create CPV Form</h1>
        </div>

        <div className="mb-8">
          <Progress value={(currentStep / 6) * 100} className="w-full" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Step {currentStep} of 6</span>
            <span>{Math.round((currentStep / 6) * 100)}% Complete</span>
          </div>
        </div>

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Initiative</CardTitle>
              <CardDescription>
                Select the initiative for which you want to create a CPV form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="initiative">Initiative</Label>
                <Select value={selectedInitiative} onValueChange={setSelectedInitiative}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an initiative" />
                  </SelectTrigger>
                  <SelectContent>
                    {initiatives.map((initiative) => (
                      <SelectItem key={initiative} value={initiative}>
                        {initiative}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => setCurrentStep(2)} 
                disabled={!selectedInitiative}
                className="w-full"
              >
                Next
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Personal Details Verification</CardTitle>
              <CardDescription>
                Configure the personal details section of your CPV form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {personalFields.map((field) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{field.title}</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFieldVisibility(field.id)}
                      >
                        {field.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      {!["1", "2", "3", "4"].includes(field.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(field.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data Type</Label>
                      <Select 
                        value={field.dataType} 
                        onValueChange={(value) => {
                          const updatedFields = personalFields.map(f => 
                            f.id === field.id ? { ...f, dataType: value as any } : f
                          );
                          setPersonalFields(updatedFields);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alphabets">Alphabets</SelectItem>
                          <SelectItem value="numbers">Numbers</SelectItem>
                          <SelectItem value="alphanumeric">Alphanumeric</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox 
                        id={`mandatory-${field.id}`}
                        checked={field.mandatory}
                        onCheckedChange={(checked) => {
                          const updatedFields = personalFields.map(f => 
                            f.id === field.id ? { ...f, mandatory: !!checked } : f
                          );
                          setPersonalFields(updatedFields);
                        }}
                      />
                      <Label htmlFor={`mandatory-${field.id}`}>Mandatory</Label>
                    </div>
                  </div>

                  {field.type === "image" && (
                    <div className="text-sm text-muted-foreground">
                      Document: {field.documentName} | Clicks: {field.numberOfClicks}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex gap-4">
                <Dialog open={showAddQuestionDialog} onOpenChange={setShowAddQuestionDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add More Questions
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Custom Question</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Question Title</Label>
                        <Input
                          value={newQuestion.title}
                          onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                          placeholder="Enter question title"
                        />
                      </div>
                      <div>
                        <Label>Data Type</Label>
                        <Select 
                          value={newQuestion.dataType} 
                          onValueChange={(value) => setNewQuestion({ ...newQuestion, dataType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alphabets">Alphabets</SelectItem>
                            <SelectItem value="numbers">Numbers</SelectItem>
                            <SelectItem value="alphanumeric">Alphanumeric</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="mandatory-new"
                          checked={newQuestion.mandatory}
                          onCheckedChange={(checked) => setNewQuestion({ ...newQuestion, mandatory: !!checked })}
                        />
                        <Label htmlFor="mandatory-new">Mandatory</Label>
                      </div>
                      <Button onClick={addCustomField} disabled={!newQuestion.title}>
                        Add Question
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showCreateImageDialog} onOpenChange={setShowCreateImageDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Create Image Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Image Upload Field</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Document Name</Label>
                        <Input
                          value={newImageField.documentName}
                          onChange={(e) => setNewImageField({ ...newImageField, documentName: e.target.value })}
                          placeholder="e.g., Aadhar Card"
                        />
                      </div>
                      <div>
                        <Label>Number of Clicks Required</Label>
                        <Select 
                          value={newImageField.numberOfClicks.toString()} 
                          onValueChange={(value) => setNewImageField({ ...newImageField, numberOfClicks: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">One</SelectItem>
                            <SelectItem value="2">Two</SelectItem>
                            <SelectItem value="3">Three</SelectItem>
                            <SelectItem value="4">Four</SelectItem>
                            <SelectItem value="5">Five</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="mandatory-image"
                          checked={newImageField.mandatory}
                          onCheckedChange={(checked) => setNewImageField({ ...newImageField, mandatory: !!checked })}
                        />
                        <Label htmlFor="mandatory-image">Mandatory</Label>
                      </div>
                      <Button onClick={addImageField} disabled={!newImageField.documentName}>
                        Create Upload Field
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Button onClick={() => setCurrentStep(3)} className="w-full">
                Next
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Business Details Verification</CardTitle>
              <CardDescription>
                Configure the business details section of your CPV form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {businessFields.map((field) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{field.title}</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCurrentSection("business");
                          toggleFieldVisibility(field.id);
                        }}
                      >
                        {field.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      {!["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].includes(field.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCurrentSection("business");
                            removeField(field.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data Type</Label>
                      <Select 
                        value={field.dataType} 
                        onValueChange={(value) => {
                          const updatedFields = businessFields.map(f => 
                            f.id === field.id ? { ...f, dataType: value as any } : f
                          );
                          setBusinessFields(updatedFields);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alphabets">Alphabets</SelectItem>
                          <SelectItem value="numbers">Numbers</SelectItem>
                          <SelectItem value="alphanumeric">Alphanumeric</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox 
                        id={`mandatory-${field.id}`}
                        checked={field.mandatory}
                        onCheckedChange={(checked) => {
                          const updatedFields = businessFields.map(f => 
                            f.id === field.id ? { ...f, mandatory: !!checked } : f
                          );
                          setBusinessFields(updatedFields);
                        }}
                      />
                      <Label htmlFor={`mandatory-${field.id}`}>Mandatory</Label>
                    </div>
                  </div>

                  {field.type === "image" && (
                    <div className="text-sm text-muted-foreground">
                      Document: {field.documentName} | Clicks: {field.numberOfClicks}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex gap-4">
                <Dialog open={showAddQuestionDialog} onOpenChange={setShowAddQuestionDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => setCurrentSection("business")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add More Questions
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Custom Question</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Question Title</Label>
                        <Input
                          value={newQuestion.title}
                          onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                          placeholder="Enter question title"
                        />
                      </div>
                      <div>
                        <Label>Data Type</Label>
                        <Select 
                          value={newQuestion.dataType} 
                          onValueChange={(value) => setNewQuestion({ ...newQuestion, dataType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alphabets">Alphabets</SelectItem>
                            <SelectItem value="numbers">Numbers</SelectItem>
                            <SelectItem value="alphanumeric">Alphanumeric</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="mandatory-new"
                          checked={newQuestion.mandatory}
                          onCheckedChange={(checked) => setNewQuestion({ ...newQuestion, mandatory: !!checked })}
                        />
                        <Label htmlFor="mandatory-new">Mandatory</Label>
                      </div>
                      <Button onClick={addCustomField} disabled={!newQuestion.title}>
                        Add Question
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showCreateImageDialog} onOpenChange={setShowCreateImageDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => setCurrentSection("business")}>
                      <Upload className="h-4 w-4 mr-2" />
                      Create Image Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Image Upload Field</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Document Name</Label>
                        <Input
                          value={newImageField.documentName}
                          onChange={(e) => setNewImageField({ ...newImageField, documentName: e.target.value })}
                          placeholder="e.g., Business License"
                        />
                      </div>
                      <div>
                        <Label>Number of Clicks Required</Label>
                        <Select 
                          value={newImageField.numberOfClicks.toString()} 
                          onValueChange={(value) => setNewImageField({ ...newImageField, numberOfClicks: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">One</SelectItem>
                            <SelectItem value="2">Two</SelectItem>
                            <SelectItem value="3">Three</SelectItem>
                            <SelectItem value="4">Four</SelectItem>
                            <SelectItem value="5">Five</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="mandatory-image"
                          checked={newImageField.mandatory}
                          onCheckedChange={(checked) => setNewImageField({ ...newImageField, mandatory: !!checked })}
                        />
                        <Label htmlFor="mandatory-image">Mandatory</Label>
                      </div>
                      <Button onClick={addImageField} disabled={!newImageField.documentName}>
                        Create Upload Field
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Button onClick={handleSubmitForm} className="w-full">
                Submit
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Additional Section Dialog */}
        <Dialog open={showAdditionalSectionDialog} onOpenChange={setShowAdditionalSectionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Additional Section</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Do you wish to create an additional section for the CPV form?</p>
              <div className="flex gap-4">
                <Button onClick={() => {
                  setShowAdditionalSectionDialog(false);
                  setCurrentStep(4);
                }}>
                  Yes
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowAdditionalSectionDialog(false);
                  setCurrentStep(5);
                }}>
                  No
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Create Additional Section</CardTitle>
              <CardDescription>
                Add a custom section to your CPV form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Section Name</Label>
                <Input
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="Enter section name"
                />
              </div>
              
              <div className="flex gap-4">
                <Button 
                  onClick={() => setCurrentStep(5)} 
                  disabled={!newSectionName}
                >
                  Proceed
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(5)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>CPV Agent Details</CardTitle>
              <CardDescription>
                Final section - mandatory for CPV agents to fill
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Visit Date</Label>
                  <Input type="date" disabled />
                </div>
                <div>
                  <Label>Visit Time</Label>
                  <Input type="time" disabled />
                </div>
                <div>
                  <Label>Employee Name</Label>
                  <Input placeholder="Agent will fill this" disabled />
                </div>
                <div>
                  <Label>Employee Code</Label>
                  <Input placeholder="Agent will fill this" disabled />
                </div>
              </div>
              <div>
                <Label>Employee Signature</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">Signature area for CPV agent</p>
                </div>
              </div>
              
              <Button onClick={() => setCurrentStep(6)} className="w-full">
                Proceed
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 6 && (
          <Card>
            <CardHeader>
              <CardTitle>Form Creation Complete</CardTitle>
              <CardDescription>
                Review your CPV form settings before finalizing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Form Summary</h4>
                <p><strong>Initiative:</strong> {selectedInitiative}</p>
                <p><strong>Personal Details Fields:</strong> {personalFields.length}</p>
                <p><strong>Business Details Fields:</strong> {businessFields.length}</p>
                <p><strong>Custom Sections:</strong> {customSections.length}</p>
              </div>
              
              <Button onClick={finalizeCPVForm} className="w-full">
                Finalize CPV Form
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Success!</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>CPV Form {forms.length + 1} is successfully created</p>
              <Button onClick={() => {
                setShowSuccessDialog(false);
                resetForm();
                toast({
                  title: "Success",
                  description: "CPV Form created successfully",
                });
              }}>
                Continue
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CPVForms;