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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email, mobile, or user ID is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  email: z.string().email("Valid email is required"),
  mobile: z.string().min(10, "Valid mobile number is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState("login");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const { toast } = useToast();

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

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: false,
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      mobile: "",
      firstName: "",
      lastName: "",
      password: "",
    },
  });

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

      // Send the user to their dashboard: admins/coaches to the admin backend,
      // everyone else to their dashboard. (Full navigation also reloads session state.)
      const role = result?.user?.role;
      const destination = role === "admin" || role === "coach" ? "/admin" : "/dashboard";
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

  const handleRegister = async (data: RegisterForm) => {
    try {
      const response = await apiRequest("POST", "/api/auth/register", data);
      
      // Clear all queries and refetch auth state
      queryClient.clear();
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: "🎉 Congratulations!",
        description: "Your new account has been created successfully! Welcome to the team - where all athletes thrive. Let's get started on your athletic journey!",
      });
      onClose();
      
      // New accounts are parents — send them to their dashboard.
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full p-6">
        <DialogHeader className="flex flex-row justify-between items-center mb-6">
          <DialogTitle className="text-2xl font-heading font-bold text-gray-900">
            {activeTab === "login" ? "Welcome Back to Power2ADAPT" : "Start Your Athletic Journey"}
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
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
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="First name"
                    {...registerForm.register("firstName")}
                  />
                  {registerForm.formState.errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {registerForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Last name"
                    {...registerForm.register("lastName")}
                  />
                  {registerForm.formState.errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">
                      {registerForm.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  {...registerForm.register("email")}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </Label>
                <Input
                  id="mobile"
                  placeholder="0412 345 678"
                  {...registerForm.register("mobile")}
                />
                {registerForm.formState.errors.mobile && (
                  <p className="text-red-500 text-sm mt-1">
                    {registerForm.formState.errors.mobile.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="regPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="regPassword"
                    type={showRegPassword ? "text" : "password"}
                    placeholder="Create a password"
                    {...registerForm.register("password")}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                    aria-label={showRegPassword ? "Hide password" : "Show password"}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary-500 hover:bg-primary-600 text-white"
                disabled={registerForm.formState.isSubmitting}
              >
                {registerForm.formState.isSubmitting ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
