---
title: Resolving Expo Multi Select Photos with React Hooks
slug: resolving-expo-multi-select-photos-with-react-hooks
description: "title: Resolving Expo Multi Select Photos with React Hooks published: true date: 2019-11-21 15:18:31 UTC tags: Expo,React Native,javascript canonical_url: https://atalkwith.dev/expo-multip,e-selection..."
tags: []
added: 2019-11-21T15:18:31.000Z
---

Created: Nov 26, 2019 10:07 PM Tags: Expo, React Native, javascript

# Introduction

Do you know the [Expo](https://expo.io) project? Expo is a framework and a platform for universal React applications. It is a set of tools and services built around React Native and native platforms that help you develop, build, deploy, and quickly iterate on iOS, Android, and web apps from the same JavaScript/TypeScript codebase.

## Workflows

The two approaches to building applications with Expo tools are called the “managed” and “bare” workflows.

- With the managed workflow you only write JavaScript / TypeScript and Expo tools and services take care of the rest for you.
- In the bare workflow, you have full control over every aspect of the native project, and Expo tools can’t help quite as much.

We won’t tell about the **bare workflow** at this moment, only a problem with so many people using Expo SDK 33 or later.

## Expo ImagePicker - launchImageLibraryAsync

There is the `ImagePicker` on the API for display the system UI for choosing an image or video from the phone’s library, but there isn’t a way to allow multiple selections of images, as you can see [here](https://docs.expo.io/versions/v35.0.0/sdk/imagepicker/#imagepickerlaunchimagelibraryasyncoptions). There are some feature requests here:

- [https://expo.canny.io/feature-requests/p/allow-choosing-multiple-images-in-imagepicker](https://expo.canny.io/feature-requests/p/allow-choosing-multiple-images-in-imagepicker)
- [https://expo.canny.io/feature-requests/p/multiple-images-and-cameravideo-access-for-image-picker](https://expo.canny.io/feature-requests/p/multiple-images-and-cameravideo-access-for-image-picker)

# The solution with React Hooks

In React Native, you can use the **Camera Roll API** to get media from the phone’s library, then why not build a hook for that? :]

```js
import { useCallback, useState } from 'react';
import { CameraRoll } from 'react-native';

export default function useCameraRoll({
  first = 40,
  assetType = 'Photos',
  groupTypes = 'All',
}) {
  const [photos, setPhotos] = useState([]);
  const [after, setAfter] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);

  const getPhotos = useCallback(async () => {
    if (!hasNextPage) return;

    const { edges, page_info: pageInfo } = await CameraRoll.getPhotos({
      first,
      assetType,
      groupTypes,
      ...(after && { after }),
    });

    if (after === pageInfo.end_cursor) return;

    const images = edges.map(i => i.node).map(i => i.image);

    setPhotos([...photos, ...images]);
    setAfter(pageInfo.end_cursor);
    setHasNextPage(pageInfo.has_next_page);
  }, [after, hasNextPage, photos]);

  return [photos, getPhotos];
}
```

After that, you simply use it like this:

```js
// path to your hooks
import { useCameraRoll } from 'shared/hooks';

// ...

function SomeComponent() {
	const [photos, getPhotos] = useCameraRoll({ first: 80 });

	// ...
}
```

You can use `getPhotos` in a `FlatList onEndReached` props , for instance. Problem solved :]

### References

- [https://facebook.github.io/react-native/docs/cameraroll.html](https://facebook.github.io/react-native/docs/cameraroll.html)
- [https://reactjs.org/docs/hooks-intro.html](https://reactjs.org/docs/hooks-intro.html)
- [https://reactjs.org/docs/hooks-overview.html](https://reactjs.org/docs/hooks-overview.html)