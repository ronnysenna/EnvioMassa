"use client";

import { Edit2, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import EditContactModal from "@/components/EditContactModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useToast } from "@/components/ToastProvider";
import { importFromCSV, importFromExcel } from "@/lib/fileUtils";
import ConfirmModal from "@/components/ConfirmModal";
import type { Contact } from "@/lib/webhook";

export default function ContatosPage() {
  const { showToast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  // estados para adicionar contato manualmente
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualPhoneValid, setManualPhoneValid] = useState<boolean>(false);
  // Estados para modal de edição
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // seleção de contatos para exclusão em massa
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isConfirmBulkOpen, setIsConfirmBulkOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  // paginação
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(25);
  const [total, setTotal] = useState<number>(0);

  // normaliza removendo tudo que não for dígito
  const normalizePhone = (v: string) => v.replace(/\D/g, "");

  // formata número no padrão brasileiro enquanto o usuário digita
  const formatBRPhone = (digits: string) => {
    if (!digits) return "";
    const d = digits;
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10)
      return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    // 11+ digits (DDD + 9 digitos)
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
  };

  const handleManualPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = normalizePhone(raw);
    setManualPhone(formatBRPhone(digits));
    // válido se tiver 10 ou 11 dígitos (BR landline/mobile)
    setManualPhoneValid(digits.length === 10 || digits.length === 11);
  };

  // refs para evitar efeitos colaterais quando fetch ocorre
  const pageRef = useRef<number>(page);
  const perPageRef = useRef<number>(perPage);

  // sincroniza refs com o estado
  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  useEffect(() => {
    perPageRef.current = perPage;
  }, [perPage]);

  const fetchContacts = useCallback(
    async (query = "", pageArg?: number, limitArg?: number) => {
      console.debug("fetchContacts called", { query, pageArg, limitArg, pageRef: pageRef.current, perPageRef: perPageRef.current });
      try {
        setLoading(true);
        const pageToUse = pageArg ?? pageRef.current ?? 1;
        const limitToUse = limitArg ?? perPageRef.current ?? 25;
        const q = new URLSearchParams({
          search: query || "",
          page: String(pageToUse),
          limit: String(limitToUse),
        });

        const res = await fetch(`/api/contacts?${q.toString()}`, {
          credentials: "include",
        });

        if (!res.ok) {
          showToast({ type: "error", message: "Falha ao buscar contatos." });
          return;
        }

        const data = await res.json();
        // atualiza apenas os dados — não forçar alteração do estado de página/limit
        setContacts(data.contacts || []);
        // limpar seleção ao carregar nova lista
        setSelectedIds([]);
        setTotal(Number(data.total ?? 0));
      } catch (err) {
        console.error("fetchContacts error", err);
        showToast({ type: "error", message: "Erro ao carregar contatos." });
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    fetchContacts("", page, perPage);
  }, [fetchContacts, page, perPage]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      // ao mudar a pesquisa, voltar para a primeira página
      setPage(1);
      fetchContacts(search.trim(), 1, perPage);
    }, 300);
    return () => window.clearTimeout(id);
  }, [search, fetchContacts, perPage]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let importedContacts: Contact[] = [];
      const name = file.name.toLowerCase();

      if (name.endsWith(".csv")) {
        importedContacts = await importFromCSV(file);
      } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        importedContacts = await importFromExcel(file);
      } else {
        showToast({
          type: "error",
          message: "Formato não suportado. Use CSV ou XLSX.",
        });
        return;
      }

      if (importedContacts.length === 0) {
        showToast({
          type: "error",
          message: "Nenhum contato encontrado no arquivo.",
        });
        return;
      }

      const res = await fetch("/api/contacts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ contacts: importedContacts }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Import bulk failed", res.status, result);
        showToast({
          type: "error",
          message: result.error || "Falha ao persistir contatos.",
        });
        return;
      }

      await fetchContacts("", page, perPage);
      showToast({
        type: "success",
        message: `${result.inserted ?? 0} inseridos, ${result.updated ?? 0
          } atualizados${result.failed ? `, ${result.failed} falharam` : ""
          }.`,
      });
    } catch (err) {
      console.error("handleImport error", err);
      showToast({
        type: "error",
        message: "Erro ao importar contatos. Verifique o arquivo.",
      });
    }
  };

  const handleAddManual = async () => {
    const nome = manualName.trim();
    const telefone = normalizePhone(manualPhone.trim());
    if (!telefone) {
      showToast({ type: "error", message: "Telefone é obrigatório." });
      return;
    }
    if (!nome) {
      showToast({ type: "error", message: "Nome é obrigatório." });
      return;
    }
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nome, telefone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast({
          type: "error",
          message: data.error || "Falha ao adicionar contato.",
        });
        return;
      }
      showToast({ type: "success", message: "Contato adicionado." });
      setManualName("");
      setManualPhone("");
      fetchContacts("", page, perPage);
    } catch (err) {
      console.error("add manual contact", err);
      showToast({ type: "error", message: "Erro ao adicionar contato." });
    }
  };

  const handleClearManual = () => {
    setManualName("");
    setManualPhone("");
  };

  // Função para abrir modal de edição
  const handleEditClick = (contact: Contact) => {
    setEditingContact(contact);
    setIsEditModalOpen(true);
  };

  // Função para fechar modal de edição
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingContact(null);
  };

  // Função para salvar contato editado
  const handleSaveContact = async (updatedContact: Contact) => {
    try {
      const res = await fetch(`/api/contacts/${updatedContact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome: updatedContact.nome,
          telefone: updatedContact.telefone,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast({
          type: "error",
          message: data.error || "Falha ao editar contato.",
        });
        return;
      }

      showToast({ type: "success", message: "Contato editado com sucesso." });
      fetchContacts("", page, perPage);
    } catch (err) {
      console.error("Erro ao editar contato:", err);
      showToast({ type: "error", message: "Erro ao editar contato." });
    }
  };

  // Função para deletar contato
  const handleDeleteContact = async (contact: Contact) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja deletar o contato "${contact.nome}"?`,
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast({
          type: "error",
          message: data.error || "Falha ao deletar contato.",
        });
        return;
      }

      showToast({ type: "success", message: "Contato deletado com sucesso." });
      fetchContacts("", page, perPage);
    } catch (err) {
      console.error("Erro ao deletar contato:", err);
      showToast({ type: "error", message: "Erro ao deletar contato." });
    }
  };

  // seleção helpers
  const toggleSelect = (id?: number) => {
    if (typeof id !== 'number') return;
    setSelectedIds((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  const toggleSelectAll = () => {
    if (contacts.length === 0) return;
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
    } else {
      // usar apenas contatos com id definido
      const ids = contacts.map((c) => (typeof c.id === 'number' ? c.id : -1)).filter((i) => i !== -1);
      setSelectedIds(ids);
    }
  };

  const handleConfirmDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch('/api/contacts/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast({ type: 'error', message: data.error || 'Falha ao excluir contatos.' });
      } else {
        showToast({ type: 'success', message: `${data.deleted ?? 0} contatos excluídos.` });
      }
    } catch (err) {
      console.error('bulk delete', err);
      showToast({ type: 'error', message: 'Erro ao excluir contatos.' });
    } finally {
      setBulkLoading(false);
      setIsConfirmBulkOpen(false);
      fetchContacts('', page, perPage);
    }
  };

  // sincroniza refs quando estados mudam
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  return (
    <ProtectedRoute>
      <main className="flex-1 p-6 bg-transparent min-h-screen">
        <div className="max-w-4xl mx-auto w-full px-2 sm:px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Contatos
          </h1>

          {/* Import */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow card-border mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Upload size={20} />
              <div className="text-sm font-medium text-gray-800">
                Importar Contatos (CSV / XLSX)
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              O arquivo deve conter colunas como nome e telefone (email não é obrigatório).
            </p>

            <label
              htmlFor="contacts-file"
              className="cursor-pointer inline-block"
            >
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition text-center w-full">
                <div className="text-sm text-gray-700 font-semibold">
                  Clique para selecionar arquivo
                </div>
                <div className="text-xs text-gray-500">CSV ou XLSX</div>
              </div>
            </label>
            <input
              id="contacts-file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
          </div>

          {/* Add manual contact */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow card-border mb-6">
            <div className="text-sm font-medium text-gray-800 mb-3">
              Adicionar contato manualmente
            </div>
            <div className="space-y-3">
              {/* Primeira linha: Nome e Telefone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  id="manual-name"
                  placeholder="Nome completo"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  id="manual-phone"
                  placeholder="(85) 99999-9999"
                  value={manualPhone}
                  onChange={handleManualPhoneChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {/* email removed */}
            </div>
            <div className="mt-2">
              <div className="text-xs text-gray-500">
                Formato: (DD) 9XXXX-XXXX — válido com 10 ou 11 dígitos
              </div>
              {!manualPhoneValid && manualPhone.length > 0 && (
                <div className="text-xs text-red-600 mt-1">
                  Telefone inválido. Informe DDD + número (10 ou 11 dígitos).
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                id="manual-add"
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                type="button"
                onClick={handleAddManual}
                disabled={!manualPhoneValid || !manualName.trim()}
                aria-disabled={!manualPhoneValid || !manualName.trim()}
              >
                Adicionar Contato
              </button>
              <button
                id="manual-clear"
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
                type="button"
                onClick={handleClearManual}
              >
                Limpar Campos
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow card-border mb-6">
            <input
              type="search"
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Table */}
          {/* Toolbar: seleção e exclusão em massa */}
          <div className="flex items-center gap-3 mb-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={contacts.length > 0 && selectedIds.length === contacts.length}
                onChange={toggleSelectAll}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Selecionar todos</span>
            </label>

            <button
              type="button"
              disabled={selectedIds.length === 0 || loading}
              onClick={() => setIsConfirmBulkOpen(true)}
              className="px-3 py-1 text-sm rounded bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Excluir selecionados ({selectedIds.length})
            </button>
          </div>

          {/* Controle de limite por página */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 bg-white rounded-t-lg border-b border-gray-200">
            <div className="flex items-center gap-2">
              <label htmlFor="perPage-select" className="text-sm text-gray-600 whitespace-nowrap">Mostrar:</label>
              <select
                id="perPage-select"
                value={perPage}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setPerPage(v);
                  setPage(1);
                }}
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600 whitespace-nowrap">por página</span>
            </div>
            <div className="text-sm text-gray-600">
              {total === 0
                ? "0 contatos"
                : `${(page - 1) * perPage + 1} - ${Math.min(
                  total,
                  page * perPage,
                )} de ${total} contatos`}
            </div>
          </div>

          <div className="bg-white rounded-b-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Nome
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Telefone
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-sm text-gray-600 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          Carregando...
                        </div>
                      </td>
                    </tr>
                  ) : contacts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-sm text-gray-600 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-gray-400">📭</div>
                          <div>Nenhum contato encontrado</div>
                          {search && (
                            <div className="text-xs text-gray-500">
                              Tente uma busca diferente ou adicione um novo contato
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    contacts.map((c, i) => (
                      <tr
                        key={`${c.id ?? c.telefone ?? i}`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-900">
                          <div className="hidden md:block mb-1">
                            <input
                              type="checkbox"
                              checked={typeof c.id === 'number' ? selectedIds.includes(c.id) : false}
                              onChange={() => toggleSelect(c.id)}
                              className="w-4 h-4"
                            />
                          </div>
                          <div className="font-medium">{c.nome}</div>
                          <div className="md:hidden text-xs text-gray-500 mt-1">{c.telefone}</div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-700 font-mono">
                          {c.telefone}
                        </td>
                        {/* email removed */}
                        <td className="px-3 sm:px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditClick(c)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                              title="Editar contato"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteContact(c)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                              title="Deletar contato"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer de paginação */}
          <div className="bg-white rounded-b-lg border-t border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => {
                    const np = Math.max(1, page - 1);
                    console.debug("navigate previous", { from: page, to: np, perPage });
                    setPage(np);
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  ← Anterior
                </button>

                <div className="px-3 py-1.5 text-sm text-gray-700 bg-gray-50 rounded-md font-medium">
                  Página {page}
                </div>

                <button
                  type="button"
                  disabled={page * perPage >= total || loading}
                  onClick={() => {
                    const np = page + 1;
                    console.debug("navigate next", { from: page, to: np, perPage });
                    setPage(np);
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Próxima →
                </button>
              </div>

              <div className="text-sm text-gray-600">
                {Math.ceil(total / perPage)} página{Math.ceil(total / perPage) !== 1 ? 's' : ''} no total
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Edição */}
      <EditContactModal
        contact={editingContact}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveContact}
      />

      {/* Confirmação para exclusão em massa */}
      <ConfirmModal
        open={isConfirmBulkOpen}
        title={`Excluir ${selectedIds.length} contatos?`}
        description={`Esta ação irá excluir definitivamente ${selectedIds.length} contato(s). Deseja continuar?`}
        confirmLabel="Excluir selecionados"
        loading={bulkLoading}
        onCancel={() => setIsConfirmBulkOpen(false)}
        onConfirm={handleConfirmDeleteSelected}
      />
    </ProtectedRoute>
  );
}
