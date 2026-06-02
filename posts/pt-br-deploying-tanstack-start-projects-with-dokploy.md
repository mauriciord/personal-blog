---
title: Implantando Projetos Tanstack Start com Dokploy
slug: deploying-tanstack-start-projects-with-dokploy
locale: pt-BR
description: >-
  Implante projetos Tanstack Start com facilidade usando Dokploy: uma solução
  self-hosted econômica
tags:
  - projects
added: 2025-12-16T22:37:40.230Z
---

# Post do Blog

![](/assets/deploying-tanstack-start-projects-with-dokploy/u0ZLmBEs-clipboard.png)

# Implantando Projetos Tanstack Start com Dokploy

Este post é fortemente inspirado no [guia da NEXTY.DEV sobre implantação de projetos Next.js com Dokploy](https://nexty.dev/docs/start-project/dokploy). Embora a documentação deles traga um excelente passo a passo para aplicações Next.js, eu quis explorar como a mesma abordagem de implantação self-hosted poderia funcionar com o TanStack Start — o novo framework full-stack de React do ecossistema TanStack. Se você está procurando uma alternativa econômica a plataformas como Vercel ou Railway para seus projetos TanStack Start, o Dokploy oferece uma solução PaaS open source bastante interessante que roda na sua própria infraestrutura.

## O que é Dokploy

Dokploy é um PaaS self-hosted e open source (Platform as a Service) que serve como alternativa a serviços como Vercel, Netlify, Railway e Zeabur.

![](/assets/deploying-tanstack-start-projects-with-dokploy/i1Wxo9IU-clipboard.png)

## Configuração do Servidor e Instalação do Dokploy

### Comprar um Servidor

Para usar Dokploy, você precisa comprar seu próprio servidor. Se estiver em dúvida sobre qual provedor escolher, considere [hostinger](https://www.hostinger.com/). Para projetos iniciais, uma VPS de 2 núcleos e 8 GB é suficiente, custando apenas $6.49 por mês.

![](/assets/deploying-tanstack-start-projects-with-dokploy/jQmTzR2V-clipboard.png)

### Configurar o Servidor

Após o pagamento, conclua a configuração da VPS seguindo as instruções na tela. Depois de configurada, o painel mostrará que a VPS está em execução.

Em seguida, configure as regras de firewall. A Hostinger não vem com regras padrão de firewall, o que significa que todas as portas ficam abertas, trazendo riscos de segurança. Precisamos criar regras para permitir acesso às portas 22, 80, 443 e 3000.


![](/assets/deploying-tanstack-start-projects-with-dokploy/qJXxsy1D-clipboard.png)

![](/assets/deploying-tanstack-start-projects-with-dokploy/taU9gp4C-clipboard.png)

## Instalar o Dokploy

Abra o terminal da VPS

![](/assets/deploying-tanstack-start-projects-with-dokploy/TK9tLIzZ-clipboard.png)

Faça login na VPS via SSH e execute o comando de instalação do Dokploy:

```bash
curl -sSL https://dokploy.com/install.sh | sh
```

![](/assets/deploying-tanstack-start-projects-with-dokploy/ivSXWGQW-clipboard.png)

Depois que a instalação terminar, acesse o endereço mostrado na saída do comando para abrir o painel do Dokploy.

### Configurar o Dokploy

Depois de se registrar e fazer login, primeiro configure um domínio personalizado para o painel:

![](/assets/deploying-tanstack-start-projects-with-dokploy/E5dc4_rn-clipboard.png)

Depois adicione um registro DNS para esse domínio personalizado na sua plataforma de DNS (usando a CloudFlare como exemplo), selecione a resolução do tipo A e informe o IP do servidor.

![](/assets/deploying-tanstack-start-projects-with-dokploy/8FRa9vTw-clipboard.png)

Depois que o DNS propagar, você poderá acessar o painel do Dokploy por meio do domínio personalizado.

Por fim, conecte sua conta Git como mostrado abaixo:

## ![](/assets/deploying-tanstack-start-projects-with-dokploy/LdZ0pagx-clipboard.png)

## Implantação

O Dokploy oferece uma interface visual de implantação parecida com a do Vercel.

![](/assets/deploying-tanstack-start-projects-with-dokploy/Fv9Z4Cty-clipboard.png)
![](/assets/deploying-tanstack-start-projects-with-dokploy/B7MXcZLv-clipboard.png)
![](/assets/deploying-tanstack-start-projects-with-dokploy/VR8lhPo0-clipboard.png)

Entre na página do Service, defina o Provider selecionando, em sequência, Github Account, Repository e Branch, e então **clique em Save**.

![](/assets/deploying-tanstack-start-projects-with-dokploy/_g-IBsaZ-clipboard.png)

Configure as variáveis de ambiente. Você precisa redeployar o projeto após cada alteração:

![](/assets/deploying-tanstack-start-projects-with-dokploy/4NIEqaQZ-Screenshot_2025-12-12_at_10.51.47.png)

```.env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
NIXPACKS_START_CMD="node server.js"
```

Antes de voltar para a aba General (página principal), vamos adicionar algumas coisas novas ao projeto Tanstack Start.

```js

// server.js

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

const PUBLIC_DIR = join(__dirname, "public");

async function serveStatic(pathname) {
  const filePath = join(PUBLIC_DIR, pathname);

  if (!existsSync(filePath)) return null;

  const stat = statSync(filePath);
  if (stat.isDirectory()) return null;

  const ext = extname(filePath);
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const content = readFileSync(filePath);

  return { content, contentType };
}

const { default: handler } = await import("./dist/server/server.js");

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Tenta servir arquivos estáticos primeiro para /assets/* e arquivos estáticos comuns
  if (url.pathname.startsWith("/assets/") ||
      url.pathname === "/favicon.png" ||
      url.pathname === "/robots.txt") {
    const staticFile = await serveStatic(url.pathname);
    if (staticFile) {
      res.writeHead(200, { "Content-Type": staticFile.contentType });
      res.end(staticFile.content);
      return;
    }
  }

  // Converte a requisição Node.js para uma Web Request
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  const body = req.method !== "GET" && req.method !== "HEAD"
    ? await new Promise((resolve) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      })
    : undefined;

  const webRequest = new Request(url.toString(), {
    method: req.method,
    headers,
    body,
  });

  try {
    const response = await handler.fetch(webRequest);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const responseBody = await response.arrayBuffer();
    res.end(Buffer.from(responseBody));
  } catch (error) {
    console.error("Server error:", error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";

server.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});

```

```json
/* ... scripts do package.json ... */

  "build": "vite build",
  "postbuild": "cp -r dist/client/* public/",
  "start": "node server.js",
```

```ts
// vite.config.ts
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import { defineConfig } from "vite"
import tsConfigPaths from "vite-tsconfig-paths"
import viteReact from "@vitejs/plugin-react"

const port = Number(process.env.PORT) || 3000

export default defineConfig({
  server: {
    port,
  },
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackStart(),
    viteReact(),
  ],
})

```

Acesse a página General e clique no botão Deploy.

![](/assets/deploying-tanstack-start-projects-with-dokploy/PGdEyyZl-Screenshot_2025-12-12_at_11.30.52.png)

Veja o progresso da build

![](/assets/deploying-tanstack-start-projects-with-dokploy/Vw3k8ugu-clipboard.png)

Configure o domínio personalizado

![](/assets/deploying-tanstack-start-projects-with-dokploy/UqZm2VC1-clipboard.png)

![](/assets/deploying-tanstack-start-projects-with-dokploy/nsv_ZkdA-clipboard.png)


Depois que a build terminar, você precisa configurar o DNS no Cloudflare.

```
Registro A:
seu-dominio.com -> IP do seu servidor
Ativar Proxy
```

Depois de concluir essas configurações, o projeto será implantado e executado com sucesso no Dokploy. Cada push de código acionará automaticamente uma nova implantação.
