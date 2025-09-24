import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const { user } = useAuth();

  // Se o usuário não estiver logado, redireciona para a página de login
  if (!user) {
    return <Navigate to="/auth" />;
  }

  // Se estiver logado, renderiza o conteúdo da rota filha
  return <Outlet />;
};

export default ProtectedRoute;
