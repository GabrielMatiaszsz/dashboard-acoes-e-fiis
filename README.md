# GERENCIADOR DE FIIs — Dashboard de Ativos

<img width="1903" height="873" alt="Captura de tela 2025-08-25 091211" src="https://github.com/user-attachments/assets/0e7bd154-361e-4f36-a61c-2ab158ddab6e" />


## 🚀 Visão geral

Este projeto oferece um **dashboard de ativos** com busca por ticker, exploração por categorias via *drawer*, gráficos de preço (linha, barra, pontos) e listagem de dividendos. O tema aplica **fundo azul** sólido, **contraste alto**, e **blur azul** apenas quando o *drawer* está aberto.

### Principais destaques

* 🎨 **Tema Rico** (azul‑marinho + laranja) com variáveis em CSS.
* 📈 **Gráficos Recharts** (linha, barra e scatter), todos com mesma cor clara e **tooltip legível**.
* 🧭 **Datas em formato brasileiro (DD/MM/AAAA)** no tooltip e **dd/MM** no eixo X.
* 🔍 **Busca por ticker** com sugestões (por volume) e seletor com textos brancos.
* 📚 **Explorar Ativos** (drawer) com filtros: tipo, setor, ordenação e paginação.
* 💰 Painel de **dividendos** recente do ativo selecionado.
* 📱 **Responsivo** (mobile‑first) com *breakpoints* em 1024px, 640px e 380px.
* ♿ Ajustes de contraste, foco e *hover* coerentes com o tema.

---

## 🧩 Tecnologias

* **React** (Vite ou CRA; o código está pronto para Vite).
* **TypeScript**.
* **Recharts** para gráficos.
* **BRAPI** (serviços `listAssets`, `getQuoteHistory`, `getDividends`).

---

## 📁 Estrutura de pastas (sugerida)

```text
src/
  components/
    AssetsBrowserDrawer.tsx
    ChartSwitcher.tsx
    TickerPicker.tsx
    charts/
      PriceLineChart.tsx
      PriceBarChart.tsx
      PriceScatterChart.tsx
  services/
    brapi.ts
  styles/
    dashboard.css
    rico-theme.css
  pages/
    Dashboard.tsx
main.tsx
index.html
```

---

## ⚙️ Como rodar

### Requisitos

* Node 18+
* PNPM ou NPM/Yarn

### Instalação

```bash
# com pnpm
pnpm install
# ou npm
yarn install
# ou npm
npm install
```

### Variáveis de ambiente (opcional)

Se sua BRAPI exigir *token*, crie `.env`:

```ini
VITE_BRAPI_BASE_URL=https://brapi.exemplo.com
VITE_BRAPI_TOKEN=seu_token
```

Consuma no `services/brapi.ts` via `import.meta.env.VITE_*`.

### Desenvolvimento

```bash
pnpm dev
# ou
npm run dev
```

### Build

```bash
pnpm build
# ou
npm run build
```

---

## 🎨 Tema e Estilo

O tema está centralizado em **`rico-theme.css`**.

### Variáveis principais

```css
:root{
  --bg: #070a2b;          /* fundo global (azul escuro) */
  --panel: #0c1038;       /* painéis/cards */
  --panel-2: #0f1445;     /* variação */
  --text: #eef1ff;        /* texto principal */
  --muted: #9aa3c0;       /* texto secundário */
  --border: rgba(255,255,255,.08);
  --primary: #ff5a24;     /* laranja */
  --up: #2bd887;          /* positivo */
  --down: #ff6b6b;        /* negativo */
  --chart-accent: #7EC8FF;/* cor clara para gráficos */
}
```

Aplique o **fundo azul** global no `body/#root`:

```css
html, body, #root { background: var(--bg); color: var(--text); height:100%; margin:0; }
```

### Drawer com blur **apenas quando aberto**

```css
.rico-theme .drawer-backdrop{background:transparent;backdrop-filter:none;}
.rico-theme.is-drawer-open .drawer-backdrop{
  background: rgba(3,5,20,.55);
  backdrop-filter: blur(6px) saturate(120%);
}
```

> Certifique-se de alternar a classe `is-drawer-open` no contêiner quando `open=true`.

### Selects estilizados

```css
.rico-theme select, .rico-theme select option{ color:#fff; background:var(--panel-2); }
.rico-theme select{ appearance:none; border:1px solid var(--border); border-radius:12px; padding:8px 36px 8px 12px; }
```

### Gráficos (Recharts)

* Mesma cor clara para **linha**, **barras** e **pontos** via `--chart-accent`.
* Tooltip estilizado no tema escuro e **label “Fechamento”** em vez de `close`.
* Datas **pt-BR**: eixo X em `dd/MM`; tooltip com `DD/MM/AAAA`.

---

## 🧱 Componentes

### `Dashboard.tsx`

* Reúne **filtros** (TickerPicker, período, tipo de gráfico e botão Explorar) numa única *segmented*.
* Renderiza **gráfico principal** e **painel de dividendos**.
* Abre o **AssetsBrowserDrawer**.

### `TickerPicker.tsx`

**Props**

* `value: string`
* `onChange: (ticker: string) => void`
* `type?: "stock" | "fund" | "bdr"`
* `placeholder?: string`

**Comportamento**

* *Debounce* de 250ms; sugestões por volume quando vazio.
* Dropdown com texto **branco** e mini logo do ativo.

### `AssetsBrowserDrawer.tsx`

**Props**

* `open: boolean`
* `onClose: () => void`
* `onPick: (ticker: string) => void`
* `defaultType?: "stock" | "fund" | "bdr"`

**Funcionalidades**

* Filtros: **tipo**, **setor**, **ordenação**, busca por ticker.
* Tabela responsiva com **paginações** e botão **Selecionar**.
* Quando `open=true` adiciona `is-drawer-open` no contêiner para ativar o **blur azul**.

### `ChartSwitcher.tsx`

**Props**

* `type: "line" | "bar" | "scatter"`
* `data: { date: string; close: number }[]`

**Notas**

* Converte datas para **pt-BR** antes de repassar aos gráficos.

### Gráficos

* **`PriceLineChart`** — Linha com tooltip `Fechamento` e eixo X visível com dias (dd/MM).
* **`PriceBarChart`** — Barras com mesma formatação.
* **`PriceScatterChart`** — Índice no eixo X (numérico) para manter ordem, legendas e tooltip coerentes.

---

## 🔌 Serviços (BRAPI)

Arquivo `services/brapi.ts` expõe utilitários:

* `listAssets({ search?, type?, sector?, sortBy?, sortOrder?, page?, limit? })` → lista ativos e metadados (setores, tipos, totalPages/Count).
* `getQuoteHistory(ticker, { range, interval })` → `{ meta, series }` para gráficos.
* `getDividends(ticker)` → lista de dividendos `{ label, paymentDate, rate, relatedTo }`.

> **Atenção:** verifique CORS e autenticação conforme sua instância/endpoint da BRAPI.

---

## 📱 Responsividade

**Mobile‑first**, com *breakpoints* em **1024px**, **640px** e **380px**.

* **≤1024px**: filtros podem quebrar em múltiplas linhas; conteúdo empilha.
* **≤640px**: paddings menores, tipografia reduzida, tabelas com *scroll* horizontal.
* **≤380px**: botões comprimem ainda mais.
* Drawer ocupa **100%** da largura no mobile.

Principais seletores (em `dashboard.css`):

```css
@media (max-width:1024px){ .segmented{flex-wrap:wrap} .dash__content{grid-template-columns:1fr} }
@media (max-width:640px){ .panel__head{padding:12px} .panel__body{padding:8px} }
@media (max-width:640px){ .rico-theme .drawer{width:100%!important} }
```

---

## ♿ Acessibilidade & UX

* Contraste elevado (texto branco sobre azul escuro).
* *Hover* e *focus* visíveis nos botões e inputs.
* Opções do `select` forçadas para **branco**.
* Tooltip com **fundo escuro** para leitura confortável.

---

## 🔧 Customizações comuns

* **Trocar cor dos gráficos:** altere `--chart-accent` no `:root`.
* **Trocar paleta:** ajuste `--bg`, `--panel`, `--primary` etc.
* **Desligar blur do drawer:** remova a classe `is-drawer-open` quando `open=false` (já implementado).
* **Mudar rótulo “Fechamento”:** altere `name` nas séries e o `formatter` do `Tooltip`.

---

## 🐞 Troubleshooting

* **Fundo continua branco:** garanta que `:root` define `--bg` e que `html, body, #root` usam `background: var(--bg)`; evite variáveis presas a `.rico-theme` no `body`.
* **Blur azul sempre ativo:** verifique se a classe `is-drawer-open` só é adicionada quando `open=true`.
* **Texto cinza em selects:** use o bloco `.rico-theme select, .rico-theme select option { color:#fff; }` ao final do CSS.
* **Datas no formato errado:** `ChartSwitcher` já converte; confirme que os dados `date` vêm como `YYYY-MM-DD`.
* **Tooltip ilegível:** confira os seletores `.recharts-default-tooltip` no `rico-theme.css`.

---

## 🗺️ Roadmap (sugestões)

* Cache local de buscas e histórico.
* Filtro por múltiplos tickers e comparação de séries.
* Exportação de gráfico (PNG/SVG) e dados (CSV).
* Testes unitários (Vitest/RTL) e *Storybook* para componentes.
* i18n (pt‑BR / en‑US) via `react-intl` ou `i18next`.

---

### Dúvidas?

Abra uma *issue* ou entre em contato. 🧡💙
