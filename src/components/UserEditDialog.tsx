import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  username: string;
  role: "Client Admin" | "Lead Assigner" | "CPV Agent";
  company: string;
  email: string;
  contactNumber: string;
  addedOn: string;
  taggedTo?: string | string[];
  createdBy: string;
  modifiedBy: string;
  modifiedOn: string;
  mapWith?: string;
  state?: string;
  pinCode?: string;
}

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onUpdateUser: (user: User) => void;
}

const mapWithOptions = [
  "Team Lead 1",
  "Team Lead 2", 
  "Team Lead 3",
  "Senior Assigner",
  "Regional Manager"
];

const states = [
  "Maharashtra",
  "Delhi",
  "Karnataka",
  "Tamil Nadu",
  "Gujarat",
  "Rajasthan",
  "Uttar Pradesh",
  "West Bengal"
];

const UserEditDialog: React.FC<UserEditDialogProps> = ({
  open,
  onOpenChange,
  user,
  onUpdateUser
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<User>(user);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(user);
    setErrors({});
  }, [user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = "Contact number is required";
    } else if (!/^\d{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = "Contact number must be 10 digits";
    }

    if (formData.role === "Lead Assigner" && !formData.mapWith) {
      newErrors.mapWith = "Map With is required for Lead Assigner role";
    }

    if (formData.role === "CPV Agent") {
      if (!formData.state) {
        newErrors.state = "State is required for CPV Agent role";
      }
      if (!formData.pinCode?.trim()) {
        newErrors.pinCode = "Pin code is required for CPV Agent role";
      } else if (!/^\d{6}$/.test(formData.pinCode)) {
        newErrors.pinCode = "Pin code must be 6 digits";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors and try again.",
        variant: "destructive",
      });
      return;
    }

    onUpdateUser(formData);
  };

  const handleInputChange = (field: keyof User, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({ 
      ...prev, 
      role: role as "Client Admin" | "Lead Assigner" | "CPV Agent",
      mapWith: role !== "Lead Assigner" ? undefined : prev.mapWith,
      state: role !== "CPV Agent" ? undefined : prev.state,
      pinCode: role !== "CPV Agent" ? undefined : prev.pinCode
    }));
    if (errors.role) {
      setErrors(prev => ({ ...prev, role: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username - Non-editable */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Username cannot be changed</p>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Client Admin">Client Admin</SelectItem>
                <SelectItem value="Lead Assigner">Lead Assigner</SelectItem>
                <SelectItem value="CPV Agent">CPV Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Company - Non-editable */}
          <div className="space-y-2">
            <Label htmlFor="company">Company/Agency</Label>
            <Input
              id="company"
              value={formData.company}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Company cannot be changed</p>
          </div>

          {/* Email - Non-editable */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={formData.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          {/* Contact Number - Editable */}
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number *</Label>
            <Input
              id="contactNumber"
              value={formData.contactNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                handleInputChange("contactNumber", value);
              }}
              placeholder="Enter 10-digit contact number"
              maxLength={10}
              className={errors.contactNumber ? "border-destructive" : ""}
            />
            {errors.contactNumber && (
              <p className="text-sm text-destructive">{errors.contactNumber}</p>
            )}
          </div>

          {/* Tagged To - Editable */}
          <div className="space-y-2">
            <Label htmlFor="taggedTo">Tagged To</Label>
            <Input
              id="taggedTo"
              value={Array.isArray(formData.taggedTo) ? formData.taggedTo.join(", ") : formData.taggedTo || ""}
              onChange={(e) => handleInputChange("taggedTo", e.target.value)}
              placeholder="Enter project or assignment"
            />
          </div>

          {/* Conditional Fields for Lead Assigner */}
          {formData.role === "Lead Assigner" && (
            <div className="space-y-2">
              <Label htmlFor="mapWith">Map With *</Label>
              <Select 
                value={formData.mapWith || ""} 
                onValueChange={(value) => handleInputChange("mapWith", value)}
              >
                <SelectTrigger className={errors.mapWith ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select mapping" />
                </SelectTrigger>
                <SelectContent>
                  {mapWithOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.mapWith && (
                <p className="text-sm text-destructive">{errors.mapWith}</p>
              )}
            </div>
          )}

          {/* Conditional Fields for CPV Agent */}
          {formData.role === "CPV Agent" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select 
                  value={formData.state || ""} 
                  onValueChange={(value) => handleInputChange("state", value)}
                >
                  <SelectTrigger className={errors.state ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && (
                  <p className="text-sm text-destructive">{errors.state}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pinCode">Pin Code *</Label>
                <Input
                  id="pinCode"
                  value={formData.pinCode || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    handleInputChange("pinCode", value);
                  }}
                  placeholder="Enter 6-digit pin code"
                  maxLength={6}
                  className={errors.pinCode ? "border-destructive" : ""}
                />
                {errors.pinCode && (
                  <p className="text-sm text-destructive">{errors.pinCode}</p>
                )}
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditDialog;