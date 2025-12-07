import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { Contact } from "./webhook";

export function exportToCSV(contacts: Contact[], filename = "contatos.csv") {
  const csv = Papa.unparse(contacts);
  downloadFile(csv, filename, "text/csv");
}

export function exportToExcel(contacts: Contact[], filename = "contatos.xlsx") {
  const ws = XLSX.utils.json_to_sheet(contacts);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Contatos");
  XLSX.writeFile(wb, filename);
}

export function importFromCSV(file: File): Promise<Contact[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const firstLine = text.split(/\r?\n/)[0] || "";
        // detectar delimitador: preferir ponto-e-vírgula quando presente
        const delimiter =
          firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";

        // primeiro tentativa: header=true (colunas nome/telefone/contato)
        const parsed = Papa.parse<Record<string, string>>(text, {
          header: true,
          delimiter,
          skipEmptyLines: true,
        });

        const hasUsefulHeader = (parsed.meta.fields || []).some((f) => {
          const k = (f || "").toLowerCase();
          return (
            k === "nome" || k === "telefone" || k === "contato" || k === "email"
          );
        });

        let contacts: Contact[] = [];

        if (hasUsefulHeader) {
          contacts = (parsed.data as unknown[])
            .map((row) => {
              if (typeof row !== "object" || row === null)
                return { nome: "", telefone: "" };
              const keys = Object.keys(row).reduce((acc, key) => {
                acc[key.toLowerCase()] = (row as Record<string, string>)[key];
                return acc;
              }, {} as Record<string, string>);
              return {
                nome: keys.nome || "",
                telefone: keys.contato || keys.telefone || "",
              } as Contact;
            })
            .filter((r) => r.nome && r.telefone);

          resolve(contacts);
          return;
        }

        // se não encontrou cabeçalho útil, tentar parse como CSV sem cabeçalho
        const parsedNoHeader = Papa.parse<string[]>(text, {
          header: false,
          delimiter,
          skipEmptyLines: true,
        });

        contacts = (parsedNoHeader.data as unknown[])
          .map((row) => {
            if (!Array.isArray(row)) return { nome: "", telefone: "" };
            const nome = (row[0] || "").toString().trim();
            const telefone = (row[1] || "").toString().trim();
            return { nome, telefone } as Contact;
          })
          .filter((r) => r.nome && r.telefone);

        resolve(contacts);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo CSV"));
    reader.readAsText(file, "utf-8");
  });
}

export function importFromExcel(file: File): Promise<Contact[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        // Normaliza as chaves para minúsculas e aceita 'contato' ou 'telefone'
        const contacts = (jsonData as unknown[])
          .map((row) => {
            if (typeof row !== "object" || row === null)
              return { nome: "", telefone: "" };
            const keys = Object.keys(row).reduce((acc, key) => {
              acc[key.toLowerCase()] = (row as Record<string, string>)[key];
              return acc;
            }, {} as Record<string, string>);
            return {
              nome: keys.nome || "",
              telefone: keys.contato || keys.telefone || "",
            };
          })
          .filter((row) => row.nome && row.telefone);
        resolve(contacts);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsArrayBuffer(file);
  });
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
