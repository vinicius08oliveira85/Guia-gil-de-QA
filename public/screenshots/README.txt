Screenshots para o Web App Manifest (PWA / Chrome Web Store / vitrines)

1) Capture telas reais do app em produção (ou staging estável):
   - Desktop / wide: recomendado 1280×720 ou 1920×1080 (PNG).
   - Mobile / narrow: recomendado largura típica de telefone, ex. 750×1334 ou 390×844 (PNG).

2) Salve os arquivos nesta pasta, por exemplo:
   - wide.png   (dashboard ou lista de projetos)
   - narrow.png (mesmo fluxo em viewport estreito)

3) No public/manifest.json, acrescente o array "screenshots" no objeto raiz (irmão de "icons"), por exemplo:

   "screenshots": [
     {
       "src": "/screenshots/wide.png",
       "sizes": "1280x720",
       "type": "image/png",
       "form_factor": "wide",
       "label": "Dashboard de projetos"
     },
     {
       "src": "/screenshots/narrow.png",
       "sizes": "390x844",
       "type": "image/png",
       "form_factor": "narrow",
       "label": "Lista de projetos no celular"
     }
   ]

4) Ajuste "sizes" para coincidir com as dimensões reais de cada PNG.

5) Em DevTools → Application → Manifest, confira se as URLs resolvem (sem 404).

Obs.: Não commite capturas com dados sensíveis (nomes reais de clientes, e-mails, tokens).
