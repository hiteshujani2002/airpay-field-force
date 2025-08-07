import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import UserEditDialog from "@/components/UserEditDialog";
import UserProfileDialog from "@/components/UserProfileDialog";
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

const mockUsers: User[] = [
  {
    id: "1",
    username: "john_doe",
    role: "Client Admin",
    company: "ABC Corp",
    email: "john.doe@abccorp.com",
    contactNumber: "9876543210",
    addedOn: "2024-01-15",
    taggedTo: "Project Alpha",
    createdBy: "Admin",
    modifiedBy: "Admin",
    modifiedOn: "2024-01-15"
  },
  {
    id: "2",
    username: "jane_smith",
    role: "Lead Assigner",
    company: "XYZ Agency",
    email: "jane.smith@xyzagency.com",
    contactNumber: "9876543211",
    addedOn: "2024-01-16",
    taggedTo: "Project Beta",
    createdBy: "john_doe",
    modifiedBy: "jane_smith",
    modifiedOn: "2024-01-20",
    mapWith: "Team Lead 1"
  },
  {
    id: "3",
    username: "mike_wilson",
    role: "CPV Agent",
    company: "DEF Bank",
    email: "mike.wilson@defbank.com",
    contactNumber: "9876543212",
    addedOn: "2024-01-17",
    taggedTo: "Project Gamma",
    createdBy: "jane_smith",
    modifiedBy: "mike_wilson",
    modifiedOn: "2024-01-18",
    state: "Maharashtra",
    pinCode: "400001"
  }
];

const UserManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const itemsPerPage = 10;
  
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleDeleteUser = (user: User) => {
    setUsers(prev => prev.filter(u => u.id !== user.id));
    setUserToDelete(null);
    toast({
      title: "User deleted",
      description: `${user.username} has been successfully deleted.`,
    });
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const handleCreateUser = (userData: Omit<User, 'id' | 'addedOn' | 'createdBy' | 'modifiedBy' | 'modifiedOn'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      addedOn: new Date().toISOString().split('T')[0],
      createdBy: "Current User",
      modifiedBy: "Current User",
      modifiedOn: new Date().toISOString().split('T')[0],
    };
    setUsers(prev => [...prev, newUser]);
    setShowCreateDialog(false);
    toast({
      title: "User created",
      description: `${newUser.username} has been successfully created.`,
    });
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(user => 
      user.id === updatedUser.id 
        ? { ...updatedUser, modifiedBy: "Current User", modifiedOn: new Date().toISOString().split('T')[0] }
        : user
    ));
    setShowEditDialog(false);
    setSelectedUser(null);
    toast({
      title: "User updated",
      description: `${updatedUser.username} has been successfully updated.`,
    });
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
              <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sr.No</TableHead>
                    <TableHead>User Name</TableHead>
                    <TableHead className="w-40">Role</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead>Tagged To</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Modified By</TableHead>
                    <TableHead>Modified On</TableHead>
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
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.company}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.contactNumber}</TableCell>
                      <TableCell>{user.addedOn}</TableCell>
                      <TableCell>{Array.isArray(user.taggedTo) ? user.taggedTo.join(", ") : user.taggedTo || "-"}</TableCell>
                      <TableCell>{user.createdBy}</TableCell>
                      <TableCell>{user.modifiedBy}</TableCell>
                      <TableCell>{user.modifiedOn}</TableCell>
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
          <UserEditDialog
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