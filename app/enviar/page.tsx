"use client";

import {
  CheckSquare,
  Image as ImageIcon,
  Loader2,
  Send,
  Upload,
  X,
} from "lucide-react";
// Usaremos <img> nativo para thumbnails (melhor compatibilidade com data URLs e URLs externas)
import { useEffect, useRef, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useToast } from "@/components/ToastProvider";
import type { Contact } from "@/lib/webhook";
import { sendMessage } from "@/lib/webhook";

export default function EnviarPage() {
  const toast = useToast();
  const [message, setMessage] = useState("");
  // mensagens-padrão (até 3) persistidas no servidor
  const [templates, setTemplates] = useState<Array<{ id: number; name: string; content: string }>>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [editingTemplateIndex, setEditingTemplateIndex] = useState<number | null>(null);
  const [templateDraft, setTemplateDraft] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [_imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [_imageUploading, setImageUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<
    Array<{ id: number; url: string; filename: string }>
  >([]);
  const [search, setSearch] = useState("");
  // Estados para grupos
  const [groups, setGroups] = useState<
    Array<{ id: number; nome: string; _count: { contacts: number } }>
  >([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [selectionMode, setSelectionMode] = useState<"individual" | "groups">(
    "individual",
  );

  const CONFIRM_THRESHOLD = Number(
    process.env.NEXT_PUBLIC_CONFIRM_THRESHOLD || 50,
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const pendingSendPayloadRef = useRef<null | {
    message: string;
    imageUrl?: string | null;
    contacts: Contact[];
    targetCount: number;
    groupIds?: number[];
  }>(null);

  // helper para tentar carregar a URL original e, em caso de erro, tentar decodeURIComponent antes de usar o ícone fallback
  const handleImageLoadError = (url: string | null) => (e: React.SyntheticEvent<HTMLImageElement>) => {
    const imgEl = e.currentTarget as HTMLImageElement;
    try {
      // evitar loop de tentativas
      if (imgEl.getAttribute("data-tried") === "1") {
        imgEl.src = "/file.svg";
        return;
      }
      imgEl.setAttribute("data-tried", "1");

      if (!url) {
        imgEl.src = "/file.svg";
        return;
      }

      try {
        const decoded = decodeURIComponent(url);
        // se decoded for diferente, tentar decoded, senão reusar url
        imgEl.src = decoded !== url ? decoded : url;
      } catch {
        imgEl.src = url;
      }
    } catch {
      try {
        imgEl.src = "/file.svg";
      } catch { }
    }
  };

  // buscar contatos do servidor
  useEffect(() => {
    let mounted = true;
    async function fetchContacts() {
      try {
        // trazer todos os contatos do usuário (até limite de 1000 da API) para que a lista mostre todos
        const res = await fetch("/api/contacts?limit=1000&page=1");
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          setContacts(data.contacts || []);
        }
      } catch (_err) {
        // ignore
      }
    }
    fetchContacts();
    return () => {
      mounted = false;
    };
  }, []);

  // buscar grupos do servidor
  useEffect(() => {
    let mounted = true;
    async function fetchGroups() {
      try {
        const res = await fetch("/api/groups/list", { credentials: "include" });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          setGroups(data.groups || []);
        }
      } catch (_err) {
        // ignore
      }
    }
    fetchGroups();
    return () => {
      mounted = false;
    };
  }, []);

  // persistir seleção localmente
  useEffect(() => {
    try {
      const raw = localStorage.getItem("selectedIds");
      if (raw) {
        const parsed = JSON.parse(raw) as number[];
        if (Array.isArray(parsed)) setSelectedIds(parsed);
      }
    } catch { }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("selectedIds", JSON.stringify(selectedIds));
    } catch { }
  }, [selectedIds]);

  useEffect(() => {
    try {
      const url = localStorage.getItem("selectedImageUrl");
      if (url) setImageUrl(url);
    } catch { }
  }, []);

  // carregar templates do servidor
  useEffect(() => {
    let mounted = true;
    async function fetchTemplates() {
      try {
        const res = await fetch("/api/message-templates");
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates || []);
        }
      } catch {
        // ignore fetch errors
      } finally {
        if (mounted) setTemplatesLoading(false);
      }
    }
    fetchTemplates();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddNewTemplate = () => {
    if (templates.length >= 3) {
      toast.showToast({ type: "error", message: "Limite de 3 mensagens-padrão atingido." });
      return;
    }
    setEditingTemplateIndex(templates.length);
    setTemplateName("");
    setTemplateDraft("");
  };

  const handleEditTemplate = (idx: number) => {
    const template = templates[idx];
    if (!template) return;
    setEditingTemplateIndex(idx);
    setEditingTemplateId(template.id);
    setTemplateName(template.name);
    setTemplateDraft(template.content);
  };

  const handleCancelEditTemplate = () => {
    setEditingTemplateIndex(null);
    setEditingTemplateId(null);
    setTemplateName("");
    setTemplateDraft("");
  };

  const handleSaveTemplate = async () => {
    const name = templateName.trim();
    const content = templateDraft.trim();
    if (!name) {
      toast.showToast({ type: "error", message: "Nome do template é obrigatório." });
      return;
    }
    if (!content) {
      toast.showToast({ type: "error", message: "Conteúdo do template é obrigatório." });
      return;
    }

    try {
      if (editingTemplateId !== null) {
        // Atualizar template existente
        const res = await fetch(`/api/message-templates/${editingTemplateId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, content }),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.showToast({ type: "error", message: data.error || "Erro ao salvar template" });
          return;
        }
        const data = await res.json();
        const updated = templates.map(t => t.id === editingTemplateId ? data.template : t);
        setTemplates(updated);
      } else {
        // Criar novo template
        const res = await fetch("/api/message-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, content }),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.showToast({ type: "error", message: data.error || "Erro ao salvar template" });
          return;
        }
        const data = await res.json();
        setTemplates([...templates, data.template]);
      }
      setEditingTemplateIndex(null);
      setEditingTemplateId(null);
      setTemplateName("");
      setTemplateDraft("");
      toast.showToast({ type: "success", message: "Template salvo." });
    } catch {
      toast.showToast({ type: "error", message: "Erro ao salvar template." });
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      const res = await fetch(`/api/message-templates/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.showToast({ type: "error", message: data.error || "Erro ao remover template" });
        return;
      }
      setTemplates(templates.filter(t => t.id !== id));
      toast.showToast({ type: "success", message: "Template removido." });
    } catch {
      toast.showToast({ type: "error", message: "Erro ao remover template." });
    }
  };

  const handleApplyTemplate = (id: number) => {
    const t = templates.find(t => t.id === id);
    if (!t) return;
    setMessage(t.content);
    toast.showToast({ type: "success", message: "Template aplicado à mensagem." });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // aceitar jpeg/jpg/png (inclui variações como image/jpg e image/pjpeg)
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/pjpeg",
    ];
    const hasValidType = allowedTypes.includes(file.type);
    const hasValidExt = /\.(jpe?g|png)$/i.test(file.name);
    if (!hasValidType || !hasValidExt) {
      toast.showToast({
        type: "error",
        message: "Formato não suportado. Envie apenas JPG, JPEG ou PNG.",
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      setImageUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/images/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.showToast({
          type: "error",
          message: data.error || "Erro ao enviar imagem",
        });
        setImageUrl(null);
      } else {
        setImageUrl(data.url);
        try {
          localStorage.setItem("selectedImageUrl", data.url);
        } catch { }
        toast.showToast({
          type: "success",
          message: "Imagem enviada com sucesso.",
        });
      }
    } catch (_err) {
      toast.showToast({ type: "error", message: "Erro ao enviar imagem." });
    } finally {
      setImageUploading(false);
    }
  };

  const openGallery = async () => {
    try {
      const res = await fetch("/api/images");
      if (!res.ok) return;
      const data = await res.json();
      setGalleryImages(data.images || []);
      setGalleryOpen(true);
    } catch { }
  };

  const selectGalleryImage = (url: string) => {
    setImageUrl(url);
    // Limpar preview quando selecionar da galeria
    setImagePreview(null);
    setImageFile(null);
    try {
      localStorage.setItem("selectedImageUrl", url);
    } catch { }
    setGalleryOpen(false);
    toast.showToast({ type: "success", message: "Imagem selecionada." });
  };

  const handleSelectAll = async () => {
    // buscar todos os contatos visíveis no servidor (até limite razoável)
    const q = search.trim();
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      // garantir que traga muitos resultados (API limita em 1000)
      params.set("limit", "1000");
      // sempre a primeira página para pegar todos
      params.set("page", "1");

      const res = await fetch(`/api/contacts?${params.toString()}`);
      if (!res.ok) {
        // fallback para seleção local (somente contatos carregados)
        const ids = contacts
          .map((c) => c.id)
          .filter(Boolean) as number[];
        setSelectedIds(ids);
        return;
      }

      const data = await res.json().catch(() => ({ contacts: [] }));
      const fetched: Array<{ id?: number; telefone?: string }> = data.contacts || [];
      const ids = fetched.map((c) => c.id).filter(Boolean) as number[];
      // atualizar lista local para mostrar todos os contatos retornados
      setContacts(fetched as Contact[]);
      setSelectedIds(ids);
    } catch (err) {
      // em caso de erro, selecionar apenas os contatos já carregados
      const ids = contacts.map((c) => c.id).filter(Boolean) as number[];
      setSelectedIds(ids);
    }
  };
  const handleClearSelection = () => setSelectedIds([]);

  const handleToggle = (id?: number) => {
    if (!id) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // Função para buscar contatos dos grupos selecionados
  const getContactsFromSelectedGroups = async (): Promise<Contact[]> => {
    if (selectedGroupIds.length === 0) return [];

    try {
      const promises = selectedGroupIds.map(async (groupId) => {
        const res = await fetch(`/api/groups/${groupId}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          return data.group.contacts.map(
            (gc: { contact: Contact }) => gc.contact,
          );
        }
        return [];
      });

      const results = await Promise.all(promises);
      const allContacts = results.flat();

      // Remover duplicatas baseado no telefone
      const unique = allContacts.filter(
        (contact, index, self) =>
          index === self.findIndex((c) => c.telefone === contact.telefone),
      );

      return unique;
    } catch (error) {
      console.error("Erro ao buscar contatos dos grupos:", error);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.showToast({
        type: "error",
        message: "Por favor, digite uma mensagem.",
      });
      return;
    }

    let selectedContacts: Contact[] = [];

    if (selectionMode === "individual") {
      selectedContacts = contacts.filter(
        (c) => c.id && selectedIds.includes(c.id),
      );
    } else if (selectionMode === "groups") {
      selectedContacts = await getContactsFromSelectedGroups();
    }

    if (selectedContacts.length === 0) {
      const message =
        selectionMode === "individual"
          ? "Selecione ao menos um contato."
          : "Selecione ao menos um grupo.";
      toast.showToast({ type: "error", message });
      return;
    }

    const targetCount = selectedContacts.length;
    pendingSendPayloadRef.current = {
      message,
      imageUrl,
      contacts: selectedContacts,
      targetCount,
    };
    if (selectionMode === "groups") {
      // preserve which groups were selected so server can send compact groupIds instead of full contacts
      pendingSendPayloadRef.current.groupIds = selectedGroupIds.slice();
    }

    if (targetCount >= CONFIRM_THRESHOLD) {
      setShowConfirm(true);
      return;
    }

    await performSend();
  };

  const performSend = async () => {
    const payload = pendingSendPayloadRef.current;
    if (!payload) return;
    setShowConfirm(false);
    setLoading(true);
    try {
      let result: { success: boolean; data?: unknown; error?: string } | undefined;
      if (Array.isArray(payload.groupIds) && payload.groupIds.length > 0) {
        result = await sendMessage(
          { message: payload.message, imageUrl: payload.imageUrl || undefined },
          { groupIds: payload.groupIds },
        );
      } else {
        result = await sendMessage(
          { message: payload.message, imageUrl: payload.imageUrl || undefined },
          { includeContacts: true, contacts: payload.contacts },
        );
      }
      if (result?.success) {
        toast.showToast({
          type: "success",
          message: `Mensagem enviada para ${payload.targetCount} contatos.`,
        });
        setMessage("");
        setImageFile(null);
        setImagePreview(null);
        setImageUrl(null);
        try {
          localStorage.removeItem("selectedImageUrl");
        } catch { }
      } else {
        toast.showToast({
          type: "error",
          message: result?.error || "Erro ao enviar mensagem.",
        });
      }
    } catch (_err) {
      toast.showToast({
        type: "error",
        message: "Erro ao enviar mensagem. Tente novamente.",
      });
    } finally {
      setLoading(false);
      pendingSendPayloadRef.current = null;
    }
  };

  // foco quando modal abrir
  useEffect(() => {
    if (showConfirm) confirmButtonRef.current?.focus();
  }, [showConfirm]);

  return (
    <ProtectedRoute>
      <main className="flex-1 bg-transparent min-h-screen p-4 sm:p-6">
        <div className="max-w-3xl mx-auto w-full px-2 sm:px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center sm:text-left">
            Enviar Mensagem
          </h1>

          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow card-border">
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Mensagem
              </label>
              {/* Mensagens-padrão */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700">Mensagens Padrão</div>
                  <div>
                    <button
                      type="button"
                      onClick={handleAddNewTemplate}
                      className="text-sm text-blue-600"
                    >
                      Adicionar (máx 3)
                    </button>
                  </div>
                </div>
                <div className="grid gap-2">
                  {templatesLoading && (
                    <div className="text-xs text-gray-500">Carregando templates...</div>
                  )}
                  {!templatesLoading && templates.length === 0 && (
                    <div className="text-xs text-gray-500">Nenhum template salvo.</div>
                  )}
                  {templates.map((t) => (
                    <div key={t.id} className="flex items-start gap-2 p-2 border rounded bg-gray-50">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{t.name}</div>
                        <div className="text-xs text-gray-600 break-words mt-1">{t.content}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button type="button" onClick={() => handleApplyTemplate(t.id)} className="text-sm text-green-600 hover:text-green-800">Usar</button>
                        <button type="button" onClick={() => handleEditTemplate(t.id)} className="text-sm text-blue-600 hover:text-blue-800">Editar</button>
                        <button type="button" onClick={() => handleDeleteTemplate(t.id)} className="text-sm text-red-600 hover:text-red-800">Remover</button>
                      </div>
                    </div>
                  ))}

                  {/* editor inline para novo/edição */}
                  {editingTemplateIndex !== null && (
                    <div className="mt-2 p-3 border rounded bg-blue-50">
                      <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="w-full px-3 py-2 border rounded mb-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                        placeholder="Nome do template..."
                      />
                      <textarea
                        rows={3}
                        value={templateDraft}
                        onChange={(e) => setTemplateDraft(e.target.value)}
                        className="w-full px-3 py-2 border rounded resize-vertical focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                        placeholder="Digite o conteúdo do template..."
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <button type="button" onClick={handleSaveTemplate} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Salvar</button>
                        <button type="button" onClick={handleCancelEditTemplate} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full min-h-40 px-3 py-2 border rounded resize-vertical focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                placeholder="Digite sua mensagem aqui..."
                required
              />
              <div className="mt-2 text-sm text-gray-500">
                {message.length} caracteres
              </div>
            </div>

            {/* Seção de seleção de modo */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow card-border">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">
                Selecionar Destinatários
              </h2>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="selectionMode"
                    value="individual"
                    checked={selectionMode === "individual"}
                    onChange={(e) =>
                      setSelectionMode(
                        e.target.value as "individual" | "groups",
                      )
                    }
                    className="text-blue-600"
                  />
                  <span className="text-sm">Contatos individuais</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="selectionMode"
                    value="groups"
                    checked={selectionMode === "groups"}
                    onChange={(e) =>
                      setSelectionMode(
                        e.target.value as "individual" | "groups",
                      )
                    }
                    className="text-blue-600"
                  />
                  <span className="text-sm">Grupos</span>
                </label>
              </div>
            </div>

            {/* Seção de contatos individuais */}
            {selectionMode === "individual" && (
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow card-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
                  <h2 className="text-sm font-semibold text-gray-800">
                    Contatos
                  </h2>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="search"
                      placeholder="Buscar por nome ou telefone"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded w-full"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-sm text-blue-600 flex items-center gap-2"
                      >
                        <CheckSquare size={14} />
                        <span>Selecionar visíveis</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="text-sm text-gray-600 flex items-center gap-2"
                      >
                        <X size={14} />
                        <span>Limpar</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Conteador mostrando total vs filtrados */}
                {contacts.length === 0 ? (
                  <div className="text-xs text-gray-600 mb-3">
                    Nenhum contato disponível. Importe contatos na página de
                    Contatos.
                  </div>
                ) : (
                  <div className="text-xs text-gray-600 mb-3">
                    {contacts.length} contatos •{" "}
                    {
                      contacts.filter((c) => {
                        const q = search.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          (c.nome || "").toLowerCase().includes(q) ||
                          (c.telefone || "").toLowerCase().includes(q)
                        );
                      }).length
                    }{" "}
                    visíveis • {selectedIds.length} selecionados
                  </div>
                )}

                <div className="overflow-auto max-h-64 border rounded">
                  {contacts.length === 0
                    ? null
                    : (() => {
                      const q = search.trim().toLowerCase();
                      const filtered = q
                        ? contacts.filter((c) => {
                          const nome = (c.nome || "").toLowerCase();
                          const telefone = (c.telefone || "").toLowerCase();
                          return nome.includes(q) || telefone.includes(q);
                        })
                        : contacts;
                      if (filtered.length === 0) {
                        return (
                          <div className="p-4 text-sm text-gray-500">
                            Nenhum contato corresponde à busca.
                          </div>
                        );
                      }
                      return (
                        <ul className="divide-y">
                          {filtered.map((c) => (
                            <li
                              key={c.id ?? c.telefone}
                              className="p-2 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={
                                    !!(c.id && selectedIds.includes(c.id))
                                  }
                                  onChange={() => handleToggle(c.id)}
                                  className="h-4 w-4 accent-blue-600"
                                />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {c.nome || c.telefone}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {c.telefone}
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      );
                    })()}
                </div>
              </div>
            )}

            {/* Seção de grupos */}
            {selectionMode === "groups" && (
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow card-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
                  <h2 className="text-sm font-semibold text-gray-800">
                    Grupos
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedGroupIds(groups.map((g) => g.id))
                      }
                      className="text-sm text-blue-600 flex items-center gap-2"
                    >
                      <CheckSquare size={14} />
                      <span>Selecionar todos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedGroupIds([])}
                      className="text-sm text-gray-600 flex items-center gap-2"
                    >
                      <X size={14} />
                      <span>Limpar</span>
                    </button>
                  </div>
                </div>

                {groups.length === 0 ? (
                  <div className="text-xs text-gray-600 mb-3">
                    Nenhum grupo disponível. Crie grupos na página de Grupos.
                  </div>
                ) : (
                  <div className="text-xs text-gray-600 mb-3">
                    {groups.length} grupos • {selectedGroupIds.length}{" "}
                    selecionados •{" "}
                    {groups
                      .filter((g) => selectedGroupIds.includes(g.id))
                      .reduce((total, g) => total + g._count.contacts, 0)}{" "}
                    contatos no total
                  </div>
                )}

                <div className="overflow-auto max-h-64 border rounded">
                  {groups.length === 0 ? null : (
                    <ul className="divide-y">
                      {groups.map((group) => (
                        <li
                          key={group.id}
                          className="p-2 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedGroupIds.includes(group.id)}
                              onChange={() => {
                                setSelectedGroupIds((prev) =>
                                  prev.includes(group.id)
                                    ? prev.filter((id) => id !== group.id)
                                    : [...prev, group.id],
                                );
                              }}
                              className="h-4 w-4 accent-blue-600"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {group.nome}
                              </div>
                              <div className="text-xs text-gray-600">
                                {group._count.contacts} contatos
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow card-border">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-gray-800">
                  Imagem (opcional)
                </div>
                <div className="text-xs text-gray-500">JPG, JPEG ou PNG</div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50"
                >
                  <Upload size={16} />
                  <span className="text-sm">Enviar imagem</span>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png,image/jpg,image/pjpeg"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={openGallery}
                  className="px-3 py-2 border rounded text-sm flex items-center gap-2"
                >
                  <ImageIcon size={16} />
                  <span>Abrir galeria</span>
                </button>

                {/* Mostrar apenas uma imagem: preview tem prioridade sobre imageUrl */}
                {(imagePreview || imageUrl) && (
                  <div className="flex items-center gap-3">
                    <div className="relative rounded overflow-hidden border w-24 h-24 sm:w-28 sm:h-28 bg-white p-1 flex items-center justify-center">
                      <img
                        src={imagePreview || imageUrl || ""}
                        alt={imagePreview ? "Preview da imagem" : "Imagem selecionada"}
                        className="w-full h-full object-contain"
                        onError={imagePreview ? (e) => {
                          try {
                            (e.currentTarget as HTMLImageElement).src = "/file.svg";
                          } catch { }
                        } : handleImageLoadError(imageUrl)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        setImageUrl(null);
                        try {
                          localStorage.removeItem("selectedImageUrl");
                        } catch { }
                      }}
                      className="px-2 py-1 border rounded text-sm flex items-center gap-2"
                    >
                      <X size={14} />
                      <span>Remover</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                aria-disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Enviar Mensagem
                  </>
                )}
              </button>
            </div>
          </form>

          {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div
                role="dialog"
                aria-modal="true"
                className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 mx-4"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirmar envio
                </h2>
                <p className="text-sm text-gray-700 mb-4">
                  Você está prestes a enviar a mensagem para um grande número de
                  contatos. Deseja continuar?
                </p>
                <div className="flex items-center gap-4 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirm(false);
                      pendingSendPayloadRef.current = null;
                    }}
                    className="px-4 py-2 rounded bg-gray-100 text-gray-800 hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    ref={confirmButtonRef}
                    type="button"
                    onClick={() => performSend()}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Confirmar e Enviar
                  </button>
                </div>
              </div>
            </div>
          )}

          {galleryOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-[var(--panel)] p-4 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--text)]">
                    Selecionar Imagem
                  </h3>
                  <button
                    type="button"
                    onClick={() => setGalleryOpen(false)}
                    className="btn"
                  >
                    Fechar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {galleryImages.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => selectGalleryImage(img.url)}
                      className="block w-full border rounded overflow-hidden bg-white p-3 flex items-center justify-center shadow-sm"
                    >
                      <div className="w-full aspect-square rounded min-h-[120px] flex items-center justify-center overflow-hidden">
                        <img
                          src={img.url}
                          alt={img.filename}
                          className="w-full h-full object-contain"
                          onError={handleImageLoadError(img.url)}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
