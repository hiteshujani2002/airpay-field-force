import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Plus, Edit, Trash2, ChevronDown, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserCreateDialog from "@/components/UserCreateDialog";
// Remove UserEditDialog import as we'll create a custom one inline
import UserProfileDialog from "@/components/UserProfileDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";

type UserRole = 'super_admin' | 'client_admin' | 'lead_assigner' | 'cpv_agent';

interface User {
  id: string;
  user_id: string;
  username: string;
  role: UserRole;
  company: string;
  email: string;
  contact_number: string;
  created_at: string;
  updated_at: string;
  mapped_to_user_id?: string;
  created_by_user_id?: string;
}

const UserManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 10;

  // Fetch users based on role-based access
  const fetchUsers = async () => {
    if (!user || !userRole) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_users_by_role_access');
      
      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    fetchUsers();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('user_roles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          fetchUsers(); // Refetch users when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleDeleteUser = async (userToDelete: User) => {
    try {
      console.log('Attempting synchronized deletion for user:', {
        userToDelete,
        currentUser: user?.id,
        currentUserRole: userRole
      });

      // Get the current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      // Call the edge function to perform synchronized deletion
      const { data, error: functionError } = await supabase.functions.invoke('delete-user', {
        body: {
          userIdToDelete: userToDelete.user_id
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (functionError) {
        console.error('Edge function error:', functionError);
        throw new Error(`Failed to delete user: ${functionError.message}`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      console.log('User successfully deleted from both auth and user_roles');

      toast({
        title: "User deleted",
        description: `${userToDelete.username} has been completely removed from the system.`,
      });
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const handleCreateUser = async (userData: {
    username: string;
    role: UserRole;
    company: string;
    email: string;
    contactNumber: string;
    mappedToUserId?: string;
  }) => {
    try {
      setIsLoading(true);

      // Get the current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      // Call the new create-user edge function for synchronized creation
      const { data, error: createError } = await supabase.functions.invoke('create-user', {
        body: {
          username: userData.username,
          email: userData.email,
          role: userData.role,
          company: userData.company,
          contactNumber: userData.contactNumber,
          mappedToUserId: userData.mappedToUserId || null
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (createError) {
        console.error('User creation error:', createError);
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      if (data?.error) {
        // Use the specific error message from the edge function
        throw new Error(data.error);
      }

      console.log('User created successfully:', data);

      toast({
        title: "User created",
        description: `${userData.username} has been created successfully. They will receive login instructions via email.`,
      });

      setShowCreateDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: `Failed to create user: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({
          username: updatedUser.username,
          email: updatedUser.email,
          contact_number: updatedUser.contact_number,
          company: updatedUser.company,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedUser.id);

      if (error) throw error;

      toast({
        title: "User updated",
        description: `${updatedUser.username} has been successfully updated.`,
      });
      setShowEditDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "super_admin": return "default";
      case "client_admin": return "secondary";
      case "lead_assigner": return "outline";
      case "cpv_agent": return "outline";
      default: return "default";
    }
  };

  const formatRole = (role: UserRole) => {
    switch (role) {
      case "super_admin": return "Super Admin";
      case "client_admin": return "Client Admin";
      case "lead_assigner": return "Lead Assigner";
      case "cpv_agent": return "CPV Agent";
      default: return role;
    }
  };

  const canCreateUsers = () => {
    return userRole === 'super_admin' || userRole === 'client_admin' || userRole === 'lead_assigner';
  };

  // Inline EditUserDialog component
  const EditUserDialog = ({ open, onOpenChange, user, onUpdateUser }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User;
    onUpdateUser: (user: User) => void;
  }) => {
    const [formData, setFormData] = useState({
      username: user.username || "",
      email: user.email || "",
      contact_number: user.contact_number || "",
      company: user.company || ""
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const updatedUser: User = {
        ...user,
        username: formData.username,
        email: formData.email,
        contact_number: formData.contact_number,
        company: formData.company
      };
      onUpdateUser(updatedUser);
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Number</Label>
              <Input
                value={formData.contact_number}
                onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground">Manage users, roles, and permissions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                  View Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search and Create */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              {canCreateUsers() && (
                <Button 
                  onClick={() => setShowCreateDialog(true)} 
                  className="bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <CardDescription>
              {userRole === 'super_admin' && "Viewing all users in the system"}
              {userRole === 'client_admin' && "Viewing Lead Assigners mapped to your company"}
              {userRole === 'lead_assigner' && "Viewing CPV Agents you created"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center p-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Users Found</h3>
                <p>
                  {searchTerm 
                    ? "No users match your search criteria." 
                    : "You don't have access to any users yet."
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sr.No</TableHead>
                      <TableHead>User Name</TableHead>
                      <TableHead className="w-48">Role</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Contact Number</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Updated At</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell>{startIndex + index + 1}</TableCell>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {formatRole(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.company}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.contact_number}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(user.updated_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setUserToDelete(user)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create User Dialog */}
        <UserCreateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreateUser={handleCreateUser}
        />

        {/* Edit User Dialog */}
        {selectedUser && (
          <EditUserDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            user={selectedUser}
            onUpdateUser={handleUpdateUser}
          />
        )}

        {/* Profile Dialog */}
        <UserProfileDialog
          open={showProfileDialog}
          onOpenChange={setShowProfileDialog}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure about deleting the user?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user account for {userToDelete?.username}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)}>No</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => userToDelete && handleDeleteUser(userToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default UserManagement;