"use client";

import {
  Home,
  Image as ImageIcon,
  LogOut,
  Send,
  Tags,
  Users,
  X,
  Wifi,
  Settings,
  Shield,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFirstInstanceStatus } from "@/lib/useFirstInstanceStatus";
import { useState, useEffect } from "react";

const baseMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/enviar", label: "Enviar Mensagem", icon: Send },
  { href: "/contatos", label: "Contatos", icon: Users },
  { href: "/grupos", label: "Grupos", icon: Tags },
  { href: "/imagem", label: "Upload de Imagem", icon: ImageIcon },
  { href: "/instancias", label: "Instâncias WhatsApp", icon: Wifi },
  { href: "/settings/webhooks", label: "Webhooks", icon: Settings },
  { href: "/perfil", label: "Meu Perfil", icon: UserIcon },
];

const adminMenuItems = [
  { href: "/admin/users", label: "Gerenciar Usuários", icon: Shield },
];

interface UserData {
  nome: string;
  email: string;
  role: string;
}

export default function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
} = {}) {
  const pathname = usePathname();
  const { instance, loading } = useFirstInstanceStatus();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    // Buscar informações do usuário
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated) {
          setUser({
            nome: data.nome,
            email: data.email,
            role: data.role
          });
        }
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
      }
    };

    fetchUser();
  }, []);

  // Combinar menus base com menus de admin se o usuário for admin
  const menuItems = user?.role === "admin" 
    ? [...baseMenuItems, ...adminMenuItems] 
    : baseMenuItems;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Logout error - continue to login page
    } finally {
      window.location.replace("/login");
      onClose?.();
    }
  };

  const sidebarContent = (
    <div className="w-64 h-full relative flex flex-col bg-linear-to-b from-slate-900 via-slate-900 to-slate-950 text-white border-r border-indigo-900/30 shadow-2xl">
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={onClose ?? undefined}
        className="md:hidden absolute top-3 right-3 p-2 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X size={20} />
      </button>

      <div className="p-6 border-b border-indigo-900/20 bg-linear-to-r from-indigo-600/10 to-cyan-600/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-linear-to-br from-indigo-500 to-cyan-500 p-2.5 rounded-xl shadow-lg shadow-indigo-600/30">
            <Send size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Envio Express</h1>
          </div>
        </div>
        
        {/* Status WhatsApp */}
        <div className="mt-3 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${instance?.status === "online" ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
          />
          <span className="text-xs text-slate-400">
            {loading ? "Verificando..." : instance?.status === "online" ? "WhatsApp Online" : "WhatsApp Offline"}
          </span>
        </div>

        {/* Usuário Conectado */}
        {user && (
          <div className="mt-3 pt-3 border-t border-indigo-900/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-semibold shadow-lg">
                {user.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.nome}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 py-6 px-3 overflow-y-auto space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          const iconColors: Record<string, string> = {
            "/dashboard": "group-hover:text-blue-400 text-blue-300",
            "/enviar": "group-hover:text-indigo-400 text-indigo-300",
            "/contatos": "group-hover:text-cyan-400 text-cyan-300",
            "/grupos": "group-hover:text-emerald-400 text-emerald-300",
            "/imagem": "group-hover:text-amber-400 text-amber-300",
            "/perfil": "group-hover:text-teal-400 text-teal-300",
            "/admin/users": "group-hover:text-purple-400 text-purple-300",
          };

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose?.()}
              className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative ${isActive
                ? "bg-linear-to-r from-indigo-600/40 to-cyan-600/40 text-white shadow-lg shadow-indigo-600/20 border border-indigo-500/30"
                : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                }`}
            >
              <Icon size={20} className={`${iconColors[item.href] || ""} transition-colors`} />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && (
                <>
                  <div className="ml-auto w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-linear-to-b from-indigo-500 to-cyan-500 rounded-r" />
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-indigo-900/20 mt-auto bg-linear-to-r from-slate-800/30 to-slate-900/30 space-y-2">
        <button
          type="button"
          onClick={() => {
            handleLogout();
          }}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-300 hover:bg-red-600/20 hover:text-red-300 rounded-lg transition-all duration-200 group"
        >
          <LogOut size={20} className="group-hover:text-red-400" />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </div >
  );

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 h-screen">{sidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-black/50" onClick={onClose ?? undefined} aria-hidden="true" />
          <div className="relative">
            <div className="h-screen">{sidebarContent}</div>
          </div>
        </div>
      )}
    </>
  );
}
