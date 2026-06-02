---
title: Resolvendo seleção múltipla de fotos no Expo com React Hooks
slug: resolving-expo-multi-select-photos-with-react-hooks
locale: pt-BR
description: "Resolvendo seleção múltipla de fotos no Expo com React Hooks"
tags: []
added: 2019-11-21T15:18:31.000Z
---

Created: Nov 26, 2019 10:07 PM Tags: Expo, React Native, javascript

# Introdução

Você conhece o projeto [Expo](https://expo.io)? Expo é um framework e uma plataforma para aplicações React universais. É um conjunto de ferramentas e serviços construído em torno de React Native e de plataformas nativas que ajuda você a desenvolver, compilar, publicar e iterar rapidamente em apps para iOS, Android e web a partir da mesma base de código JavaScript/TypeScript.

## Workflows

As duas abordagens para construir aplicações com as ferramentas do Expo são chamadas de workflows “managed” e “bare”.

- Com o workflow managed, você escreve apenas JavaScript / TypeScript e as ferramentas e serviços do Expo cuidam do resto para você.
- No workflow bare, você tem controle total sobre todos os aspectos do projeto nativo, e as ferramentas do Expo não conseguem ajudar tanto.

Não vamos falar do **bare workflow** neste momento, apenas de um problema comum entre muitas pessoas que usam Expo SDK 33 ou superior.

## Expo ImagePicker - launchImageLibraryAsync

Existe o `ImagePicker` na API para exibir a interface do sistema para escolher uma imagem ou vídeo da biblioteca do celular, mas não há um jeito de permitir seleção múltipla de imagens, como você pode ver [aqui](https://docs.expo.io/versions/v35.0.0/sdk/imagepicker/#imagepickerlaunchimagelibraryasyncoptions). Há algumas solicitações de recurso aqui:

- [https://expo.canny.io/feature-requests/p/allow-choosing-multiple-images-in-imagepicker](https://expo.canny.io/feature-requests/p/allow-choosing-multiple-images-in-imagepicker)
- [https://expo.canny.io/feature-requests/p/multiple-images-and-cameravideo-access-for-image-picker](https://expo.canny.io/feature-requests/p/multiple-images-and-cameravideo-access-for-image-picker)

# A solução com React Hooks

Em React Native, você pode usar a **Camera Roll API** para obter mídia da biblioteca do celular; então por que não criar um hook para isso? :]

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

Depois disso, você simplesmente usa assim:

```js
// path to your hooks
import { useCameraRoll } from 'shared/hooks';

// ...

function SomeComponent() {
	const [photos, getPhotos] = useCameraRoll({ first: 80 });

	// ...
}
```

Você pode usar `getPhotos` na prop `onEndReached` de um `FlatList`, por exemplo. Problema resolvido :]

### References

- [https://facebook.github.io/react-native/docs/cameraroll.html](https://facebook.github.io/react-native/docs/cameraroll.html)
- [https://reactjs.org/docs/hooks-intro.html](https://reactjs.org/docs/hooks-intro.html)
- [https://reactjs.org/docs/hooks-overview.html](https://reactjs.org/docs/hooks-overview.html)
