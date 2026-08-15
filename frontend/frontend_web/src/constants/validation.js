
export const VALIDATION = {
  name: {
    required: "Name is required",
    minLength: { value: 2, message: "At least 2 characters" },
    maxLength: { value: 60, message: "Name too long" },
  },
  email: {
    required: "Email is required",
    pattern: {
      value:   /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Enter a valid email address",
    },
  },
  password: {
    required: "Password is required",
    minLength: { value: 6, message: "At least 6 characters" },
  },
  identity: {
    required: "Email or username is required",
  },
};