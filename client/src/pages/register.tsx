import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StickyNote, Copy, CheckCircle, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema } from "@shared/schema";
import type { InsertUser } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState("");
  const [keyStored, setKeyStored] = useState(false);
  const [recoveryCompleted, setRecoveryCompleted] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: InsertUser) => {
    try {
      const result = await register(data.username, data.password);
      setRecoveryKey(result.recoveryKey);
      toast({ title: "Registration successful" });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Username might already exist",
        variant: "destructive",
      });
    }
  };

  const copyRecoveryKey = () => {
    navigator.clipboard.writeText(recoveryKey);
    toast({ title: "Recovery key copied to clipboard" });
  };

  if (recoveryKey && !recoveryCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <StickyNote className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-semibold">NoteKeep</h1>
            </div>
            <CardTitle className="text-destructive">Important: Save Your Recovery Key</CardTitle>
            <CardDescription>
              This key is required to reset your password. Store it safely!
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert className="border-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>This recovery key will only be shown once.</strong> If you lose it, 
                you won't be able to recover your account.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label>Your Recovery Key</Label>
              <div className="relative">
                <Textarea
                  value={recoveryKey}
                  readOnly
                  className="font-mono text-sm bg-muted"
                  data-testid="text-recovery-key"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={copyRecoveryKey}
                  data-testid="button-copy-recovery-key"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keyStored}
                  onChange={(e) => setKeyStored(e.target.checked)}
                  className="rounded"
                  data-testid="checkbox-key-stored"
                />
                <span className="text-sm">
                  I have safely stored my recovery key and understand I cannot recover it later
                </span>
              </label>
            </div>
            
            <Button 
              className="w-full" 
              disabled={!keyStored}
              onClick={async () => {
                setRecoveryCompleted(true);
                // Wait for authentication state to refresh before navigating
                await queryClient.invalidateQueries({ queryKey: ['/api/me'] });
                // Redirect to dashboard using replace to prevent back navigation to register
                setLocation('/', { replace: true });
              }}
              data-testid="button-continue"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Continue to NoteKeep
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <StickyNote className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-xl sm:text-2xl font-semibold">NoteKeep</h1>
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
              MinimalAuth
            </span>
          </div>
          <CardTitle className="text-lg sm:text-xl">Create Your Account</CardTitle>
          <CardDescription className="text-sm">
            Just username + password. No email required.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                data-testid="input-username"
                {...form.register("username")}
                placeholder="Choose a username"
              />
              {form.formState.errors.username && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  data-testid="input-password"
                  type={showPassword ? "text" : "password"}
                  {...form.register("password")}
                  placeholder="Choose a strong password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-2 sm:px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You'll receive a one-time recovery key after registration. 
                Store it safely - it's the only way to reset your password.
              </AlertDescription>
            </Alert>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={form.formState.isSubmitting}
              data-testid="button-register"
            >
              {form.formState.isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          
          <div className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
