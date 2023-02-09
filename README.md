![image](https://user-images.githubusercontent.com/779748/217842393-67c3d172-8039-490d-b315-e208a68f89ae.png)

# Javascript runtime for Stucco
![Build](https://github.com/graphql-editor/stucco-js/workflows/build/badge.svg)

- [Javascript runtime for Stucco](#javascript-runtime-for-stucco)
- [About](#about)
  - [Configuration file](#configuration-file)
    - [Resolvers](#resolvers)
    - [Custom Scalars](#custom-scalars)
  - [Handler](#handler)
    - [Default export](#default-export)
    - [Handler export](#handler-export)
    - [Named export](#named-export)
    - [Passing arguments to another resolver](#passing-arguments-to-another-resolver)
      - [Resolver "Query.todoOperations"](#resolver-%22querytodooperations%22)
  - [Example](#example)
      - [Basic](#basic)
      - [Using TypeScript](#using-typescript)
  - [Local development](#local-development)

# About

Stucco-js is JavaScript/TypeScript runtime for Stucco. It can be used as a local development environment or as a base library for implementing FaaS runtime.

## Configuration file

`Stucco-js` relies on [Stucco](https://github.com/graphql-editor/stucco) library written in GoLang. Configuration file format is in JSON.

### Resolvers

```json
{
    "resolvers":{
        "RESOLVER_TYPE.RESOLVER_FIELD":{
            "resolve":{
                "name": "PATH_TO_RESOLVER"
            }
        }
    }
}
```

### Custom Scalars

```json
{
    "scalars":{
        "CUSTOM_SCALAR_NAME":{
            "parse":{
                "name": "PATH_TO_RESOLVER"
            },
            "serialize":{
                "name": "PATH_TO_RESOLVER"
            }
        }
    }
}
```

## Handler

You can also return Promise from handler

### Default export

```js
module.exports = (input) => {
    return  "Hello world"
}
```

### Handler export

```js
module.exports.handler = (input) => {
    return "Hello world"
}
```

### Named export

```js
module.exports.someName = (input) => {
    return "Hello world"
}
```

```json
{
    "resolvers":{
        "RESOLVER_TYPE.RESOLVER_FIELD":{
            "resolve":{
                "name": "PATH_TO_RESOLVER.someName"
            }
        }
    }
}
```

### Passing arguments to another resolver

#### Resolver "Query.todoOperations"

```graphql
type TodoOperations{
    getCreditCardNumber(id: String!): String
    showMeTehMoney: Int
}

type Query{
    todoOps: TodoOperations
}
```

```json
{
    "resolvers":{
        "Query.todoOps":{
            "resolve":{
                "name": "lib/todoOps"
            }
        },
        "TopoOps.getCreditCardNumber":{
            "resolve":{
                "name": "lib/getCreditCardNumber"
            }
        }
    }
}
```

`lib/todoOps.js`
```js
module.exports = (input) => {
    return {
        response:{
            creditCards:{
                dupa: "1234-1234-1234-1234",
                ddd: "1222-3332-3323-1233"
            }
        }
    }
}
```

`lib/getCreditCardNumber.js`
```js
module.exports = (input) => {
    const { id } = input.arguments
    return {
        response: input.source.creditCards[id]
    }
}
```

## Example

#### Basic

`schema.graphql`
```graphql
type Query{
    hello: String
}
schema{
    query: Query
}
```

`stucco.json`
```json
{
    "resolvers":{
        "Query.hello":{
            "resolve":{
                "name": "lib/hello"
            }
        }
    }
}
```

`lib/hello.js`
```js
export function handler(input){
    return "Hello world"
}
```

`Test query`
```gql
{
    hello
}
```
```json
{
    "hello": "Hello world"
}
```

This JSON defines resolver

#### Using TypeScript

So if you have your TypeScript  files in src folder you should transpile them to the lib folder and stucco can run it from there.

## Local development

To start local development you need `stucco.json`, `schema.graphql`, file with resolvers in the root folder and inside root folder. To fetch your schema from URL you can use tool like [graphql-zeus](https://github.com/graphql-editor/graphql-zeus) 

Add this script to your package json to test your backend
```json
{
    "scripts":{
        "start": "stucco"
    }
}
```

Or run with npx 
```sh
npx stucco
```
