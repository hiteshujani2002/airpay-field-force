import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, User, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserData {
  id: string;
  username: string;
  role: string;
  company: string;
  email: string;
  contactNumber: string;
  addedOn: string;
  taggedTo: string;
  avatar?: string;
}

const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    contactNumber: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && user) {
      fetchUserData();
    }
  }, [open, user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }

      const formattedUserData: UserData = {
        id: data.user_id,
        username: data.username || "NA",
        role: formatRole(data.role) || "NA",
        company: data.company || "NA",
        email: data.email || user.email || "NA",
        contactNumber: data.contact_number || "NA",
        addedOn: data.created_at || "NA",
        taggedTo: data.mapped_to_user_id ? "Mapped User" : "NA",
        avatar: user.user_metadata?.avatar_url || ""
      };

      setUserData(formattedUserData);
      setFormData({
        username: formattedUserData.username,
        contactNumber: formattedUserData.contactNumber
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'client_admin': return 'Client Admin';
      case 'lead_assigner': return 'Lead Assigner';
      case 'cpv_agent': return 'CPV Agent';
      case 'super_admin': return 'Super Admin';
      default: return role;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = "Contact number is required";
    } else if (!/^\d{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = "Contact number must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors and try again.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would make an API call to update the user profile
    toast({
      title: "Profile updated",
      description: "Your profile has been successfully updated.",
    });
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (userData) {
      setFormData({
        username: userData.username,
        contactNumber: userData.contactNumber
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "Client Admin": return "default";
      case "Lead Assigner": return "secondary";
      case "CPV Agent": return "outline";
      default: return "default";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Profile</DialogTitle>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : userData ? (
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="flex justify-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={userData.avatar} />
                <AvatarFallback className="text-lg">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Profile Information */}
            <div className="space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="profile-username">Username</Label>
                {isEditing ? (
                  <>
                    <Input
                      id="profile-username"
                      value={formData.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      className={errors.username ? "border-destructive" : ""}
                    />
                    {errors.username && (
                      <p className="text-sm text-destructive">{errors.username}</p>
                    )}
                  </>
                ) : (
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {userData.username}
                  </div>
                )}
              </div>

              {/* Role - Read only */}
              <div className="space-y-2">
                <Label>Role</Label>
                <div className="flex items-center">
                  <Badge variant={getRoleBadgeVariant(userData.role)}>
                    {userData.role}
                  </Badge>
                </div>
              </div>

              {/* Company - Read only */}
              <div className="space-y-2">
                <Label>Company</Label>
                <div className="p-2 bg-muted rounded-md text-sm">
                  {userData.company}
                </div>
              </div>

              {/* Email - Read only */}
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="p-2 bg-muted rounded-md text-sm">
                  {userData.email}
                </div>
              </div>

              {/* Contact Number */}
              <div className="space-y-2">
                <Label htmlFor="profile-contact">Contact Number</Label>
                {isEditing ? (
                  <>
                    <Input
                      id="profile-contact"
                      value={formData.contactNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        handleInputChange("contactNumber", value);
                      }}
                      maxLength={10}
                      className={errors.contactNumber ? "border-destructive" : ""}
                    />
                    {errors.contactNumber && (
                      <p className="text-sm text-destructive">{errors.contactNumber}</p>
                    )}
                  </>
                ) : (
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {userData.contactNumber}
                  </div>
                )}
              </div>

              {/* Tagged To - Read only */}
              <div className="space-y-2">
                <Label>Tagged To</Label>
                <div className="p-2 bg-muted rounded-md text-sm">
                  {userData.taggedTo}
                </div>
              </div>

              {/* Member Since - Read only */}
              <div className="space-y-2">
                <Label>Member Since</Label>
                <div className="p-2 bg-muted rounded-md text-sm">
                  {userData.addedOn !== "NA" ? new Date(userData.addedOn).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : "NA"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No user data available
          </div>
        )}

        {/* Action Buttons */}
        {isEditing && userData ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;