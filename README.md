<p align="center">
  <a name="brand" href="#">
    <img src="./docs/sql_generate_logo.png">
  </a>
</p>

<p align="center">
  <b><a href="#overview">Overview</a></b>
  |
  <b><a href="#features">Features</a></b>
  |
  <b><a href="#installation">Installation</a></b>
  |
  <b><a href="#credits">Credits</a></b>
  |
  <b><a href="#issues">Issues</a></b>
</p>

<br>

<p align="center">
  <a href="https://sqlast.herokuapp.com/"> 
    <img src="https://sqlast.herokuapp.com/badge.svg" alt=" "> 
  </a>
  <a href="https://travis-ci.org/jdrew1303/sqlgenerate"> 
    <img src="https://img.shields.io/travis/jdrew1303/sqlgenerate.svg?style=flat-square" alt=" "> 
  </a>
  <a href="./LICENSE"> 
    <img src="http://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt=" "> 
  </a>
  <a href=""> 
    <img src="https://img.shields.io/badge/platform-Browser%20%7C%20Node.js-808080.svg?style=flat-square" alt=" "> 
  </a>
  <a href="https://travis-ci.org/jdrew1303/sqltraverse"> 
    <img src="https://img.shields.io/badge/documentation-below-green.svg?style=flat-square" alt=" "> 
  </a>
</p>

## Overview

SQLGenerate takes the [Codeschool sqlite-parser](https://github.com/codeschool/sqlite-parser/) AST and generates SQL from it. This allows you to read code (using the Codeschool parser), manipulate the AST (using [SQLTraverse](https://github.com/jdrew1303/sqltraverse)) and then generate SQL (using this library :smile:).

<p align="right"><a href="#top">⬆️</a></p>

## Features


<p align="right"><a href="#top">⬆️</a></p>

## Installation

`npm install sqlgenerator` 👍 done!

<p align="right"><a href="#top">⬆️</a></p>

### Using this project

The blow example is a simple case of parsing SQL to an ast and then back again to SQL. One of the better use case for this is to modify your SQL somehow. To do this you can use [sqltraverse](https://github.com/jdrew1303/sqltraverse) (yes it's a shameless plug 😁). 


```javascript
import parser       from 'sqlite-parser';
import { generate } from 'sqlgenerate';
import { format }   from "sql-formatter";

const example = `
  SELECT m.title, r.id AS [Theatre Number]
  FROM Movies AS m
  INNER JOIN (
    SELECT r2.movie_id
    FROM Rooms AS r2
    WHERE (r2.seats >= 50)
  ) AS r
  ON ((m.id = r.movie_id) AND (m.title != 'Batman'));`

const ast = parser(sql);
const regeneratedSQL = generate(ast);

console.log(format(regeneratedSQL));
```


<p align="right"><a href="#top">⬆️</a></p>

## Credits

[![jdrew1303](https://avatars0.githubusercontent.com/u/2535432?v=3&s=40)](https://twitter.com/intent/follow?screen_name=j_drew1303 "Follow @j_drew1303 on Twitter")

Copyright (c) 2016

## Issues
- Tests, tests and more tests.
- Documentation currently under construction (The examples need to be worked through for SQL instead of JavaScript).
- AST is currently in a state of flux for some node types. We also probably need a builder for these nodes (another project).
- You need to pass in `ast.statement` and not just the raw `ast` given back from the parser (This is an issue with the base node not having a type).
- Adding support for comments.
- Adding support for source-maps.

<p align="right"><a href="#top">⬆️</a></p>