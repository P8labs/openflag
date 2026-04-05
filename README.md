# OpenFlag

openflag is tool for understand any codebase fast.

just paste github repo and it will show what is happening inside code.

## why this

when we open new repo it is very confusing  
too many files  
dont know where to start

this tool try to solve this.

## what it do (mvp)

- repo summary
- detect stack (node, react, go, etc)
- find entry point
- show important dependencies
- show basic program flow
- group files by feature (like auth, api, db)

## how it works (simple)

1. user give github repo
2. system clone repo
3. scan files
4. detect patterns (no ai for most part)
5. generate summary + structure

## tech

- go (worker + api)
- postgres (store data)
- redis (queue)
- react (simple ui)

## current status

building... not ready

## goal

understand any codebase in few seconds  
no need to read 100 files

## future

- better flow detection
- ask questions on repo
- github login
- caching with commits

## note

this is early project  
things can break  
logic not perfect
