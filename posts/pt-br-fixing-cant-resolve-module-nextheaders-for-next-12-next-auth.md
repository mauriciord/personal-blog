---
title: "Corrigindo \"Can't resolve module 'next/headers'\" no Next 12 + Next Auth"
slug: fixing-cant-resolve-module-nextheaders-for-next-12-next-auth
locale: pt-BR
description: "Se você usa NextAuth dentro do seu projeto Next.js v12.x, provavelmente já enfrentou este problema: Can't resolve module 'next/headers' A única forma que encontrei foi aplicar um patch-package ao Next Auth..."
tags: []
added: 2023-09-18T21:08:29.224Z
---

Se você usa NextAuth dentro do seu projeto Next.js v12.x, provavelmente já enfrentou este problema:

```bash
Can't resolve module 'next/headers'
```

A única forma que encontrei foi aplicar um `patch-package` ao pacote Next Auth. Vamos corrigir isso:

* Altere seu **package.json**:
    

```json
// package.json
"scripts": {
    "postinstall": "patch-package"
}
```

Depois execute:

```bash
yarn add -D patch-package postinstall-postinstall
```

Depois dessa alteração, você precisará mudar dois arquivos dentro do seu `node_modules`:

* `node_modules/next-auth/next/index.js`
    

* `node_modules/next-auth/src/next/index.ts`
    


Modifique-os um por um:

você precisa procurar por "next/headers" e vai notar dois trechos usando isso.

```typescript
// node_modules/next-auth/next/index.js
// node_modules/next-auth/src/next/index.ts

if (isRSC) {
     options = Object.assign({}, args[0], {
      providers: []
     });

    const {
    headers,
    cookies
    } = require("next/headers");

    req = {
      headers: Object.fromEntries(headers()),
      cookies: Object.fromEntries(cookies().getAll().map(c => [c.name, c.value]))
    };
    res = {
      getHeader() {},
      setCookie() {},
      setHeader() {}
    };
} else {
    req = args[0];
    res = args[1];
    options = Object.assign({}, args[2], {
        providers: []
    });
}

/*
* replace with else only
*/
    req = args[0];
    res = args[1];
    options = Object.assign({}, args[2], {
        providers: []
    });
```

```typescript
// node_modules/next-auth/next/index.js
// node_modules/next-auth/src/next/index.ts

// remova este const { headers, cookies } = require("next/headers")
// da função assíncrona NextAuthRouteHandler(

cookies: Object.fromEntries(
    Array.from(req.cookies.entries())
        .map(([name, value]) => [name, value])
),
headers: req.headers, // você não precisa disso como Headers
```

Depois de aplicar essas mudanças, você precisa executar:

```bash
yarn patch-package next-auth
```

Isso criará o arquivo de patch. Você também pode consultar este [gist aqui](https://gist.github.com/mauriciord/9af1ebd21aa066c9dd73860a90996efa).

É isso. Byte bye!

## P.S.: Solução de problemas

```bash
rm -rf node_modules yarn.lock package-lock.json .next

yarn
```
