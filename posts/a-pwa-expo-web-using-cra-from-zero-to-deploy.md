---
title: A PWA Expo Web using CRA - From ZERO to Deploy
slug: a-pwa-expo-web-using-cra-from-zero-to-deploy
description: "title: A PWA Expo Web using CRA - From ZERO to Deploy published: true description: Creating a PWA using Create React App tool and Expo SDK tags: expo,react-native,react,pwa cover_image:..."
tags: []
added: 2020-03-11T19:42:37.000Z
---

## Introduction

In this post, basically, I will init a Create React App using CRA CLI and inject the Expo SDK Tools to generate a PWA, and with the same codebase, have an iOS and Android App.

To begin, lets annotate the main tools that we'll use:

- Create React App Boilerplate
- Expo SDK
- **Expo HTML Elements**
- React Native
- React Native Web
- Styled Components
- Netlfy/Now Deploy

## Using the CRA Boilerplate

To get our first boilerplate, lets try this command:

You will get the full React Application provided by Facebook Team

```
    npx create-react-app pwaExpoTutorial
```

## Adding React Native Ecosystem

For adding a React Native ecosystem we should add some libraries:

    yarn add expo react-native react-native-web @expo/html-elements

After that, we can remove some irrelevant files

- `public` folder
- `*.css` files
- `*.test` files (you can add your own test tool after)

## Adding secondary libraries

    expo install react-native-svg
    yarn add react-native-web-hooks react-native-animatable styled-components

1. **React Native SVG:** SVG Support (Installed with Expo, because it uses Yarn and install the appropriate version to the Expo SDK)
2. **React Native Web Hooks:** React Hooks to be used in Web platform
3. **React Native Animatable:** A library to add animation to our SVG, simulating the initial CRA boilerplate

## Babel configuration

It's good to configure Babel in our project, so install the expo preset and insert a **babel.config.js** on project root folder

    yarn add -D babel-preset-expo

**babel.config.js**
```js
    module.exports = { presets: ['expo'] };
```
## Creating shared styled components

Create a file called **componentsWithStyles** inside something like `src/shared`
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
Thinking in our logo (the SVG provided on initial CRA boilerplate), we need to set an aspect ratio to it, so create a file called **AspectView.js** inside some folder, I put it inside `src/components`
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
[Thank you `@baconbrix` to share it](https://snack.expo.io/@bacon/aspectratio)

I created an **index.js** in the same folder (`src/components`)
```js
    export { default as AspectView } from './AspectView';
```
You can do the same with the folder `src/shared` (create an **index.js** file), but this is not the purpose of this post, you can improve on your own.

---

## Let's dive into React Native

You can create a file in the application root folder called **app.json** to define some info about your app:
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
Then, create an **App.js** file on the root folder
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
Expo has a **special configuration** so you need to set entrypoint in **package.json**
```json
    // ...
    "main": "expo/AppEntry.js",
    // ...
```
Continuing on **package.json**, we need to add our scripts:
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
Did you notice that after the `build`, there is the `expo-optimize`, so let's insert it on our project:

    yarn add -D sharp-cli expo-optimize expo-cli@3.13.0

It's using specific version of **Expo CLI (v3.13.0)** because, at the time of this post, the last version of the CLI was having a problem when being referenced by the Workbox, so, as a precaution, one of the last versions was added

Last  but not least, we should increment some folders in `.gitignore`:

    #expo
    .expo
    web-build
    
    #IDE
    .idea
    .vscode

1. **.expo:** Cache folder
2. **web-build:** The web bundle
3. **.idea & .vscode:** IDEs folders

That's it, so you can try it running `yarn debug-prod`. =-]

## Deploy via Netlify or Now

You can use this project as a Git repository, so on Netlify or Now, you can use the Github/Gitlab/Bitbucket repo synced with the `master`. You have only to set the **build command** as `yarn now-build` and the **output folder** as `web-build/`, so everytime you push commit to master, it will be deployed in the services (Netlify/Now).

## Whats next?

- Typescript - Expo has an incredible support for TS
- Workbox
- GraphQL

### References

- source: https://github.com/mauriciord/pwa-expo-web
- demo: https://pwa-expo-web.netlify.com/
- lighthouse: https://googlechrome.github.io/lighthouse/viewer/?psiurl=https%3A%2F%2Fpwa-expo-web.netlify.com%2F&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo&category=pwa&utm_source=lh-chrome-ext

![Alt Text](/assets/a-pwa-expo-web-using-cra-from-zero-to-deploy/fxVIMNlI0.png)

Thanks, 😎