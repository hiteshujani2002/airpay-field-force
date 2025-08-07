import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, User, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock current user data - in a real app, this would come from context/auth
const currentUser = {
  id: "current-user",
  username: "current_user",
  role: "Client Admin" as const,
  company: "ABC Corp",
  email: "current.user@abccorp.com",
  contactNumber: "9876543210",
  addedOn: "2024-01-01",
  taggedTo: "Admin Operations",
  avatar: "/placeholder-avatar.jpg"
};

const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: currentUser.username,
    contactNumber: currentUser.contactNumber
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    setFormData({
      username: currentUser.username,
      contactNumber: currentUser.contactNumber
    });
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
            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex justify-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={currentUser.avatar} />
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
                  {currentUser.username}
                </div>
              )}
            </div>

            {/* Role - Read only */}
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex items-center">
                <Badge variant={getRoleBadgeVariant(currentUser.role)}>
                  {currentUser.role}
                </Badge>
              </div>
            </div>

            {/* Company - Read only */}
            <div className="space-y-2">
              <Label>Company</Label>
              <div className="p-2 bg-muted rounded-md text-sm">
                {currentUser.company}
              </div>
            </div>

            {/* Email - Read only */}
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="p-2 bg-muted rounded-md text-sm">
                {currentUser.email}
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
                  {currentUser.contactNumber}
                </div>
              )}
            </div>

            {/* Tagged To - Read only */}
            <div className="space-y-2">
              <Label>Tagged To</Label>
              <div className="p-2 bg-muted rounded-md text-sm">
                {currentUser.taggedTo}
              </div>
            </div>

            {/* Member Since - Read only */}
            <div className="space-y-2">
              <Label>Member Since</Label>
              <div className="p-2 bg-muted rounded-md text-sm">
                {new Date(currentUser.addedOn).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing ? (
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
          ) : (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;