"use client";

import { useState, useEffect } from "react";
import { User as UserIcon, Lock, Mail, Edit2, Shield, Save, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { notifySuccess, notifyError } from "@/lib/notify";

interface UserData {
  id: number;
  nome: string;
  email: string;
  role: string;
  createdAt?: string;
}

export default function PerfilPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Form states - Perfil
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // Form states - Senha
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (data.authenticated) {
        const userData = {
          id: data.id,
          nome: data.nome,
          email: data.email,
          role: data.role,
        };
        setUser(userData);
        setEditNome(data.nome);
        setEditEmail(data.email);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      notifyError("Erro ao carregar dados do perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editNome || !editEmail) {
      notifyError("Nome e email são obrigatórios");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: editNome,
          email: editEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar perfil");
      }

      notifySuccess("Perfil atualizado com sucesso!");
      setUser(data.user);
      setIsEditingProfile(false);
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setEditNome(user?.nome || "");
    setEditEmail(user?.email || "");
    setIsEditingProfile(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      notifyError("As senhas não correspondem");
      return;
    }

    if (newPassword.length < 6) {
      notifyError("A nova senha deve ter no mínimo 6 caracteres");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao alterar senha");
      }

      notifySuccess("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-[var(--text-muted)]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="error">Erro ao carregar dados do usuário</Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
          <UserIcon size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Meu Perfil</h1>
          <p className="text-[var(--text-muted)]">
            Gerencie suas informações pessoais
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Informações Pessoais */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--text)]">
              Informações Pessoais
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant={user.role === "admin" ? "success" : "info"}>
                {user.role === "admin" ? (
                  <>
                    <Shield size={12} className="mr-1" />
                    Administrador
                  </>
                ) : (
                  "Usuário"
                )}
              </Badge>
              {!isEditingProfile && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditingProfile(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 size={14} />
                  Editar
                </Button>
              )}
            </div>
          </div>

          {!isEditingProfile ? (
            <div className="space-y-4">
              {/* Avatar e Nome */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {user.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)] font-medium">
                    Nome Completo
                  </p>
                  <p className="text-lg font-bold text-[var(--text)]">
                    {user.nome}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-1">
                  <Mail size={16} className="text-[var(--text-muted)]" />
                  <p className="text-sm text-[var(--text-muted)] font-medium">
                    Email
                  </p>
                </div>
                <p className="text-[var(--text)] font-medium">{user.email}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <Input
                id="nome"
                type="text"
                label="Nome Completo"
                placeholder="Digite seu nome"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                required
                disabled={isUpdatingProfile}
              />

              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="Digite seu email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
                disabled={isUpdatingProfile}
                helperText="Usado para fazer login no sistema"
              />

              <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelEdit}
                  disabled={isUpdatingProfile}
                  className="flex-1 md:flex-none"
                >
                  <X size={16} />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isUpdatingProfile}
                  className="flex-1 md:flex-none"
                >
                  <Save size={16} />
                  {isUpdatingProfile ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Alterar Senha */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Lock size={20} className="text-[var(--text)]" />
            <h2 className="text-xl font-bold text-[var(--text)]">
              Alterar Senha
            </h2>
          </div>

          <Alert variant="info" className="mb-6">
            Por segurança, você precisa informar sua senha atual para definir
            uma nova senha.
          </Alert>

          <form onSubmit={handleChangePassword} className="space-y-5">
            <Input
              id="current-password"
              type="password"
              label="Senha Atual"
              placeholder="Digite sua senha atual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={isChangingPassword}
            />

            <Input
              id="new-password"
              type="password"
              label="Nova Senha"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isChangingPassword}
              helperText="Escolha uma senha forte"
            />

            <Input
              id="confirm-password"
              type="password"
              label="Confirmar Nova Senha"
              placeholder="Digite a nova senha novamente"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isChangingPassword}
            />

            <div className="pt-4 border-t border-[var(--border)]">
              <Button
                type="submit"
                variant="primary"
                className="w-full md:w-auto"
                isLoading={isChangingPassword}
              >
                {isChangingPassword ? "Alterando..." : "Alterar Senha"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

