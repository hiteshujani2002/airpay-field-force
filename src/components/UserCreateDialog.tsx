import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type UserRole = 'super_admin' | 'client_admin' | 'lead_assigner' | 'cpv_agent';

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateUser: (userData: {
    username: string;
    role: UserRole;
    company: string;
    email: string;
    contactNumber: string;
    mappedToUserId?: string;
    taggedToCompany?: string;
  }) => void;
}

interface Entity {
  id: string;
  entity_type: 'company' | 'agency';
  company_name?: string;
  agency_name?: string;
}

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
  const { userRole, user } = useAuth();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [currentUserCompany, setCurrentUserCompany] = useState<string>("");
  const [formData, setFormData] = useState({
    username: "",
    role: "" as UserRole | "",
    company: "",
    email: "",
    contactNumber: "",
    taggedTo: [] as string[],
    taggedToCompany: "",
    state: "",
    pinCode: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch entities and current user company on component mount
  useEffect(() => {
    if (open && user) {
      console.log('UserCreateDialog - Fetching data for user:', user.id)
      console.log('UserCreateDialog - Current userRole:', userRole)
      fetchEntities();
      fetchCurrentUserCompany();
    }
  }, [open, user]);

  const fetchEntities = async () => {
    try {
      const { data, error } = await supabase
        .from('entities')
        .select('id, entity_type, company_name, agency_name')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntities(data || []);
    } catch (error) {
      console.error('Error fetching entities:', error);
    }
  };

  const fetchCurrentUserCompany = async () => {
    try {
      console.log('UserCreateDialog - Fetching current user company for user:', user?.id)
      const { data, error } = await supabase
        .from('user_roles')
        .select('company')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      console.log('UserCreateDialog - Current user company:', data?.company)
      setCurrentUserCompany(data?.company || "");
    } catch (error) {
      console.error('Error fetching current user company:', error);
    }
  };

  // Get companies based on role for company dropdown
  const getCompaniesForDropdown = () => {
    if (formData.role === "lead_assigner" || formData.role === "cpv_agent") {
      // Show agencies for lead assigners and cpv agents
      return entities.filter(entity => entity.entity_type === 'agency').map(entity => ({
        value: entity.agency_name || '',
        label: entity.agency_name || ''
      }));
    } else {
      // Show companies for client admins
      return entities.filter(entity => entity.entity_type === 'company').map(entity => ({
        value: entity.company_name || '',
        label: entity.company_name || ''
      }));
    }
  };

  // Get companies for tagging dropdown (only companies)
  const getCompaniesForTagging = () => {
    return entities.filter(entity => entity.entity_type === 'company').map(entity => ({
      value: entity.company_name || '',
      label: entity.company_name || ''
    }));
  };

  // Check if user should see tagged to company dropdown
  const shouldShowTaggedToCompany = () => {
    return userRole === 'super_admin' && (formData.role === "lead_assigner" || formData.role === "cpv_agent");
  };

  // Get available roles based on current user's role
  const getAvailableRoles = (): UserRole[] => {
    switch (userRole) {
      case 'super_admin':
        return ['super_admin', 'client_admin', 'lead_assigner', 'cpv_agent'];
      case 'client_admin':
        return ['client_admin'];
      case 'lead_assigner':
        return ['cpv_agent'];
      default:
        return [];
    }
  };

  const formatRoleDisplay = (role: UserRole): string => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'client_admin': return 'Client Admin';
      case 'lead_assigner': return 'Lead Assigner';
      case 'cpv_agent': return 'CPV Agent';
      default: return role;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    if (!formData.company && !(userRole === 'lead_assigner' && formData.role === 'cpv_agent') && userRole !== 'client_admin') {
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

    if (shouldShowTaggedToCompany() && !formData.taggedToCompany) {
      newErrors.taggedToCompany = "Tagged to Company is required";
    }

    if (formData.role === "cpv_agent") {
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
    
    console.log('UserCreateDialog - Form submission started')
    console.log('UserCreateDialog - Form data:', formData)
    console.log('UserCreateDialog - UserRole:', userRole)
    console.log('UserCreateDialog - CurrentUserCompany:', currentUserCompany)
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors and try again.",
        variant: "destructive",
      });
      return;
    }

    const finalCompany = (userRole === 'lead_assigner' && formData.role === 'cpv_agent') || userRole === 'client_admin' ? currentUserCompany : formData.company
    console.log('UserCreateDialog - Final company to be sent:', finalCompany)

    onCreateUser({
      username: formData.username,
      role: formData.role as UserRole,
      company: finalCompany,
      email: formData.email,
      contactNumber: formData.contactNumber,
      taggedToCompany: shouldShowTaggedToCompany() ? formData.taggedToCompany : (userRole === 'lead_assigner' ? currentUserCompany : undefined),
    });

    // Reset form
    setFormData({
      username: "",
      role: "",
      company: "",
      email: "",
      contactNumber: "",
      taggedTo: [],
      taggedToCompany: "",
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
    console.log('UserCreateDialog - Role changed to:', role, 'by userRole:', userRole)
    console.log('UserCreateDialog - Current user company:', currentUserCompany)
    
    setFormData(prev => ({ 
      ...prev, 
      role: role as UserRole,
      taggedTo: [],
      taggedToCompany: "",
      state: "",
      pinCode: "",
      // Auto-set company for Lead Assigner creating CPV Agent or Client Admin creating users
      company: ((userRole === 'lead_assigner' && role === 'cpv_agent') || userRole === 'client_admin') ? currentUserCompany : ""
    }));
    
    console.log('UserCreateDialog - Company set to:', (userRole === 'lead_assigner' && role === 'cpv_agent') ? currentUserCompany : "")
    
    if (errors.role) {
      setErrors(prev => ({ ...prev, role: "" }));
    }
  };

  const handleTaggedToChange = (company: string, checked: boolean) => {
    setFormData(prev => {
      const newTaggedTo = checked
        ? [...prev.taggedTo, company]
        : prev.taggedTo.filter(item => item !== company);
      
      // Limit to maximum 6 selections
      if (newTaggedTo.length > 6) {
        return prev;
      }
      
      return { ...prev, taggedTo: newTaggedTo };
    });
  };

  const removeTaggedTo = (company: string) => {
    setFormData(prev => ({
      ...prev,
      taggedTo: prev.taggedTo.filter(item => item !== company)
    }));
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
                {getAvailableRoles().map((role) => (
                  <SelectItem key={role} value={role}>
                    {formatRoleDisplay(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role}</p>
            )}
          </div>

          {/* Company - Hide for Lead Assigner creating CPV Agent and Client Admin creating users */}
          {!(userRole === 'lead_assigner' && formData.role === 'cpv_agent') && userRole !== 'client_admin' && (
            <div className="space-y-2">
              <Label htmlFor="company">
                {formData.role === "lead_assigner" || formData.role === "cpv_agent" ? "Agency *" : "Company/Agency *"}
              </Label>
              <Select value={formData.company} onValueChange={(value) => handleInputChange("company", value)}>
                <SelectTrigger className={errors.company ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {getCompaniesForDropdown().map((company) => (
                    <SelectItem key={company.value} value={company.value}>
                      {company.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.company && (
                <p className="text-sm text-destructive">{errors.company}</p>
              )}
            </div>
          )}

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

          {/* Tagged To Company - Only for Super Admin creating Lead Assigner or CPV Agent */}
          {shouldShowTaggedToCompany() && (
            <div className="space-y-2">
              <Label htmlFor="taggedToCompany">Tagged to Company *</Label>
              <Select value={formData.taggedToCompany} onValueChange={(value) => handleInputChange("taggedToCompany", value)}>
                <SelectTrigger className={errors.taggedToCompany ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select company to tag to" />
                </SelectTrigger>
                <SelectContent>
                  {getCompaniesForTagging().map((company) => (
                    <SelectItem key={company.value} value={company.value}>
                      {company.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.taggedToCompany && (
                <p className="text-sm text-destructive">{errors.taggedToCompany}</p>
              )}
            </div>
          )}

          {/* Conditional Fields for CPV Agent */}
          {formData.role === "cpv_agent" && (
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