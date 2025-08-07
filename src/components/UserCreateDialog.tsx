import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateUser: (userData: {
    username: string;
    role: "Client Admin" | "Lead Assigner" | "CPV Agent";
    company: string;
    email: string;
    contactNumber: string;
    taggedTo?: string;
    state?: string;
    pinCode?: string;
  }) => void;
}

const companies = [
  "ABC Corp",
  "XYZ Agency", 
  "DEF Bank",
  "GHI Financial",
  "JKL Services",
  "MNO Solutions"
];

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

const UserCreateDialog: React.FC<UserCreateDialogProps> = ({
  open,
  onOpenChange,
  onCreateUser
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: "",
    role: "" as "Client Admin" | "Lead Assigner" | "CPV Agent" | "",
    company: "",
    email: "",
    contactNumber: "",
    taggedTo: "",
    state: "",
    pinCode: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    if (!formData.company) {
      newErrors.company = "Company is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = "Contact number is required";
    } else if (!/^\d{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = "Contact number must be 10 digits";
    }


    if (formData.role === "CPV Agent") {
      if (!formData.state) {
        newErrors.state = "State is required for CPV Agent role";
      }
      if (!formData.pinCode.trim()) {
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

    onCreateUser({
      username: formData.username,
      role: formData.role as "Client Admin" | "Lead Assigner" | "CPV Agent",
      company: formData.company,
      email: formData.email,
      contactNumber: formData.contactNumber,
      taggedTo: formData.taggedTo || undefined,
      state: formData.state || undefined,
      pinCode: formData.pinCode || undefined,
    });

    // Reset form
    setFormData({
      username: "",
      role: "",
      company: "",
      email: "",
      contactNumber: "",
      taggedTo: "",
      state: "",
      pinCode: ""
    });
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({ 
      ...prev, 
      role: role as "Client Admin" | "Lead Assigner" | "CPV Agent",
      taggedTo: "",
      state: "",
      pinCode: ""
    }));
    if (errors.role) {
      setErrors(prev => ({ ...prev, role: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              placeholder="Enter username"
              className={errors.username ? "border-destructive" : ""}
            />
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger className={errors.role ? "border-destructive" : ""}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Client Admin">Client Admin</SelectItem>
                <SelectItem value="Lead Assigner">Lead Assigner</SelectItem>
                <SelectItem value="CPV Agent">CPV Agent</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role}</p>
            )}
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company">
              {formData.role === "Lead Assigner" || formData.role === "CPV Agent" ? "Agency *" : "Company/Agency *"}
            </Label>
            <Select value={formData.company} onValueChange={(value) => handleInputChange("company", value)}>
              <SelectTrigger className={errors.company ? "border-destructive" : ""}>
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.company && (
              <p className="text-sm text-destructive">{errors.company}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter email"
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Contact Number */}
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

          {/* Tagged To */}
          {(formData.role === "Lead Assigner" || formData.role === "CPV Agent") ? (
            <div className="space-y-2">
              <Label htmlFor="taggedTo">Tagged To</Label>
              <Select value={formData.taggedTo} onValueChange={(value) => handleInputChange("taggedTo", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="taggedTo">Tagged To</Label>
              <Input
                id="taggedTo"
                value={formData.taggedTo}
                onChange={(e) => handleInputChange("taggedTo", e.target.value)}
                placeholder="Enter project or assignment"
              />
            </div>
          )}

          {/* Conditional Fields for CPV Agent */}
          {formData.role === "CPV Agent" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)}>
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
                  value={formData.pinCode}
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
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserCreateDialog;