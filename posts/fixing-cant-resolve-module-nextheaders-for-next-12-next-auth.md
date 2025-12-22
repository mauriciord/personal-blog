---
title: "Fixing \"Can't resolve module 'next/headers'\" for Next 12 + Next Auth"
slug: fixing-cant-resolve-module-nextheaders-for-next-12-next-auth
description: "If you use NextAuth within your Next.js v12.x project, you've probably faced this issue: Can't resolve module 'next/headers' The only way I found it was by applying a patch-package to the Next Auth..."
tags: []
added: 2023-09-18T21:08:29.224Z
---

If you use NextAuth within your Next.js v12.x project, you've probably faced this issue:

```bash
Can't resolve module 'next/headers'
```

The only way I found it was by applying a `patch-package` to the Next Auth package. Let's fix it:

* Change your **package.json**:
    

```json
// package.json
"scripts": {
    "postinstall": "patch-package"
}
```

Then execute:

```bash
yarn add -D patch-package postinstall-postinstall
```

After that change, you'll need to change two files inside your `node_modules`:

* `node_modules/next-auth/next/index.js`
    
* `node_modules/next-auth/src/next/index.ts`
    

Modify them one by one:

you need to look for "next/headers" and you'll notice two pieces using it.

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

// remove this const { headers, cookies } = require("next/headers")
// from async function NextAuthRouteHandler(

cookies: Object.fromEntries(
    Array.from(req.cookies.entries())
        .map(([name, value]) => [name, value])
),
headers: req.headers, // you don't need this as Headers
```

After applying those changes, you must run:

```bash
yarn patch-package next-auth
```

This will create the patch file. You can also refer to this [gist here](https://gist.github.com/mauriciord/9af1ebd21aa066c9dd73860a90996efa).

That's it. Byte bye!

## P.S.: Troubleshooting

```bash
rm -rf node_modules yarn.lock package-lock.json .next

yarn
```