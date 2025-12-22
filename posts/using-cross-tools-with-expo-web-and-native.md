---
title: Using cross tools with Expo Web and Native
slug: using-cross-tools-with-expo-web-and-native
description: "title: Using cross tools with Expo Web and Native published: true date: 2019-12-03 02:57:00 UTC tags: Expo,React Native,javascript canonical_url: https://atalkwith.dev/cross-tools-with-expo..."
tags: []
added: 2019-12-03T02:57:00.000Z
---

first post of Expo series: https://dev.to/atalkwithdev/resolving-expo-multi-select-photos-with-react-hooks-487k

Continuing my series of posts about Expo, today we will discover how to use common development tools like **Reactotron** and **Sentry** in a cross-platform application using Expo.

## Expo Web

Let’s suppose that you’re going to build a Web version of your app (an Android/iOS app, but now you want a Web platform of this app), what would you do?

First of all, let’s add a “web” option in the `app.json` as a platform:

```json
"platforms": [
  "ios",
  "android",
  "web"
],
```

After that:

```
yarn add react-native-web react-dom
```

Now, you can just start your app :]

Maybe you got an error from `./RCTNetworking` that doesn’t leave your app starts. Probably you’ll get this error if you are already using **Reactotron** solution.

## Installing / Fixing Reactotron

![reactotron interface](https://atalkwith.dev/media/screen_shot_2019-12-01_at_22.45.44.png "reactotron interface")

Let’s install the **Reactotron Client** at our machine following this [installation guide](https://github.com/infinitered/reactotron/blob/master/docs/installing.md). Then, we can create our files to each platform only writing the file extension prefix. _i.e.:_ `index.native.js` and `index.web.js`

The `*.web.js` means that code will build and run only in the Web platform, the same approach is to the `*.native.js`, but to the iOS/Android Platform.

Create a folder called **reactotron** on your app and then create the two files:

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

After that, you have to add that configuration in somewhere.

**App.js:**

```js
import React from 'react';
import 'path/to/your/reactotron';

// ...

registerRootComponent(AppContainer);
```

Now, if you build the app for Web, it will use the web configuration, if you build the app for Native, it will use the Native configuration.

You will apply the same approach to Sentra tool, but you can follow this guide :]

## Configuring Sentry

Unfortunately, there is a bug issue with Sentry Expo v.2.x with the Web Platform, then let’s use an older version, and let’s add the Sentry Browser to the Web Platform too.

```
yarn add sentry-expo@1.13.0 @sentry/browser
```

After that, let’s configure our Sentry project, following the approach of the Reactotron, create a folder called **sentry** on your app and then create the three files:

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

When you want to use **Sentry** to capture exceptions, you just import it:

```js
import Sentry from 'path/to/your/sentry';

// Sentry.captureException()
```

### References

- [https://docs.expo.io/versions/latest/guides/using-sentry/](https://docs.expo.io/versions/latest/guides/using-sentry/)
- [https://github.com/getsentry/sentry](https://github.com/getsentry/sentry)
- [https://github.com/infinitered/reactotron](https://github.com/infinitered/reactotron)
- [https://forums.expo.io/t/sentry-api-does-not-work/27321/36](https://forums.expo.io/t/sentry-api-does-not-work/27321/36)

I hope you enjoy this post, and soon I will post more about Expo and how to deliver a great value to your company and your clients using it.

Thank you :]