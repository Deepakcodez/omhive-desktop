import Button from "@/components/ui/button";
import CreateUserForm from "@/features/admin/components/create-user-form";
import UserList from "@/features/admin/components/user-list";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/admin/add-user")({
  component: RouteComponent,
});


function RouteComponent() {

  const router = useRouter();

  return (
    <div className="min-h-screen grid grid-cols-2 px-4 py-10">

      <Button
        onClick={() => router.history.back()}
        title='Back'
        className='aspect-square p-1.5 fixed top-2 left-2 '>
        <ChevronLeft />
      </Button>
      <CreateUserForm />
      <UserList />

    </div>
  );
}