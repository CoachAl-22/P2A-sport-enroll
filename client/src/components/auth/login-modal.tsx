import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email, mobile, or user ID is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Login only. Public sign up was removed with the enrolment engine (2026-08-03):
// enrolment happens in SportsBiz and Setmore now, so a parent account buys them
// nothing. Login stays for admin and coaches, and for the athlete portal.
export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isSendingReset, setIsSendingReset] = useState(false);
  const { toast } = useToast();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: false,
    },
  });

  const handleForgotPassword = async () => {
    const identifier = loginForm.getValues("identifier")?.trim();
    if (!identifier) {
      toast({
        title: "Enter your email first",
        description: "Type your email, mobile or user ID in the field above, then tap Forgot password.",
      });
      return;
    }
    setIsSendingReset(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier }),
      });
      toast({
        title: "Check your email",
        description: "If an account exists, we've sent a password reset link. It expires in 1 hour.",
      });
    } catch {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleLogin = async (data: LoginForm) => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", data);
      const result = await response.json();

      // Clear cache and refetch auth state
      queryClient.clear();
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });

      toast({
        title: "Success",
        description: "Welcome back to Power2ADAPT!",
      });
      onClose();

      // Admins and coaches go to the admin backend. Everyone else lands on the
      // homepage: the parent dashboard went with the enrolment engine.
      const role = result?.user?.role;
      const destination = role === "admin" || role === "coach" ? "/admin" : "/";
      setTimeout(() => {
        window.location.href = destination;
      }, 500);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full p-6">
        <DialogHeader className="flex flex-row justify-between items-center mb-6">
          <DialogTitle className="text-2xl font-heading font-bold text-gray-900">
            Welcome Back to Power2ADAPT
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </Button>
        </DialogHeader>

        <div className="mb-4 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800">
          <p className="font-semibold mb-1">💡 How to log in</p>
          <ul className="space-y-0.5 text-blue-700 text-xs list-none">
            <li>📧 Use the <strong>email address</strong> you registered with</li>
            <li>📱 Or your <strong>mobile number</strong> (e.g. 0412 345 678)</li>
            <li>🔑 Plus the password you created when you signed up</li>
          </ul>
          <p className="mt-2 text-xs text-blue-600">Not sure? Contact us and we'll look you up.</p>
        </div>

        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
          <div>
            <Label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
              Email or Mobile Number
            </Label>
            <Input
              id="identifier"
              placeholder="e.g. jane@email.com or 0412 345 678"
              {...loginForm.register("identifier")}
              className="w-full"
            />
            {loginForm.formState.errors.identifier && (
              <p className="text-red-500 text-sm mt-1">
                {loginForm.formState.errors.identifier.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...loginForm.register("password")}
              className="w-full"
            />
            {loginForm.formState.errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {loginForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <Checkbox {...loginForm.register("rememberMe")} />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <Button
              type="button"
              variant="link"
              onClick={handleForgotPassword}
              disabled={isSendingReset}
              className="text-sm text-primary-500 hover:text-primary-700"
            >
              {isSendingReset ? "Sending..." : "Forgot password?"}
            </Button>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary-500 hover:bg-primary-600 text-white"
            disabled={loginForm.formState.isSubmitting}
          >
            {loginForm.formState.isSubmitting ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
