---
title: "[WIP] Rust  - NOTAS"
slug: wip-rust-notes
locale: pt-BR
description: "Tuple let numbers: (i32, i32, f64) = (1, 2, 3.5); // destructuring let (a, b, c) = numbers; // mutable let mut mau = (10, 11, 12) mau.0 = 90 // (90, 11, 12) mau = (90, 91, 92) // pattern matching..."
tags: []
added: 2023-09-11T23:19:24.304Z
---

### Tupla

```rust
let numbers: (i32, i32, f64) = (1, 2, 3.5);

// destructuring
let (a, b, c) = numbers;

// mutável
let mut mau = (10, 11, 12)
mau.0 = 90 // (90, 11, 12)

mau = (90, 91, 92) // pattern matching
```

> precisa respeitar o tipo para evitar `mismatched types`

### Array

```rust
let neo: [i32;3] = [1, 2, 3]
neo[1] // 2

let mut morpheu = [1.1, 2.2, 3.3]
morpheu[2] = 10.15

// slice
&neo[1..] // [2, 3]
&neo[..2] // [1, 2]
&neo[1..2] // [2]
```

> arrays devem ter apenas um tipo

#### Erro de fora dos limites

* Tentar obter um elemento fora dos limites: **index out of bounds**
    

### Consciência de Memória

* A memória STATIC precisa ter tamanho fixo
    
    * o lifetime é o programa inteiro
        
    * variáveis estáticas
        
    * literais de string
        
    * binário do programa
        
    * a limpeza acontece quando o programa termina
        

```rust
static _Y: u32 = 13
```

* STACK são variáveis locais,
    
    * a memória tem tamanho dinâmico
        
    * cada thread tem uma stack isolada
        
    * argumentos de função
        
    * a limpeza acontece quando a função retorna
        
    * o lifetime é uma função
        

```rust
static _Y: u32 = 13

fn main() {
	let x = 5;
	let z = true;
	let numbers = [1, 2, 3];
}
```

* memória HEAP
    
    * valores que vivem além das funções
        
    * compartilhada entre threads
        
    * valores grandes
        
    * valores grandes
        
    * valores de tamanho dinâmico
        
    * lifetime definido por programadores ou pela linguagem
        

```rust
static _Y: u32 = 13

fn main() {
	let x = 5;
	let z = true;
	let numbers = [1, 2, 3];
	
	let users = get_users();
}
```

### Limpeza de Memória

* método **drop** para limpá-la
