"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Shield, Trash2, Clock, Edit2, Key } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { notifySuccess, notifyError } from "@/lib/notify";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  nome: string;
  email: string;
  role: string;
  createdAt: string;
  _count: {
    contacts: number;
    images: number;
    groups: number;
    templates: number;
    instances: number;
  };
}

interface CurrentUser {
  id: number;
  nome: string;
  email: string;
  role: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states - Create
  const [newNome, setNewNome] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");

  // Form states - Edit
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // Form states - Reset Password
  const [resetPassword, setResetPassword] = useState("");

  useEffect(() => {
    checkAuth();
    fetchUsers();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      
      if (!data.authenticated || data.role !== "admin") {
        notifyError("Acesso negado. Apenas administradores podem acessar esta página.");
        router.push("/dashboard");
        return;
      }

      setCurrentUser(data);
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      router.push("/login");
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/users");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar usuários");
      }

      setUsers(data.users);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      notifyError("Erro ao carregar lista de usuários");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      notifyError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: newNome,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar usuário");
      }

      notifySuccess("Usuário criado com sucesso!");
      setShowCreateModal(false);
      setNewNome("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("user");
      fetchUsers();
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const confirmMessage = `Tem certeza que deseja alterar o usuário para ${newRole}?`;

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar usuário");
      }

      notifySuccess("Role atualizada com sucesso!");
      fetchUsers();
    } catch (error: any) {
      notifyError(error.message);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditNome(user.nome);
    setEditEmail(user.email);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: editNome,
          email: editEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar usuário");
      }

      notifySuccess("Usuário atualizado com sucesso!");
      setShowEditModal(false);
      setSelectedUser(null);
      setEditNome("");
      setEditEmail("");
      fetchUsers();
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenPasswordModal = (user: User) => {
    setSelectedUser(user);
    setResetPassword("");
    setShowPasswordModal(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) return;

    if (resetPassword.length < 6) {
      notifyError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setIsResettingPassword(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: resetPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao resetar senha");
      }

      notifySuccess("Senha resetada com sucesso!");
      setShowPasswordModal(false);
      setSelectedUser(null);
      setResetPassword("");
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteUser = async (userId: number, nome: string) => {
    const confirmMessage = `Tem certeza que deseja DELETAR o usuário "${nome}"? Esta ação não pode ser desfeita e todos os dados do usuário serão removidos.`;

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao deletar usuário");
      }

      notifySuccess("Usuário deletado com sucesso!");
      fetchUsers();
    } catch (error: any) {
      notifyError(error.message);
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

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[var(--text)]">
              Gerenciar Usuários
            </h1>
            <p className="text-[var(--text-muted)]">
              Administração de contas do sistema
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <UserPlus size={18} />
          Criar Usuário
        </Button>
      </div>

      {/* Info Alert */}
      <Alert variant="info" className="mb-6">
        Total de usuários: {users.length}
      </Alert>

      {/* Users Grid */}
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-lg">
                  {user.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[var(--text)]">
                      {user.nome}
                    </h3>
                    <Badge variant={user.role === "admin" ? "success" : "default"}>
                      {user.role === "admin" ? (
                        <>
                          <Shield size={12} className="mr-1" />
                          Admin
                        </>
                      ) : (
                        "User"
                      )}
                    </Badge>
                    {currentUser?.id === user.id && (
                      <Badge variant="info">Você</Badge>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-[var(--text-muted)]">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                    <div>
                      Contatos: {user._count.contacts} | Grupos: {user._count.groups} | Imagens: {user._count.images}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {currentUser?.id !== user.id && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                    title="Editar usuário"
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenPasswordModal(user)}
                    title="Resetar senha"
                  >
                    <Key size={16} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggleRole(user.id, user.role)}
                  >
                    {user.role === "admin" ? "Tornar User" : "Tornar Admin"}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id, user.nome)}
                    title="Deletar usuário"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isCreating) {
              setShowCreateModal(false);
              setNewNome("");
              setNewEmail("");
              setNewPassword("");
              setNewRole("user");
            }
          }}
        >
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-indigo-200 animate-scale-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-cyan-500 p-6 relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <UserPlus size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Criar Novo Usuário
                  </h2>
                  <p className="text-indigo-100 text-sm">
                    Adicionar novo usuário ao sistema
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-5 bg-white">
              <Input
                id="nome"
                type="text"
                label="Nome"
                placeholder="Digite o nome completo"
                value={newNome}
                onChange={(e) => setNewNome(e.target.value)}
                required
                disabled={isCreating}
              />

              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="Digite o email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                disabled={isCreating}
              />

              <Input
                id="password"
                type="password"
                label="Senha"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isCreating}
                helperText="Use uma senha forte para maior segurança"
              />

              <div className="relative">
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Tipo de Usuário
                </label>
                <div className="relative">
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    disabled={isCreating}
                    className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-50 to-cyan-50 border-2 border-indigo-200 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer font-medium"
                  >
                    <option value="user">👤 User - Usuário padrão</option>
                    <option value="admin">🛡️ Admin - Administrador</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600">
                    ▼
                  </div>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                  <span className="text-indigo-600">ℹ️</span>
                  Admins podem gerenciar usuários e acessar todas as funcionalidades
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-5 border-t border-indigo-100">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewNome("");
                    setNewEmail("");
                    setNewPassword("");
                    setNewRole("user");
                  }}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 shadow-lg shadow-indigo-500/30"
                  isLoading={isCreating}
                >
                  {isCreating ? "Criando..." : "Criar Usuário"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isUpdating) {
              setShowEditModal(false);
              setSelectedUser(null);
            }
          }}
        >
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-blue-200 animate-scale-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Edit2 size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Editar Usuário
                  </h2>
                  <p className="text-blue-100 text-sm">
                    Atualizar dados de {selectedUser.nome}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdateUser} className="p-6 space-y-5 bg-white">
              <Input
                id="edit-nome"
                type="text"
                label="Nome"
                placeholder="Digite o nome completo"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                required
                disabled={isUpdating}
              />

              <Input
                id="edit-email"
                type="email"
                label="Email"
                placeholder="Digite o email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
                disabled={isUpdating}
              />

              {/* Modal Footer */}
              <div className="flex gap-3 pt-5 border-t border-blue-100">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  disabled={isUpdating}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg shadow-blue-500/30"
                  isLoading={isUpdating}
                >
                  {isUpdating ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && selectedUser && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isResettingPassword) {
              setShowPasswordModal(false);
              setSelectedUser(null);
            }
          }}
        >
          <div className="bg-gradient-to-br from-slate-50 to-orange-50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-orange-200 animate-scale-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-500 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Key size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Resetar Senha
                  </h2>
                  <p className="text-orange-100 text-sm">
                    Definir nova senha para {selectedUser.nome}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleResetPassword} className="p-6 space-y-5 bg-white">
              <Alert variant="warning" className="mb-4">
                O usuário precisará usar esta nova senha no próximo login.
              </Alert>

              <Input
                id="reset-password"
                type="password"
                label="Nova Senha"
                placeholder="Mínimo 6 caracteres"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                required
                disabled={isResettingPassword}
                helperText="Defina uma senha temporária para o usuário"
              />

              {/* Modal Footer */}
              <div className="flex gap-3 pt-5 border-t border-orange-100">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUser(null);
                  }}
                  disabled={isResettingPassword}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 shadow-lg shadow-orange-500/30"
                  isLoading={isResettingPassword}
                >
                  {isResettingPassword ? "Resetando..." : "Resetar Senha"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

