#!/usr/bin/env node
// Regenera o bloco anti-flash de tema/paleta em src/index.html a partir da
// MESMA lista de paletas usada em app.config.ts (shell-palette.config.ts) —
// fonte única, sem lista duplicada mantida à mão. Ver a mesma solução (e o
// porquê de reimplementar em vez de importar `bandeira-shell`) no
// vitality-front, CLAUDE.md, seção "Decisões de arquitetura".
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const { PALETAS, DEFAULT_PALETTE_ID } = await import(
  pathToFileURL(join(root, 'src/app/shell-palette.config.ts')).href
);

function generateAntiFlashScript(paletteIds, defaultPaletteId) {
  return `<script>
      (function () {
        try {
          var t = localStorage.getItem('theme');
          if (!t) t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', t);

          var validPalettes = ${JSON.stringify(paletteIds)};
          var p = localStorage.getItem('palette');
          if (validPalettes.indexOf(p) === -1) p = ${JSON.stringify(defaultPaletteId)};
          document.documentElement.setAttribute('data-palette', p);
        } catch (e) {}
      })();
    </script>`;
}

const script = generateAntiFlashScript(
  PALETAS.map((p) => p.id),
  DEFAULT_PALETTE_ID
);

const indexPath = join(root, 'src/index.html');
const html = readFileSync(indexPath, 'utf8');

const START = '<!-- ANTI_FLASH_START -->';
const END = '<!-- ANTI_FLASH_END -->';
const startIdx = html.indexOf(START);
const endIdx = html.indexOf(END);

if (startIdx === -1 || endIdx === -1) {
  console.error(
    `[sync-index-html] marcadores ${START}/${END} não encontrados em src/index.html — nada foi alterado.`
  );
  process.exit(1);
}

const novoHtml =
  html.slice(0, startIdx) + START + '\n    ' + script + '\n    ' + END + html.slice(endIdx + END.length);

if (novoHtml === html) {
  console.log('[sync-index-html] já sincronizado, nada mudou.');
} else {
  writeFileSync(indexPath, novoHtml);
  console.log('[sync-index-html] bloco anti-flash regenerado a partir de shell-palette.config.ts.');
}
