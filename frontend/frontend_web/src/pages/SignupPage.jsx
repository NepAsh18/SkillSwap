/**
 * pages/SignupPage.jsx
 *
 * Registration form. register() always returns a PreAuthResponse — no real
 * tokens are issued at registration time. Opens OtpVerificationModal; on
 * successful verification, useOtpFlow redirects straight into the app.
 */

import { useOutletContext }    from "react-router-dom";
import { useForm }            from "react-hook-form";
import { motion }             from "framer-motion";
import toast                  from "react-hot-toast";
import FloatingLabelInput     from "../components/ui/FloatingLabelInput";
import PasswordInput          from "../components/ui/PasswordInput";
import GoogleIcon             from "../components/ui/GoogleIcon";
import OtpVerificationModal   from "../components/auth/OtpVerificationModal";
import { register as apiRegister, resendOtp } from "../api/authService";
import { VALIDATION }         from "../constants/validation";
import { getFriendlyAuthError } from "../utils/authErrorMessages";
import { useOtpFlow } from "../hooks/useOtpFlow";

const SUBMIT_LABEL = {
  idle:    "Create account",
  loading: "Creating account…",
  success: "✓ Account created!",
  error:   "Fix errors above",
};

const SUBMIT_CLASS = {
  idle:    "bg-gray-900 hover:bg-gray-700",
  loading: "bg-gray-500 cursor-not-allowed",
  success: "bg-emerald-600",
  error:   "bg-red-500",
};

export default function SignupPage() {
  const { fieldProps, triggerSubmit, submitState, onSwitch } = useOutletContext();
  const otpFlow = useOtpFlow();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: "onBlur" });

  const nameReg  = register("name",     VALIDATION.name);
  const emailReg = register("email",    VALIDATION.email);
  const pwReg    = register("password", VALIDATION.password);

  async function onValid({ name, email, password }) {
    await triggerSubmit(async () => {
      try {
        const data = await apiRegister({ name, email, password });

        toast(data.message || "Enter the verification code we emailed you.");
        otpFlow.open({
          preAuthToken: data.preAuthToken,
          expiresInSeconds: data.expiresInSeconds,
          message: data.message,
          resend: () => resendOtp({ preAuthToken: data.preAuthToken }),
        });
      } catch (err) {
        toast.error(getFriendlyAuthError(err));
        throw err;
      }
    });
  }

  return (
    <>
      <div className="flex justify-end mb-6 text-xl font-bold text-gray-900 tracking-tight">
        ✦
      </div>

      <h1 className="text-[22px] font-bold text-gray-900 mb-1 leading-tight">
        Create account
      </h1>
      <p className="text-sm text-gray-400 mb-7">Start your journey today</p>

      <form onSubmit={handleSubmit(onValid)} noValidate className="flex flex-col gap-4">

        <FloatingLabelInput
          label="Full name"
          type="text"
          error={errors.name?.message}
          {...nameReg}
          onFocus={(e) => { fieldProps("name").onFocus(e); }}
          onBlur={(e)  => { nameReg.onBlur(e); fieldProps("name").onBlur(e); }}
        />

        <FloatingLabelInput
          label="Email"
          type="email"
          error={errors.email?.message}
          {...emailReg}
          onFocus={(e) => { fieldProps("email").onFocus(e); }}
          onBlur={(e)  => { emailReg.onBlur(e); fieldProps("email").onBlur(e); }}
        />

        <PasswordInput
          error={errors.password?.message}
          {...pwReg}
          onFocus={(e) => { fieldProps("password").onFocus(e); }}
          onBlur={(e)  => { pwReg.onBlur(e); fieldProps("password").onBlur(e); }}
        />

        <p className="text-xs text-gray-400 leading-relaxed">
          By signing up you agree to our{" "}
          <button type="button" className="font-medium text-gray-600 hover:underline">Terms of Service</button>
          {" "}and{" "}
          <button type="button" className="font-medium text-gray-600 hover:underline">Privacy Policy</button>.
        </p>

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

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-300 font-medium">or</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <button
          type="button"
          className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 active:scale-[0.98]"
        >
          <GoogleIcon />
          Sign up with Google
        </button>
      </form>

      <p className="mt-7 text-center text-xs text-gray-400">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-semibold text-gray-800 hover:text-brand-600 transition-colors"
        >
          Log in
        </button>
      </p>

      <OtpVerificationModal {...otpFlow.modalProps} />
    </>
  );
}