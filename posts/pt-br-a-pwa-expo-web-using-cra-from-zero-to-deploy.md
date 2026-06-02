---
title: Uma PWA Expo Web usando CRA - Do ZERO ao Deploy
slug: a-pwa-expo-web-using-cra-from-zero-to-deploy
locale: pt-BR
description: "Criando uma PWA com Create React App e Expo SDK"
tags: []
added: 2020-03-11T19:42:37.000Z
---

## Introdução

Neste post, basicamente, vou iniciar um Create React App usando a CLI do CRA e injetar as ferramentas do Expo SDK para gerar uma PWA e, com a mesma base de código, ter um app para iOS e Android.

Para começar, vamos anotar as principais ferramentas que vamos usar:

- Create React App Boilerplate
- Expo SDK
- **Expo HTML Elements**
- React Native
- React Native Web
- Styled Components
- Netlfy/Now Deploy

## Usando o boilerplate do CRA

Para obter nosso primeiro boilerplate, vamos tentar este comando:

Você receberá a aplicação React completa fornecida pela equipe do Facebook

```
    npx create-react-app pwaExpoTutorial
```

## Adicionando o ecossistema React Native

Para adicionar um ecossistema React Native, devemos instalar algumas bibliotecas:

    yarn add expo react-native react-native-web @expo/html-elements

Depois disso, podemos remover alguns arquivos irrelevantes

- pasta `public`
- arquivos `*.css`
- arquivos `*.test` (você pode adicionar sua própria ferramenta de testes depois)

## Adicionando bibliotecas secundárias

    expo install react-native-svg
    yarn add react-native-web-hooks react-native-animatable styled-components

1. **React Native SVG:** suporte a SVG (instalado com Expo, porque ele usa Yarn e instala a versão apropriada para o SDK do Expo)
2. **React Native Web Hooks:** React Hooks para serem usados na plataforma Web
3. **React Native Animatable:** biblioteca para adicionar animação ao nosso SVG, simulando o boilerplate inicial do CRA

## Configuração do Babel

É bom configurar o Babel no nosso projeto, então instale o preset do Expo e insira um **babel.config.js** na raiz do projeto

    yarn add -D babel-preset-expo

**babel.config.js**
```js
    module.exports = { presets: ['expo'] };
```
## Criando styled components compartilhados

Crie um arquivo chamado **componentsWithStyles** dentro de algo como `src/shared`
```jsx
    import styled from 'styled-components/native';
    import * as Animatable from 'react-native-animatable';
    import { Header as H, P as Paragraph, A as Anchor } from '@expo/html-elements' ;
    
    export const Container = styled.View.attrs(() => ({
        as: Animatable.View
    }))`
      flex: 1;
      align-items: center;
      justify-content: center;
      text-align: center;
      width: 100%;
    `;
    
    export const Header = styled(H)`
      background-color: #282c34;
      flex: 1;
      justify-content: center;
      align-items: center;
      width: 100%;
    `;
    
    export const P = styled(Paragraph)`
      color: white;
    `;
    
    export const A = styled(Anchor)`
      color: #61dafb;
    `;
    
    export const Image = styled(Animatable.Image).attrs(() => ({
        animation: 'rotate',
        iterationCount: 'infinite',
        easing: 'linear',
        duration: 20 * 1000,
        style: { aspectRatio: 1 }
    }))`
      width: ${props => props.dimension*0.4}px;
      height: ${props => props.dimension*0.4}px;
    `;
```
Pensando no nosso logo (o SVG fornecido no boilerplate inicial do CRA), precisamos definir uma proporção de aspecto para ele; então crie um arquivo chamado **AspectView.js** dentro de alguma pasta, eu coloquei em `src/components`
```jsx
    import React, {useState} from "react";
    import {StyleSheet} from "react-native";
    import { Image } from '../shared/componentsWithStyles';
    
    export default function AspectView(props) {
        const [layout, setLayout] = useState(null);
    
        const { aspectRatio = 1, ...inputStyle } =
        StyleSheet.flatten(props.style) || {};
        const style = [inputStyle, { aspectRatio }];
    
        if (layout) {
            const { width = 0, height = 0 } = layout;
            if (width === 0) {
                style.push({ width: height * aspectRatio, height });
            } else {
                style.push({ width, height: width * aspectRatio });
            }
        }
    
        return (
            <Image
                {...props}
                style={style}
                onLayout={({ nativeEvent: { layout } }) => setLayout(layout)}
            />
        );
    }
```
[Obrigado `@baconbrix` por compartilhar isso](https://snack.expo.io/@bacon/aspectratio)

Criei um **index.js** na mesma pasta (`src/components`)
```js
    export { default as AspectView } from './AspectView';
```
Você pode fazer o mesmo com a pasta `src/shared` (criar um arquivo **index.js**), mas esse não é o objetivo deste post; você pode melhorar isso por conta própria.

---

## Vamos mergulhar em React Native

Você pode criar um arquivo na raiz da aplicação chamado **app.json** para definir algumas informações sobre seu app:
```json
    {
      "expo": {
        "name": "PWAExpoWeb",
        "description": "A PWA using Expo Web",
        "slug": "pwaingexpo",
        "privacy": "public",
        "version": "1.0.0",
        "orientation": "portrait",
        "icon": "./assets/icon.png",
        "splash": {
          "image": "./assets/splash.png",
          "resizeMode": "cover",
          "backgroundColor": "#ffffff"
        },
        "web": { "barStyle": "black-translucent" }
      }
    }
```
Depois, crie um arquivo **App.js** na raiz
```jsx
    import React from 'react';
    import logo from './src/logo.svg';
    import { Code } from '@expo/html-elements';
    import { useDimensions } from 'react-native-web-hooks';
    
    import { AspectView } from './src/components';
    import {
      Container,
      Header,
      P,
      A,
    } from './src/shared/componentsWithStyles';
    
    function App() {
      const { window: { height } } = useDimensions();
    
      return (
        <Container>
          <Header>
            <AspectView source={logo} dimension={height} />
            <P>
              Edit <Code>src/App.js</Code> and save to reload.
            </P>
            <A
              href="https://reactjs.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn React
            </A>
          </Header>
        </Container>
      );
    }
    
    export default App;
```
Expo tem uma **configuração especial**, então você precisa definir o entrypoint em **package.json**
```json
    // ...
    "main": "expo/AppEntry.js",
    // ...
```
Continuando em **package.json**, precisamos adicionar nossos scripts:
```json
    // ...
    "scripts": {
        "start": "expo start",
        "android": "expo start --android",
        "ios": "expo start --ios",
        "eject": "expo eject",
        "build": "expo build:web",
        "debug-prod": "expo build:web && npx serve ./web-build",
        "now-build": "yarn build && expo-optimize"
      },
    // ...
```
Você percebeu que depois do `build` tem o `expo-optimize`, então vamos inseri-lo no nosso projeto:

    yarn add -D sharp-cli expo-optimize expo-cli@3.13.0

Ele usa uma versão específica do **Expo CLI (v3.13.0)** porque, na época deste post, a última versão da CLI estava com um problema quando era referenciada pelo Workbox; então, por precaução, foi adicionada uma das últimas versões.

Por fim, devemos adicionar algumas pastas no `.gitignore`:

    #expo
    .expo
    web-build
    
    #IDE
    .idea
    .vscode

1. **.expo:** pasta de cache
2. **web-build:** o bundle web
3. **.idea & .vscode:** pastas de IDEs

É isso; agora você pode testar executando `yarn debug-prod`. =-]

## Deploy via Netlify ou Now

Você pode usar este projeto como um repositório Git; então, no Netlify ou Now, você pode usar o repositório do Github/Gitlab/Bitbucket sincronizado com o `master`. Você só precisa definir o **build command** como `yarn now-build` e a **pasta de saída** como `web-build/`, então toda vez que você fizer push para o master, ele será implantado nos serviços (Netlify/Now).

## O que vem a seguir?

- Typescript - Expo tem um suporte incrível para TS
- Workbox
- GraphQL

### References

- source: https://github.com/mauriciord/pwa-expo-web
- demo: https://pwa-expo-web.netlify.com/
- lighthouse: https://googlechrome.github.io/lighthouse/viewer/?psiurl=https%3A%2F%2Fpwa-expo-web.netlify.com%2F&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo&category=pwa&utm_source=lh-chrome-ext

![Alt Text](/assets/a-pwa-expo-web-using-cra-from-zero-to-deploy/fxVIMNlI0.png)

Obrigado, 😎
