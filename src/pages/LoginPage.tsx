import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Flame, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const LoginPage = () => {
  const { login, signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const result = isSignup ? await signup(email, password) : await login(email, password);
    setLoading(false);
    if (result.error) setError(result.error);
    else if (isSignup) setMessage("Check your email to confirm your account.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl gradient-phoenix flex items-center justify-center mb-3 shadow-glow">
            <Flame className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl text-primary">PHOENIX</CardTitle>
          <CardDescription>Climate Execution Operating System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-success">{message}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSignup ? "Sign Up" : "Sign In"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {isSignup ? "Already have an account?" : "Need an account?"}{" "}
            <button onClick={() => { setIsSignup(!isSignup); setError(null); setMessage(null); }} className="text-accent font-medium hover:underline">
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
