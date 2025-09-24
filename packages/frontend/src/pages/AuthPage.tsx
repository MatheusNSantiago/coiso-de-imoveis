import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AuthForm = ({
  isLogin,
  onSubmit,
  loading,
  error,
}: {
  isLogin: boolean;
  onSubmit: (formData: any) => void;
  loading: boolean;
  error: string | null;
}) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    onSubmit({ email, password });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
        </CardTitle>
        <CardDescription>
          {isLogin
            ? "Acesse para encontrar seu próximo lar."
            : "Preencha os dados para começar."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processando..." : isLogin ? "Entrar" : "Criar conta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const AuthPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuthAction = async ({ email, password }: any) => {
    setLoading(true);
    setError(null);

    // Tentativa de login primeiro
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      // Se o login falhar, pode ser um novo usuário, então tentamos o registro
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
      } else if (signUpData.user) {
        navigate("/"); // Sucesso no registro
      }
    } else if (signInData.user) {
      navigate("/"); // Sucesso no login
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Entrar</TabsTrigger>
          <TabsTrigger value="register">Criar Conta</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <AuthForm
            isLogin={true}
            onSubmit={handleAuthAction}
            loading={loading}
            error={error}
          />
        </TabsContent>
        <TabsContent value="register">
          <AuthForm
            isLogin={false}
            onSubmit={handleAuthAction}
            loading={loading}
            error={error}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthPage;
