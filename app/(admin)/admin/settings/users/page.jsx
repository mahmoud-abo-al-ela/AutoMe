"use client";
import React, { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { getUsers, updateUserRole, deleteUser } from "@/actions/settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  UserHeader,
  UserSearchBar,
  UserTable,
  DeleteUserDialog,
  useDebounce,
} from "./_components";

const UsersPage = () => {
  const [adminUsers, setAdminUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const {
    data: usersData,
    loading: loadingUsers,
    error: usersError,
    fn: fetchUsers,
  } = useFetch(getUsers, true);

  const {
    data: updateRoleData,
    loading: loadingUpdateRole,
    error: updateRoleError,
    fn: updateRoleFn,
  } = useFetch(updateUserRole);

  const {
    data: deleteUserData,
    loading: loadingDeleteUser,
    error: deleteUserError,
    fn: deleteUserFn,
  } = useFetch(deleteUser);

  useEffect(() => {
    setIsSearching(true);
    fetchUsers(debouncedSearchQuery, page, limit).finally(() => {
      setIsSearching(false);
    });
  }, [page, limit, debouncedSearchQuery]);

  useEffect(() => {
    if (usersData?.data) {
      setAdminUsers(usersData.data);
    }
  }, [usersData]);

  const toggleUserStatus = async (userId, currentRole) => {
    // If trying to demote an admin to user, check if they're the last admin
    if (currentRole === "ADMIN") {
      const adminCount = adminUsers.filter(
        (user) => user.role === "ADMIN"
      ).length;
      if (adminCount <= 1) {
        toast.error(
          "Cannot change role: There must be at least one admin user"
        );
        return;
      }
    }

    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    try {
      const response = await updateRoleFn(userId, newRole);
      if (response.success) {
        toast.success(`User role updated successfully`);
        // Refresh the users list
        fetchUsers(debouncedSearchQuery, page, limit);
      } else {
        toast.error(response.error || "Failed to update user role");
      }
    } catch (error) {
      toast.error("An error occurred while updating user role");
    }
  };

  const handleDeleteUser = (user) => {
    // Prevent deletion of admin users
    if (user.role === "ADMIN") {
      toast.error("Admin users cannot be deleted");
      return;
    }

    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await deleteUserFn(userToDelete.id);
      if (response.success) {
        toast.success("User deleted successfully");
        fetchUsers(debouncedSearchQuery, page, limit);
      } else {
        toast.error(response.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the user");
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  const clearSearch = () => {
    setSearchQuery("");
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRetry = () => {
    fetchUsers(debouncedSearchQuery, page, limit);
  };

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <Toaster
        richColors
        position="top-right"
        expand={false}
        closeButton={true}
      />
      <UserHeader />
      <Card className="overflow-hidden shadow-sm border">
        <CardHeader className="py-3 sm:py-4 px-3 sm:px-6 space-y-2">
          <div className="text-center sm:text-left">
            <CardTitle className="text-lg sm:text-xl md:text-2xl">
              Users Accounts
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm md:text-base mt-1">
              Manage users who have access to the admin panel and their
              permissions.
            </CardDescription>
          </div>
          <UserSearchBar
            searchQuery={searchQuery}
            onSearchChange={handleSearch}
            onClearSearch={clearSearch}
            isSearching={isSearching}
          />
        </CardHeader>
        <CardContent className="px-0 sm:px-2 md:px-4 pb-3 sm:pb-4 md:pb-6">
          <UserTable
            users={adminUsers}
            loading={loadingUsers}
            error={usersError}
            searchQuery={searchQuery}
            clearSearch={clearSearch}
            onToggleRole={toggleUserStatus}
            onDeleteUser={handleDeleteUser}
            loadingUpdateRole={loadingUpdateRole}
            loadingDeleteUser={loadingDeleteUser}
            onRetry={handleRetry}
            pagination={usersData?.pagination}
            page={page}
            limit={limit}
            onPageChange={handlePageChange}
            isSearching={isSearching}
          />
        </CardContent>
      </Card>

      <DeleteUserDialog
        isOpen={deleteDialogOpen}
        onClose={setDeleteDialogOpen}
        user={userToDelete}
        onConfirm={confirmDeleteUser}
        isLoading={loadingDeleteUser}
      />
    </div>
  );
};

export default UsersPage;
