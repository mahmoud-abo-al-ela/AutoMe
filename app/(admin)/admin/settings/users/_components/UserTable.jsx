import React from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UserTableRow from "./UserTableRow";
import UserTableEmpty from "./UserTableEmpty";
import UserTableLoading from "./UserTableLoading";
import UserTableError from "./UserTableError";
import UserPagination from "./UserPagination";

const UserTable = ({
  users,
  loading,
  error,
  searchQuery,
  clearSearch,
  onToggleRole,
  onDeleteUser,
  loadingUpdateRole,
  loadingDeleteUser,
  onRetry,
  pagination,
  page,
  limit,
  onPageChange,
  isSearching,
}) => {
  const renderTableContent = () => {
    if (loading || isSearching) {
      return <UserTableLoading />;
    }

    if (error) {
      return <UserTableError error={error} onRetry={onRetry} />;
    }

    if (users.length === 0) {
      return (
        <UserTableEmpty searchQuery={searchQuery} clearSearch={clearSearch} />
      );
    }

    return users.map((user) => (
      <UserTableRow
        key={user.id}
        user={user}
        onToggleRole={onToggleRole}
        onDeleteUser={onDeleteUser}
        loadingUpdateRole={loadingUpdateRole}
        loadingDeleteUser={loadingDeleteUser}
      />
    ));
  };

  return (
    <div className="overflow-x-auto -mx-1 sm:-mx-2 md:mx-0 rounded-md">
      <div className="min-w-full align-middle">
        <Table className="border-collapse w-full">
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="w-[50%] py-2 pl-8 sm:pl-4 text-xs sm:text-sm">
                User
              </TableHead>
              <TableHead className="hidden sm:table-cell py-2 px-2 sm:px-3 md:px-4 text-xs sm:text-sm">
                Role
              </TableHead>
              <TableHead className="hidden sm:table-cell py-2 px-2 sm:px-3 md:px-4 text-xs sm:text-sm">
                Created At
              </TableHead>
              <TableHead className="w-[30%] sm:w-[50px] md:w-[60px] lg:w-[100px] text-right sm:text-center py-2 pr-8 sm:pr-0 text-xs sm:text-sm">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y">{renderTableContent()}</TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="mt-3 sm:mt-4 md:mt-6 px-2 sm:px-3 md:px-0">
          <UserPagination
            page={page}
            limit={limit}
            total={pagination.total}
            onPageChange={onPageChange}
            isLoading={loading}
            isSearching={isSearching}
          />
        </div>
      )}
    </div>
  );
};

export default UserTable;
