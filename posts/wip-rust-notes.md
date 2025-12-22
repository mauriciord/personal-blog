---
title: "[WIP] Rust  - NOTES"
slug: wip-rust-notes
description: "Tuple let numbers: (i32, i32, f64) = (1, 2, 3.5); // destructuring let (a, b, c) = numbers; // mutable let mut mau = (10, 11, 12) mau.0 = 90 // (90, 11, 12) mau = (90, 91, 92) // pattern matching..."
tags: []
added: 2023-09-11T23:19:24.304Z
---

### Tuple

```rust
let numbers: (i32, i32, f64) = (1, 2, 3.5);

// destructuring
let (a, b, c) = numbers;

// mutable
let mut mau = (10, 11, 12)
mau.0 = 90 // (90, 11, 12)

mau = (90, 91, 92) // pattern matching
```

> need to respect the type to avoid `mismatched types`

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

> arrays should have only one type

#### Out-of-bound error

* Trying to get an element out of the limits: **index out of bounds**
    

### Memory Awareness

* STATIC memory needs fixed-size
    
    * lifetime is the whole program
        
    * static variables
        
    * string literals
        
    * program binary
        
    * Cleanup is when the program terminates
        

```rust
static _Y: u32 = 13
```

* STACK are local variables,
    
    * memory has a dynamic size
        
    * Each thread has an isolated stack
        
    * function arguments
        
    * Cleanup is when the function returns
        
    * lifetime is a function
        

```rust
static _Y: u32 = 13

fn main() {
	let x = 5;
	let z = true;
	let numbers = [1, 2, 3];
}
```

* HEAP memory
    
    * values that live beyond functions
        
    * shared across threads
        
    * large values
        
    * large values
        
    * dynamic size values
        
    * lifetime defined by programmers or language
        

```rust
static _Y: u32 = 13

fn main() {
	let x = 5;
	let z = true;
	let numbers = [1, 2, 3];
	
	let users = get_users();
}
```

### Memory Cleanup

* **drop** method to clean up it