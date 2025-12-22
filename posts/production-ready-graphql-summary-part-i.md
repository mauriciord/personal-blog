---
title: Production Ready GraphQL Summary — Part I
slug: production-ready-graphql-summary-part-i
description: "I'm reading this book with GraphQL content. Thanks @leonardomso Pagination: Cursor Pagination Cursor pagination is generally a great choice, because of the accuracy and performance Maybe it's the..."
tags: []
added: 2020-04-23T13:26:18.000Z
---

I'm reading this [book with GraphQL content](https://book.productionreadygraphql.com/).

Thanks @leonardomso

![book](/assets/production-ready-graphql-summary-part-i/LDWLEj47P.png)

## Pagination: Cursor Pagination
- Cursor pagination is generally a great choice, because of the accuracy and performance
- Maybe it's the most common pattern in GraphQL at the moment
- This pattern lets us design more complex use cases, because of Connection and Edge types
- Relay clients integrate perfectly with your API because of that

## Global Identification: Global ID — Node
- Like Connections, they can be a good pattern even outside of a Relay context
- Opaque IDs are recommended
- You necessarily don't need global identification if you're not planning to use Relay
- Ensure your global identification contains enough context to globally route to a node, especially in a distributed architecture

## Non-Nullability
- It lets clients avoid defensive code/conditionals
- It helps to build more predictable schemas

**tradeoffs/warnings:**

- It's very hard to predict what can be null
- Non-null fields and arguments are harder to evolve. Going from non-null to null is a breaking change, but the opposite is not

**guidelines for nullability:**

- Should almost always nullable fields that return object types that are backed by database associations, network calls, or anything that could potentially fail
- Non-null for arguments, because it's more predictable and easy to understand API

That's it.
My first part of the book summary. Thank you.
