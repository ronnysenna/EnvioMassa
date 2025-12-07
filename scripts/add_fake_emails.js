const fs = require('fs');
const path = require('path');

// Caminhos
const inputPath = path.resolve(__dirname, '..', 'Disp For 6.csv');
const outputPath = path.resolve(__dirname, '..', 'Disp For 6.with_emails.csv');

// Ler arquivo
let raw = fs.readFileSync(inputPath, 'utf8');
let lines = raw.split(/\r?\n/);

// Remover cabeçalho original e criar novo cabeçalho consistente (uso de ponto-e-vírgula)
if (lines.length === 0) {
  console.error('Arquivo vazio');
  process.exit(1);
}
lines.shift(); // descarta a primeira linha (cabeçalho)

const normalizeName = (name) => {
  // Remove acentos
  let s = name.normalize('NFD').replace(/[00-\u036f]/g, '');
  s = s.replace(/[^\w\s]/g, ' '); // remove caracteres especiais
  s = s.replace(/\s+/g, ' ').trim().toLowerCase();
  return s;
};

const counts = Object.create(null);
const out = ['Nome;Telefone;Email'];

for (const rawLine of lines) {
  if (!rawLine || !rawLine.trim()) continue;

  const sep = rawLine.includes(';') ? ';' : (rawLine.includes(',') ? ',' : ';');
  const parts = rawLine.split(sep);
  const name = (parts[0] || '').trim();
  const phone = (parts[1] || '').trim();

  let local = normalizeName(name);
  const words = local.split(' ').filter(Boolean);

  if (words.length === 0) {
    local = 'usuario';
  } else if (words.length === 1) {
    local = words[0];
  } else {
    local = `${words[0]}.${words[words.length - 1]}`;
  }

  const base = local;
  counts[base] = (counts[base] || 0) + 1;
  if (counts[base] > 1) local = `${base}${counts[base]}`; // evita colisões

  const email = `${local}@exemplo.com.br`;
  out.push(`${name};${phone};${email}`);
}

fs.writeFileSync(outputPath, out.join('\n'), 'utf8');
console.log('Arquivo gerado:', outputPath);
