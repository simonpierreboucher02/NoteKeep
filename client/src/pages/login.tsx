import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, recoverySchema } from "@shared/schema";
import type { LoginRequest, RecoveryRequest } from "@shared/schema";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState("");
  const { login, recover } = useAuth();
  const { toast } = useToast();

  const loginForm = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const recoveryForm = useForm<RecoveryRequest>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { username: "", recoveryKey: "", newPassword: "" },
  });

  const onLogin = async (data: LoginRequest) => {
    try {
      await login(data.username, data.password);
      toast({ title: "Login successful" });
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    }
  };

  const onRecover = async (data: RecoveryRequest) => {
    try {
      await recover(data.username, data.recoveryKey, data.newPassword);
      toast({ title: "Password reset successful" });
    } catch (error) {
      toast({
        title: "Recovery failed",
        description: "Invalid username or recovery key",
        variant: "destructive",
      });
    }
  };

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
          <CardTitle className="text-lg sm:text-xl">Welcome Back</CardTitle>
          <CardDescription className="text-sm">
            Sign in to your privacy-first notes manager
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="login" data-testid="tab-login" className="text-sm">Sign In</TabsTrigger>
              <TabsTrigger value="recover" data-testid="tab-recover" className="text-sm">Recover</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    data-testid="input-username"
                    {...loginForm.register("username")}
                    placeholder="Enter your username"
                  />
                  {loginForm.formState.errors.username && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.username.message}
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
                      {...loginForm.register("password")}
                      placeholder="Enter your password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loginForm.formState.isSubmitting}
                  data-testid="button-login"
                >
                  {loginForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              
              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:underline" data-testid="link-register">
                  Create one here
                </Link>
              </div>
            </TabsContent>
            
            <TabsContent value="recover" className="space-y-4">
              <form onSubmit={recoveryForm.handleSubmit(onRecover)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recover-username">Username</Label>
                  <Input
                    id="recover-username"
                    data-testid="input-recover-username"
                    {...recoveryForm.register("username")}
                    placeholder="Enter your username"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recovery-key">Recovery Key</Label>
                  <Textarea
                    id="recovery-key"
                    data-testid="input-recovery-key"
                    {...recoveryForm.register("recoveryKey")}
                    placeholder="Enter your recovery key"
                    className="min-h-[100px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    This was provided when you first registered
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    data-testid="input-new-password"
                    type="password"
                    {...recoveryForm.register("newPassword")}
                    placeholder="Enter new password"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={recoveryForm.formState.isSubmitting}
                  data-testid="button-recover"
                >
                  {recoveryForm.formState.isSubmitting ? "Recovering..." : "Reset Password"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
