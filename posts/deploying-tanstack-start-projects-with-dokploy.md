---
title: Deploying Tanstack Start Projects with Dokploy
slug: deploying-tanstack-start-projects-with-dokploy
description: >-
  Effortlessly Deploy Tanstack Start Projects Using Dokploy: A Cost-Effective
  Self-Hosted Solution
tags:
  - projects
added: 2025-12-16T22:37:40.230Z
---

# Blog Post

![](/assets/deploying-tanstack-start-projects-with-dokploy/u0ZLmBEs-clipboard.png)

# Deploying Tanstack Start Projects with Dokploy

This blog post is heavily inspired by [NEXTY.DEV's guide on deploying Next.js projects with Dokploy](https://nexty.dev/docs/start-project/dokploy). While their documentation provides an excellent walkthrough for Next.js applications, I wanted to explore how the same self-hosted deployment approach could work with TanStack Start—the new full-stack React framework from the TanStack ecosystem. If you're looking for a cost-effective alternative to platforms like Vercel or Railway for your TanStack Start projects, Dokploy offers a compelling open-source PaaS solution that runs on your own infrastructure.

## What is Dokploy

Dokploy is an open-source self-hosted PaaS (Platform as a Service) that serves as an alternative to services like Vercel, Netlify, Railway, and Zeabur.

![](/assets/deploying-tanstack-start-projects-with-dokploy/i1Wxo9IU-clipboard.png)

## Server Setup and Dokploy Installation

### Purchase a Server

Using Dokploy requires purchasing your own server. If you're unsure which provider to choose, consider [hostinger](https://www.hostinger.com/). For initial projects, a 2-core 8GB VPS is sufficient, costing only $6.49 per month.

![](/assets/deploying-tanstack-start-projects-with-dokploy/jQmTzR2V-clipboard.png)

### Configure the Server

After payment, complete the VPS setup following the on-screen instructions. Once configured, the dashboard will show the VPS is running.

Next, configure firewall rules. Hostinger has no default firewall rules, meaning all ports are open, which poses security risks. We need to create firewall rules to allow access to ports 22, 80, 443, and 3000.


![](/assets/deploying-tanstack-start-projects-with-dokploy/qJXxsy1D-clipboard.png)

![](/assets/deploying-tanstack-start-projects-with-dokploy/taU9gp4C-clipboard.png)

## Install Dokploy

Open the VPS Terminal

![](/assets/deploying-tanstack-start-projects-with-dokploy/TK9tLIzZ-clipboard.png)

Log in to the VPS via SSH and execute the Dokploy installation command:

```bash
curl -sSL https://dokploy.com/install.sh | sh
```

![](/assets/deploying-tanstack-start-projects-with-dokploy/ivSXWGQW-clipboard.png)

After installation completes, visit the address shown in the command output to access the Dokploy dashboard.

### Configure Dokploy

After registration and login, first set up a custom domain for the dashboard:

![](/assets/deploying-tanstack-start-projects-with-dokploy/E5dc4_rn-clipboard.png)

Then add a DNS record for this custom domain in your domain resolution platform (using CloudFlare as an example), select A type resolution, and enter the server IP address.

![](/assets/deploying-tanstack-start-projects-with-dokploy/8FRa9vTw-clipboard.png)

Once the DNS propagates, you can access the Dokploy dashboard through the custom domain.

Finally, connect your Git account as shown:

## ![](/assets/deploying-tanstack-start-projects-with-dokploy/LdZ0pagx-clipboard.png)

## Deployment

Dokploy provides a Vercel-like visual deployment interface.

![](/assets/deploying-tanstack-start-projects-with-dokploy/Fv9Z4Cty-clipboard.png)
![](/assets/deploying-tanstack-start-projects-with-dokploy/B7MXcZLv-clipboard.png)
![](/assets/deploying-tanstack-start-projects-with-dokploy/VR8lhPo0-clipboard.png)

Enter the Service page, set the Provider by selecting Github Account, Repository, and Branch in sequence, then **click Save**.

![](/assets/deploying-tanstack-start-projects-with-dokploy/_g-IBsaZ-clipboard.png)

Configure environment variables. You need to redeploy the project after each modification:

![](/assets/deploying-tanstack-start-projects-with-dokploy/4NIEqaQZ-Screenshot_2025-12-12_at_10.51.47.png)

```.env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
NIXPACKS_START_CMD="node server.js"
```

Before going back to the General tab (main page), let's add some new stuff to the Tanstack Start Project.

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

  // Try static files first for /assets/* and common static files
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

  // Convert Node.js request to Web Request
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
/* ... package.json scripts ... */

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

Access General page and click on the Deploy button.

![](/assets/deploying-tanstack-start-projects-with-dokploy/PGdEyyZl-Screenshot_2025-12-12_at_11.30.52.png)

View build progress

![](/assets/deploying-tanstack-start-projects-with-dokploy/Vw3k8ugu-clipboard.png)

Configure custom domain

![](/assets/deploying-tanstack-start-projects-with-dokploy/UqZm2VC1-clipboard.png)

![](/assets/deploying-tanstack-start-projects-with-dokploy/nsv_ZkdA-clipboard.png)


After the build completes, you need to set up DNS in Cloudflare.

```
A record:
your-domain.com -> Your server IP
Enable Proxy
```

After completing these configurations, the project will be deployed and run successfully on Dokploy. Every code push will automatically trigger a new deployment.
