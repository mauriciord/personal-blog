---
title: How to insert an Expo project in a Monorepo
slug: how-to-insert-an-expo-project-in-a-monorepo
description: "Introduction In this post, I'll cover about adding an Expo project inside a Monorepo project. I found on the internet so many people trying to do this, asking in some forums, or commenting something..."
tags: []
added: 2020-04-09T01:10:29.000Z
---

## Introduction

In this post, I'll cover about adding an Expo project inside a Monorepo project. I found on the internet so many people trying to do this, asking in some forums, or commenting something like "+1" at the Github issues. So, the purpose of this post is not to teach how to create a monorepo, is how to insert your Expo application inside a Monorepo.

Of course, you could help me by liking "+1" in this post.

## Monorepo

I won't go deep in Monorepo's explanation, but basically, is an architectural concept. Instead of a lot of individual repositories, you keep all your isolated code parts inside one repository. It's very different from the monolithic repo.

Good examples and inspirations with Monorepo are:

- [The Expo itself](https://github.com/expo/expo)
- [Golden Stack](https://github.com/FotonTech/golden-stack)
- [Entria Fullstack Monorepo](https://github.com/entria/entria-fullstack)

After you understand the main monorepo structure, you start to see a lot of famous libraries that you or your team use that is Monorepo.

![https://cdn.hashnode.com/res/hashnode/image/upload/v1642718740151/h11QnQqyi.gif](https://media.giphy.com/media/lJ0JGfNBrRWJVCRChd/giphy.gif)

## Let's get to work

First of all, you must create an Expo project (of course, if you haven't already created one) in some folder. To do this is simple like:
```bash
    # Install the command line tools
    # npm install --global expo-cli or
    # yarn global add expo-cli
    
    # ~/workspace
    
    # Create a new project
    expo init my-project
```
> More info: [https://docs.expo.io/versions/v37.0.0/](https://docs.expo.io/versions/v37.0.0/)

You can overwrite `my-project` with your the name of your choice (mine is `expo-app`), then select **Blank Template (Managed)**.

So, move this Expo project folder inside the Monorepo folder:
```bash
    # ~/workspace
    mv expo-app monorepo/packages/expo-app
```
Now, the Expo project is inside the Monorepo. But, we need to adjust some things to be able to run Expo inside this Monorepo.

We need to set the package name at Expo project `package.json` :
```json
    // ~/workspace/monorepo/packages/expo-app/package.json
    {
      "name": "@monorepo/expo-app",
      "main": "__generated__/AppEntry.js",
      // ...
    }
```
The `"main"` key is a special configuration from Expo, so we really need to set that.

After that, let's add two essential libraries to make our Expo project work. At the monorepo root folder, run this command:
```bash
    yarn workspace @monorepo/expo-app add expo-yarn-workspaces metro-config -D -W
```
**Flags:**

- `-W`: Adds the libraries on the root
- `-D`: The same as `—-dev` to add as devDependencies

### Metro config

Let's configure our Metro, so create a file **metro.config.js** at `monorepo/packages/expo-app`:
```js
    // ~/workspace/monorepo/packages/expo-app/metro.config.js
    
    const { createMetroConfiguration } = require('expo-yarn-workspaces');
    
    module.exports = createMetroConfiguration(__dirname);
```
So, we need to set insert some scripts at `package.json` again:
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
### Extra configuration :: Typescript

If you don't want to add Typescript, you can skip this section.

Probably your monorepo root folder should contain a `tsconfig.json`, so let's add one to the Expo App package and extend the configuration on the root.
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
You don't need to use `"extends"` key if your monorepeo doesn't contain a TS config yet.

## Last step

To start building your product, you should clean/reset your monorepo project, because of the `"postinstall"` script inside the expo app package.

You can remove all `node_modules` or something like `yarn --force` on the root folder.

After that, you should run `yarn install` again, and you'll be able to develop & build your great product using Expo universal Apps :-]

## References

You can look at my [merged PR inserting an Expo Managed Workflow inside a Monorepo here](https://github.com/FotonTech/golden-stack/pull/30).

## Whats next?

- Expo - Bare Workflow inside a Monorepo
- Relay Client to use GraphQL
- Or you can comment something to do with Expo

Thank you. \o/