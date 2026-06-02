---
title: Como inserir um projeto Expo em um Monorepo
slug: how-to-insert-an-expo-project-in-a-monorepo
locale: pt-BR
description: "Neste post, vou falar sobre como adicionar um projeto Expo dentro de um Monorepo."
tags: []
added: 2020-04-09T01:10:29.000Z
---

## Introdução

Neste post, vou falar sobre como adicionar um projeto Expo dentro de um projeto Monorepo. Encontrei na internet muita gente tentando fazer isso, perguntando em fóruns ou comentando coisas como "+1" em issues do Github. Então, o objetivo deste post não é ensinar a criar um monorepo; é mostrar como inserir sua aplicação Expo dentro de um Monorepo.

Claro, você também pode me ajudar deixando um "+1" neste post.

## Monorepo

Não vou me aprofundar na explicação de Monorepo, mas, basicamente, é um conceito arquitetural. Em vez de vários repositórios individuais, você mantém todas as partes isoladas do seu código dentro de um único repositório. É bem diferente de um repositório monolítico.

Boas referências e inspirações com Monorepo são:

- [O próprio Expo](https://github.com/expo/expo)
- [Golden Stack](https://github.com/FotonTech/golden-stack)
- [Entria Fullstack Monorepo](https://github.com/entria/entria-fullstack)

Depois que você entende a estrutura principal de um monorepo, começa a perceber que muitas bibliotecas famosas que você ou sua equipe usam também são Monorepo.

![https://cdn.hashnode.com/res/hashnode/image/upload/v1642718740151/h11QnQqyi.gif](https://media.giphy.com/media/lJ0JGfNBrRWJVCRChd/giphy.gif)

## Vamos ao trabalho

Antes de tudo, você precisa criar um projeto Expo (claro, se ainda não tiver criado um) em alguma pasta. Fazer isso é simples, assim:
```bash
    # Install the command line tools
    # npm install --global expo-cli or
    # yarn global add expo-cli
    
    # ~/workspace
    
    # Create a new project
    expo init my-project
```
> More info: [https://docs.expo.io/versions/v37.0.0/](https://docs.expo.io/versions/v37.0.0/)

Você pode substituir `my-project` pelo nome que quiser (o meu é `expo-app`), e então selecionar **Blank Template (Managed)**.

Agora, mova a pasta desse projeto Expo para dentro da pasta do Monorepo:
```bash
    # ~/workspace
    mv expo-app monorepo/packages/expo-app
```
Agora, o projeto Expo está dentro do Monorepo. Mas precisamos ajustar algumas coisas para conseguir executar o Expo dentro desse Monorepo.

Precisamos definir o nome do pacote no `package.json` do projeto Expo:
```json
    // ~/workspace/monorepo/packages/expo-app/package.json
    {
      "name": "@monorepo/expo-app",
      "main": "__generated__/AppEntry.js",
      // ...
    }
```
A chave `"main"` é uma configuração especial do Expo, então realmente precisamos defini-la.

Depois disso, vamos adicionar duas bibliotecas essenciais para fazer nosso projeto Expo funcionar. Na pasta raiz do monorepo, execute este comando:
```bash
    yarn workspace @monorepo/expo-app add expo-yarn-workspaces metro-config -D -W
```
**Flags:**

- `-W`: adiciona as bibliotecas na raiz
- `-D`: o mesmo que `--dev`, para adicionar como devDependencies

### Configuração do Metro

Vamos configurar nosso Metro; então crie um arquivo **metro.config.js** em `monorepo/packages/expo-app`:
```js
    // ~/workspace/monorepo/packages/expo-app/metro.config.js
    
    const { createMetroConfiguration } = require('expo-yarn-workspaces');
    
    module.exports = createMetroConfiguration(__dirname);
```
Então, precisamos inserir alguns scripts novamente em `package.json`:
```json
    // ~/workspace/monorepo/packages/expo-app/package.json
    
    {
      "name": "@monorepo/expo-app",
      "main": "__generated__/AppEntry.js",
      // ...
      "scripts": {
        // ...
        "postinstall": "expo-yarn-workspaces postinstall",
      },
    }
```
### Configuração extra :: Typescript

Se você não quiser adicionar Typescript, pode pular esta seção.

Provavelmente a pasta raiz do seu monorepo deve conter um `tsconfig.json`, então vamos adicionar um ao pacote do Expo App e estender a configuração da raiz.
```json
    // ~/workspace/monorepo/packages/expo-app/tsconfig.json
    
    {
      "extends": "../../tsconfig.json",
      "compilerOptions": {
        "allowSyntheticDefaultImports": true,
        "esModuleInterop": true,
        "experimentalDecorators": true,
        "forceConsistentCasingInFileNames": true,
        "importHelpers": true,
        "jsx": "react-native",
        "lib": ["dom", "esnext"],
        "moduleResolution": "node",
        "noFallthroughCasesInSwitch": true,
        "noEmit": true,
        "noEmitHelpers": true,
        "noImplicitReturns": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "skipLibCheck": true,
        "strict": true,
        "target": "esnext",
        "allowJs": true,
        "baseUrl": ".",
        // autocomplete paths
        "paths": {
          "*": ["src/*", "assets/*"],
          "assets/*": ["assets/*"]
        },
        "removeComments": true,
        "typeRoots": ["node_modules/@types", "./src/@types"]
      },
      "include": ["src"],
      "exclude": [
        "node_modules",
        "./node_modules",
        "./node_modules/*"
      ]
    }
```
Você não precisa usar a chave `"extends"` se o seu monorepo ainda não tiver uma config de TS.

## Último passo

Para começar a construir seu produto, você deve limpar/reiniciar seu projeto monorepo, por causa do script `"postinstall"` dentro do pacote do app Expo.

Você pode remover todos os `node_modules` ou usar algo como `yarn --force` na pasta raiz.

Depois disso, execute `yarn install` novamente e você conseguirá desenvolver e compilar seu ótimo produto usando Expo universal Apps :-]

## Referências

Você pode ver meu [PR mesclado inserindo um Expo Managed Workflow dentro de um Monorepo aqui](https://github.com/FotonTech/golden-stack/pull/30).

## O que vem a seguir?

- Expo - Bare Workflow dentro de um Monorepo
- Relay Client para usar GraphQL
- Ou você pode comentar algo para fazermos com Expo

Obrigado. \o/
