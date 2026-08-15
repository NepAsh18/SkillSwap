/**
 * pages/LoginPage.jsx
 *
 * Login form. Reads shared animation/submit context from AuthLayout
 * via useOutletContext(). Uses react-hook-form + VALIDATION rules.
 * Calls AuthService.login() and notifies user via react-hot-toast.
 *
 * Field: identity (email or username — matches Spring LoginRequest.identity)
 * Field: password
 */

import { useOutletContext }      from "react-router-dom";
import { useForm }               from "react-hook-form";
import { motion }                from "framer-motion";
import toast                     from "react-hot-toast";
import FloatingLabelInput        from "../components/ui/FloatingLabelInput";
import PasswordInput             from "../components/ui/PasswordInput";
import GoogleIcon                from "../components/ui/GoogleIcon";
import { login }                 from "../api/authService";
import { VALIDATION }            from "../constants/validation";
import { useNavigate } from "react-router-dom";

// Submit button label map
const SUBMIT_LABEL = {
  idle:    "Log in",
  loading: "Logging in…",
  success: "✓ Logged in!",
  error:   "Try again",
};

const SUBMIT_CLASS = {
  idle:    "bg-gray-900 hover:bg-gray-700",
  loading: "bg-gray-500 cursor-not-allowed",
  success: "bg-emerald-600",
  error:   "bg-red-500",
};

export default function LoginPage() {
  const navigate = useNavigate();

  const { fieldProps, triggerSubmit, submitState, onSwitch } = useOutletContext();
  const redirectAfterLogin = (primaryRole) => {
    
   switch (primaryRole) {
    case "ROLE_ADMIN":
      navigate("/admin/dashboard", { replace: true });
      break;

    case "ROLE_COMMITTEE":
      navigate("/committee/dashboard", { replace: true });
      break;

      case "ROLE_USER":
      navigate("/dynamicpage", { replace: true });
      break;

    default:
      navigate("/", { replace: true });
  }
};

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: "onBlur" });

  const identityReg = register("identity", VALIDATION.identity);
  const pwReg       = register("password", VALIDATION.password);

  async function onValid({ identity, password }) {
  await triggerSubmit(async () => {
    try {
      const data = await login({ identity, password });
      
      // 1. Store the backend's accessToken (matching your DTO field name)
      if (data.accessToken) {
        localStorage.setItem('token', data.accessToken);
      }
      if (data.user?.id) {
  localStorage.setItem("userId", data.user.id);
}

      
      // 2. Safely extract and store the user's role string
      // Your UserMapper converts Set<Role> to a ProfileResponse role property
      const primaryRole = Array.isArray(data.user?.roles) 
        ? data.user.roles[0] 
        : data.user?.role || "";

      if (primaryRole) {
        localStorage.setItem('role', primaryRole);
      }

      toast.success(`Welcome back, ${data.user?.name ?? identity}!`);
      
      setTimeout(() => {
        redirectAfterLogin(primaryRole);
      }, 800);

    } catch (err) {
      toast.error(err.message ?? "Login failed. Please try again.");
      throw err; 
    }
  });
}
  return (
    <>
      {/* ── Logo mark ── */}
      <div className="flex justify-end mb-6 text-xl font-bold text-gray-900 tracking-tight">
        ✦
      </div>

      {/* ── Heading ── */}
      <h1 className="text-[22px] font-bold text-gray-900 mb-1 leading-tight">
        Welcome back!
      </h1>
      <p className="text-sm text-gray-400 mb-7">Please enter your details</p>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit(onValid)} noValidate className="flex flex-col gap-4">

        {/* Identity (email or username) */}
        <FloatingLabelInput
          label="Email or username"
          type="text"
          error={errors.identity?.message}
          {...identityReg}
          onFocus={(e) => { fieldProps("email").onFocus(e); }}
          onBlur={(e)  => { identityReg.onBlur(e); fieldProps("email").onBlur(e); }}
        />

        {/* Password */}
        <PasswordInput
          error={errors.password?.message}
          {...pwReg}
          onFocus={(e) => { fieldProps("password").onFocus(e); }}
          onBlur={(e)  => { pwReg.onBlur(e); fieldProps("password").onBlur(e); }}
        />

        {/* Remember + Forgot row */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded border-gray-300 accent-brand-500"
            />
            Remember for 30 days
          </label>
          <button
            type="button"
            className="font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={submitState === "loading"}
          whileTap={{ scale: 0.97 }}
          className={[
            "w-full rounded-xl py-3 text-sm font-semibold text-white",
            "transition-all duration-200",
            SUBMIT_CLASS[submitState] ?? SUBMIT_CLASS.idle,
          ].join(" ")}
        >
          {SUBMIT_LABEL[submitState]}
        </motion.button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-300 font-medium">or</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Google */}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 active:scale-[0.98]"
        >
          <GoogleIcon />
          Log in with Google
        </button>
      </form>

      {/* ── Switch to Signup ── */}
      <p className="mt-7 text-center text-xs text-gray-400">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-semibold text-gray-800 hover:text-brand-600 transition-colors"
        >
          Sign up
        </button>
      </p>
    </>
  );
}