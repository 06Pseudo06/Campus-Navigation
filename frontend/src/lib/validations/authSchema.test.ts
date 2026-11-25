import { describe, it, expect } from "vitest";
import {
  loginSchema,
  signupSchema,
  formatZodErrors,
} from "./authSchema";

describe("loginSchema", () => {
  it("fails when email and password are empty", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "",
      rememberMe: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      expect(errors.email).toBe("Email address is required.");
      expect(errors.password).toBe("Password is required.");
    }
  });

  it("fails on invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "password123",
      rememberMe: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      expect(errors.email).toBe("Please enter a valid email address.");
      expect(errors.password).toBeUndefined();
    }
  });

  it("fails when password is shorter than 6 characters", () => {
    const result = loginSchema.safeParse({
      email: "student@campus.edu",
      password: "12345",
      rememberMe: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      expect(errors.password).toBe("Password must be at least 6 characters.");
      expect(errors.email).toBeUndefined();
    }
  });

  it("succeeds on valid login input", () => {
    const result = loginSchema.safeParse({
      email: "student@campus.edu",
      password: "password123",
      rememberMe: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("student@campus.edu");
      expect(result.data.password).toBe("password123");
      expect(result.data.rememberMe).toBe(true);
    }
  });
});

describe("signupSchema", () => {
  it("fails when full name is empty", () => {
    const result = signupSchema.safeParse({
      fullName: "   ",
      email: "student@campus.edu",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      expect(errors.fullName).toBe("Full name is required.");
    }
  });

  it("fails on invalid email format", () => {
    const result = signupSchema.safeParse({
      fullName: "Jane Doe",
      email: "not-an-email",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      expect(errors.email).toBe("Please enter a valid email address.");
    }
  });

  it("fails when password is shorter than 8 characters", () => {
    const result = signupSchema.safeParse({
      fullName: "Jane Doe",
      email: "student@campus.edu",
      password: "pass1",
      confirmPassword: "pass1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      expect(errors.password).toBe("Password must be at least 8 characters.");
    }
  });

  it("fails when confirm password is empty", () => {
    const result = signupSchema.safeParse({
      fullName: "Jane Doe",
      email: "student@campus.edu",
      password: "password123",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      expect(errors.confirmPassword).toBe("Confirm password is required.");
    }
  });

  it("fails when confirm password does not match password", () => {
    const result = signupSchema.safeParse({
      fullName: "Jane Doe",
      email: "student@campus.edu",
      password: "password123",
      confirmPassword: "differentPassword123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      expect(errors.confirmPassword).toBe("Passwords do not match.");
    }
  });

  it("succeeds on valid signup input", () => {
    const result = signupSchema.safeParse({
      fullName: "Jane Doe",
      email: "student@campus.edu",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe("Jane Doe");
      expect(result.data.email).toBe("student@campus.edu");
      expect(result.data.password).toBe("password123");
      expect(result.data.confirmPassword).toBe("password123");
    }
  });
});
