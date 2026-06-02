---
title: Usando ferramentas cross-platform com Expo Web e Native
slug: using-cross-tools-with-expo-web-and-native
locale: pt-BR
description: "Usando ferramentas cross-platform com Expo Web e Native"
tags: []
added: 2019-12-03T02:57:00.000Z
---

first post of Expo series: https://dev.to/atalkwithdev/resolving-expo-multi-select-photos-with-react-hooks-487k

Continuando minha série de posts sobre Expo, hoje vamos descobrir como usar ferramentas comuns de desenvolvimento como **Reactotron** e **Sentry** em uma aplicação multiplataforma usando Expo.

## Expo Web

Vamos supor que você vai criar uma versão Web do seu app (um app Android/iOS, mas agora você quer uma plataforma Web para esse app). O que você faria?

Antes de tudo, vamos adicionar uma opção `web` no `app.json` como plataforma:

```json
"platforms": [
  "ios",
  "android",
  "web"
],
```

Depois disso:

```
yarn add react-native-web react-dom
```

Agora, você já pode iniciar seu app :]

Talvez você tenha recebido um erro de `./RCTNetworking` que impede seu app de iniciar. Provavelmente esse erro aparece se você já estiver usando a solução **Reactotron**.

## Instalando / Corrigindo o Reactotron

![reactotron interface](https://atalkwith.dev/media/screen_shot_2019-12-01_at_22.45.44.png "reactotron interface")

Vamos instalar o **Reactotron Client** na nossa máquina seguindo este [guia de instalação](https://github.com/infinitered/reactotron/blob/master/docs/installing.md). Depois, podemos criar nossos arquivos para cada plataforma escrevendo apenas o prefixo da extensão. _ex.:_ `index.native.js` e `index.web.js`

`*.web.js` significa que o código será compilado e executado apenas na plataforma Web; a mesma ideia vale para `*.native.js`, mas para iOS/Android.

Crie uma pasta chamada **reactotron** no seu app e depois crie os dois arquivos:

- `index.native.js`
- `index.web.js`

**index.native.js:**

```js
import Reactotron, { openInEditor, asyncStorage } from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';
import sagaPlugin from 'reactotron-redux-saga';
import { NativeModules } from 'react-native';
import url from 'url';

const { hostname: host } = url.parse(NativeModules.SourceCode.scriptURL);

if ( __DEV__ ) {
  const tron = Reactotron.configure({ host })
    .use(reactotronRedux())
    .use(asyncStorage())
    .use(sagaPlugin())
    .use(openInEditor())
    .useReactNative()
    .connect();

  tron.clear();

  console.tron = tron;
}

yarn add url
yarn add -D reactotron-react-native reactotron-redux reactotron-redux-saga
```

**index.web.js:**

```js
import Reactotron from 'reactotron-react-js';
import { reactotronRedux } from 'reactotron-redux';
import sagaPlugin from 'reactotron-redux-saga';

if ( __DEV__ ) {
  const tron = Reactotron.configure()
    .use(reactotronRedux())
    .use(sagaPlugin())
    .connect();

  tron.clear();

  console.tron = tron;
}
```

```
yarn add -D reactotron-react-js reactotron-redux reactotron-redux-saga
```

Depois disso, você precisa adicionar essa configuração em algum lugar.

**App.js:**

```js
import React from 'react';
import 'path/to/your/reactotron';

// ...

registerRootComponent(AppContainer);
```

Agora, se você compilar o app para Web, ele usará a configuração web; se compilar para Native, usará a configuração nativa.

Você vai aplicar a mesma abordagem à ferramenta Sentra, mas pode seguir este guia :]

## Configurando o Sentry

Infelizmente, existe um bug no Sentry Expo v.2.x com a plataforma Web, então vamos usar uma versão mais antiga e também adicionar o Sentry Browser para a plataforma Web.

```
yarn add sentry-expo@1.13.0 @sentry/browser
```

Depois disso, vamos configurar nosso projeto Sentry. Seguindo a mesma abordagem do Reactotron, crie uma pasta chamada **sentry** no seu app e depois crie os três arquivos:

- `sentry.native.js`
- `sentry.web.js`
- `index.js`

**sentry.native.js:**

```js
import Sentry from 'sentry-expo';
import env from 'path/to/your/constants/environment';

Sentry.config(env.SENTRY_PUBLIC_DNS).install();

export default Sentry;
```

**sentry.web.js:**

```js
import * as Sentry from '@sentry/browser';
import env from 'path/to/your/constants/environment';

Sentry.init({
  dsn: env.SENTRY_PUBLIC_DNS,
  debug: false,
});

export default Sentry;
```

**index.js:**

```js
import Sentry from './sentry';

export default Sentry;
```

Quando você quiser usar **Sentry** para capturar exceções, basta importá-lo:

```js
import Sentry from 'path/to/your/sentry';

// Sentry.captureException()
```

### References

- [https://docs.expo.io/versions/latest/guides/using-sentry/](https://docs.expo.io/versions/latest/guides/using-sentry/)
- [https://github.com/getsentry/sentry](https://github.com/getsentry/sentry)
- [https://github.com/infinitered/reactotron](https://github.com/infinitered/reactotron)
- [https://forums.expo.io/t/sentry-api-does-not-work/27321/36](https://forums.expo.io/t/sentry-api-does-not-work/27321/36)

Espero que você tenha gostado deste post, e em breve publicarei mais sobre Expo e sobre como entregar grande valor para sua empresa e seus clientes usando essa tecnologia.

Obrigado :]
