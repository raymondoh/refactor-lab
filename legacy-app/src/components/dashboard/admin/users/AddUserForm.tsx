// src/components/dashboard/admin/users/AddUserForm.tsx
"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { toast } from "sonner";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import type { UserRole } from "@/types/user";
import { Button } from "@/components/ui/button";
import { createUser } from "@/actions/user/admin"; // This action will also need to be updated!

interface AddUserFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export function AddUserForm({ onSuccess, onClose }: AddUserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  // Highlight: Updated formData state to include firstName, lastName, and displayName
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    displayName: "", // New field
    email: "",
    password: "",
    role: "user" as UserRole
  });

  const firstNameInputRef = useRef<HTMLInputElement>(null); // Changed ref to firstName

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    // Highlight: Reset all new fields
    setFormData({ firstName: "", lastName: "", displayName: "", email: "", password: "", role: "user" });
    firstNameInputRef.current?.focus(); // Focus on first name
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Highlight: Update validation for new fields
    if (!formData.firstName.trim()) {
      toast.error("First Name is required");
      return;
    }
    if (!formData.lastName.trim()) {
      toast.error("Last Name is required");
      return;
    }
    // displayName is optional here if it can be derived from first/last later,
    // but typically for admin creation, it's better to explicitly set it or derive on backend.
    // For now, if you want it to be explicitly set, uncomment validation:
    // if (!formData.displayName.trim()) {
    //   toast.error("Display Name is required");
    //   return;
    // }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Highlight: Pass all new fields to createUser action
      const result = await createUser(formData);

      if (result.success) {
        toast.success(`User "${formData.displayName || formData.firstName}" created successfully`);
        resetForm();
        onSuccess?.();
        onClose?.();
      } else {
        toast.error(result.error || "Failed to create user");
      }
    } catch (error) {
      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "An unexpected error occurred";

      console.error("[AddUserForm Error]:", error);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 py-4">
      {/* Highlight: New First Name, Last Name inputs */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="firstName" className="text-right">
          First Name
        </Label>
        <Input
          id="firstName"
          ref={firstNameInputRef}
          value={formData.firstName}
          onChange={e => handleChange("firstName", e.target.value)}
          placeholder="Enter first name"
          className="col-span-3"
          required
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="lastName" className="text-right">
          Last Name
        </Label>
        <Input
          id="lastName"
          value={formData.lastName}
          onChange={e => handleChange("lastName", e.target.value)}
          placeholder="Enter last name"
          className="col-span-3"
          required
        />
      </div>

      {/* Highlight: New Display Name input (optional for admin to set) */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="displayName" className="text-right">
          Display Name
        </Label>
        <Input
          id="displayName"
          value={formData.displayName}
          onChange={e => handleChange("displayName", e.target.value)}
          placeholder="Public display name"
          className="col-span-3"
        />
      </div>

      {/* Email */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="email" className="text-right">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={e => handleChange("email", e.target.value)}
          placeholder="example@email.com"
          className="col-span-3"
          required
        />
      </div>

      {/* Password */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="password" className="text-right">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={e => handleChange("password", e.target.value)}
          placeholder="At least 6 characters"
          className="col-span-3"
          required
          minLength={6}
        />
      </div>

      {/* Role */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="role" className="text-right">
          Role
        </Label>
        <Select value={formData.role} onValueChange={value => handleChange("role", value as UserRole)}>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Buttons */}
      <div className="flex justify-end items-center gap-4 pt-2">
        {onClose && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isLoading}>
            Cancel
          </Button>
        )}
        <SubmitButton isLoading={isLoading} loadingText="Creating..." className="min-w-[140px]">
          Create User
        </SubmitButton>
      </div>
    </form>
  );
}
