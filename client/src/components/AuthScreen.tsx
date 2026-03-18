import React, { useState, type FormEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card.js";
import { Input } from "./ui/input.js";
import { Label } from "./ui/label.js";
import { Button } from "./ui/button.js";

type Mode = "login" | "register";

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface AuthScreenProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  serverError: string | null;
  isLoading: boolean;
}

function validate(
  mode: Mode,
  fields: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  },
): FormErrors {
  const errors: FormErrors = {};

  if (!fields.username.trim()) {
    errors.username = "Username is required";
  } else if (!/^[a-zA-Z0-9_-]{3,64}$/.test(fields.username)) {
    errors.username =
      "3–64 characters: letters, numbers, hyphens, underscores";
  }

  if (mode === "register") {
    if (!fields.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      errors.email = "Enter a valid email address";
    }
  }

  if (!fields.password) {
    errors.password = "Password is required";
  } else if (fields.password.length < 8) {
    errors.password = "Must be at least 8 characters";
  }

  if (mode === "register") {
    if (!fields.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (fields.password !== fields.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
  }

  return errors;
}

export function AuthScreen({
  onLogin,
  onRegister,
  serverError,
  isLoading,
}: AuthScreenProps): React.JSX.Element {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    setSubmitted(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);

    const formErrors = validate(mode, {
      username,
      email,
      password,
      confirmPassword,
    });
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    if (mode === "login") {
      await onLogin(username, password);
    } else {
      await onRegister(username, email, password);
    }
  }

  const hasError = (field: keyof FormErrors) => submitted && errors[field];

  return (
    <div className="dark fixed inset-0 z-50 flex items-center justify-center bg-[var(--vm-neutral-950)] overflow-hidden">
      {/* Animated starfield background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="stars-layer stars-sm" />
        <div className="stars-layer stars-md" />
        <div className="stars-layer stars-lg" />
      </div>

      {/* Radial glow behind card */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[var(--vm-primary)] opacity-[0.06] blur-[120px]" />

      <Card className="relative z-10 w-full max-w-md border-[var(--vm-glass-border)] bg-[var(--vm-glass-bg)] backdrop-blur-[var(--vm-glass-blur)] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="items-center text-center">
          {/* Branding */}
          <div className="mb-2 flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--vm-primary)] shadow-lg shadow-[var(--vm-primary)]/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6 text-white"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3L2 12l10 9 10-9L12 3z"
                />
                <circle cx={12} cy={12} r={3} />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--vm-neutral-white)]">
              Void Market
            </h1>
          </div>
          <CardTitle className="text-lg text-[var(--vm-neutral-300)]">
            {mode === "login" ? "Welcome back, Commander" : "Register your callsign"}
          </CardTitle>
          <CardDescription className="text-[var(--vm-neutral-500)]">
            {mode === "login"
              ? "Enter your credentials to resume command"
              : "Create an account to join the galaxy"}
          </CardDescription>
        </CardHeader>

        {/* Mode toggle */}
        <div className="mx-6 flex rounded-lg bg-[var(--vm-neutral-900)] p-1">
          <button
            type="button"
            onClick={() => { switchMode("login"); }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all duration-200 ${
              mode === "login"
                ? "bg-[var(--vm-primary)] text-white shadow-sm"
                : "text-[var(--vm-neutral-400)] hover:text-[var(--vm-neutral-300)]"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { switchMode("register"); }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all duration-200 ${
              mode === "register"
                ? "bg-[var(--vm-primary)] text-white shadow-sm"
                : "text-[var(--vm-neutral-400)] hover:text-[var(--vm-neutral-300)]"
            }`}
          >
            Register
          </button>
        </div>

        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            {/* Server error */}
            {serverError && (
              <div className="rounded-md border border-[var(--vm-danger)]/30 bg-[var(--vm-danger)]/10 px-3 py-2 text-sm text-[var(--vm-danger)]">
                {serverError}
              </div>
            )}

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="auth-username" className="text-[var(--vm-neutral-300)]">
                Username
              </Label>
              <Input
                id="auth-username"
                type="text"
                placeholder="commander_jane"
                autoComplete="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); }}
                aria-invalid={!!hasError("username")}
                className="border-[var(--vm-neutral-700)] bg-[var(--vm-neutral-900)] text-[var(--vm-neutral-white)] placeholder:text-[var(--vm-neutral-600)] focus-visible:border-[var(--vm-primary)] focus-visible:ring-[var(--vm-primary)]/30"
              />
              {hasError("username") && (
                <p className="text-xs text-[var(--vm-danger)]">{errors.username}</p>
              )}
            </div>

            {/* Email (register only) */}
            {mode === "register" && (
              <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label htmlFor="auth-email" className="text-[var(--vm-neutral-300)]">
                  Email
                </Label>
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="jane@federation.io"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); }}
                  aria-invalid={!!hasError("email")}
                  className="border-[var(--vm-neutral-700)] bg-[var(--vm-neutral-900)] text-[var(--vm-neutral-white)] placeholder:text-[var(--vm-neutral-600)] focus-visible:border-[var(--vm-primary)] focus-visible:ring-[var(--vm-primary)]/30"
                />
                {hasError("email") && (
                  <p className="text-xs text-[var(--vm-danger)]">{errors.email}</p>
                )}
              </div>
            )}

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="auth-password" className="text-[var(--vm-neutral-300)]">
                Password
              </Label>
              <Input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); }}
                aria-invalid={!!hasError("password")}
                className="border-[var(--vm-neutral-700)] bg-[var(--vm-neutral-900)] text-[var(--vm-neutral-white)] placeholder:text-[var(--vm-neutral-600)] focus-visible:border-[var(--vm-primary)] focus-visible:ring-[var(--vm-primary)]/30"
              />
              {hasError("password") && (
                <p className="text-xs text-[var(--vm-danger)]">{errors.password}</p>
              )}
            </div>

            {/* Confirm password (register only) */}
            {mode === "register" && (
              <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label htmlFor="auth-confirm" className="text-[var(--vm-neutral-300)]">
                  Confirm Password
                </Label>
                <Input
                  id="auth-confirm"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); }}
                  aria-invalid={!!hasError("confirmPassword")}
                  className="border-[var(--vm-neutral-700)] bg-[var(--vm-neutral-900)] text-[var(--vm-neutral-white)] placeholder:text-[var(--vm-neutral-600)] focus-visible:border-[var(--vm-primary)] focus-visible:ring-[var(--vm-primary)]/30"
                />
                {hasError("confirmPassword") && (
                  <p className="text-xs text-[var(--vm-danger)]">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="mt-2 h-11 bg-[var(--vm-primary)] text-white hover:bg-[var(--vm-primary-dark)] disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx={12}
                      cy={12}
                      r={10}
                      stroke="currentColor"
                      strokeWidth={4}
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {mode === "login" ? "Authenticating…" : "Creating account…"}
                </span>
              ) : mode === "login" ? (
                "Launch into the Void"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Starfield CSS */}
      <style>{`
        .stars-layer {
          position: absolute;
          inset: 0;
          background-repeat: repeat;
        }
        .stars-sm {
          background-image: radial-gradient(1px 1px at 50px 120px, rgba(255,255,255,0.6), transparent),
                            radial-gradient(1px 1px at 180px 80px, rgba(255,255,255,0.5), transparent),
                            radial-gradient(1px 1px at 320px 200px, rgba(255,255,255,0.4), transparent),
                            radial-gradient(1px 1px at 440px 30px, rgba(255,255,255,0.5), transparent),
                            radial-gradient(1px 1px at 90px 280px, rgba(255,255,255,0.3), transparent),
                            radial-gradient(1px 1px at 550px 150px, rgba(255,255,255,0.4), transparent);
          background-size: 600px 350px;
          animation: drift 90s linear infinite;
        }
        .stars-md {
          background-image: radial-gradient(1.5px 1.5px at 100px 60px, rgba(255,255,255,0.5), transparent),
                            radial-gradient(1.5px 1.5px at 350px 240px, rgba(255,255,255,0.4), transparent),
                            radial-gradient(1.5px 1.5px at 500px 100px, rgba(255,255,255,0.3), transparent),
                            radial-gradient(1.5px 1.5px at 220px 310px, rgba(255,255,255,0.4), transparent);
          background-size: 700px 400px;
          animation: drift 120s linear infinite reverse;
        }
        .stars-lg {
          background-image: radial-gradient(2px 2px at 250px 180px, rgba(139,92,246,0.6), transparent),
                            radial-gradient(2px 2px at 480px 50px, rgba(167,139,250,0.4), transparent),
                            radial-gradient(2px 2px at 70px 300px, rgba(255,255,255,0.5), transparent);
          background-size: 800px 450px;
          animation: drift 150s linear infinite, twinkle 4s ease-in-out infinite alternate;
        }
        @keyframes drift {
          from { transform: translateY(0); }
          to   { transform: translateY(-350px); }
        }
        @keyframes twinkle {
          from { opacity: 0.4; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
