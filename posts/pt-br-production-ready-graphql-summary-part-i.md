---
title: Resumo de GraphQL Pronto para Produção — Parte I
slug: production-ready-graphql-summary-part-i
locale: pt-BR
description: "Estou lendo este livro sobre GraphQL. Obrigado @leonardomso Paginação: paginação por cursor A paginação por cursor geralmente é uma ótima escolha, por causa da precisão e da performance Talvez seja o..."
tags: []
added: 2020-04-23T13:26:18.000Z
---

Estou lendo este [livro com conteúdo sobre GraphQL](https://book.productionreadygraphql.com/).

Obrigado @leonardomso

![book](/assets/production-ready-graphql-summary-part-i/LDWLEj47P.png)

## Paginação: Paginação por Cursor
- A paginação por cursor geralmente é uma ótima escolha, por causa da precisão e da performance
- Talvez seja o padrão mais comum em GraphQL no momento
- Esse padrão nos permite desenhar casos de uso mais complexos, por causa dos tipos Connection e Edge
- Clientes Relay se integram perfeitamente à sua API por causa disso

## Identificação Global: Global ID — Node
- Assim como Connections, eles podem ser um bom padrão até fora de um contexto Relay
- IDs opacos são recomendados
- Você não necessariamente precisa de identificação global se não pretende usar Relay
- Garanta que sua identificação global tenha contexto suficiente para rotear globalmente até um node, especialmente em uma arquitetura distribuída

## Não Nulidade
- Isso permite que clientes evitem código defensivo/condicionais
- Ajuda a construir schemas mais previsíveis

**tradeoffs/avisos:**

- É muito difícil prever o que pode ser nulo
- Campos e argumentos non-null são mais difíceis de evoluir. Ir de non-null para null é uma breaking change, mas o contrário não é

**diretrizes para nulabilidade:**

- Campos que retornam tipos de objeto e que são sustentados por associações de banco de dados, chamadas de rede ou qualquer coisa que possa falhar devem quase sempre ser nullable
- Non-null para argumentos, porque isso torna a API mais previsível e fácil de entender

É isso.
Minha primeira parte do resumo do livro. Obrigado.
