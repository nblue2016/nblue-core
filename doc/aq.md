## aq
The aq is a class inherits from co, it includes all features in co and wrap some usefully functions to return a ES6 Promise. You can use it easy to read a file or call an web api. This module uses co and node-fetch moudles by following link
- https://github.com/tj/co

**then()**, packages a value or error to a Promise

code:
``` javascript
const aq = require('nblue').aq

// package a value
aq.
  then(1).
  then((data) => {
    console.log(data) // output 1
  })

// package an error
aq.
  then(null, new Error('an error')).
  catch((err) => {
    console.log(err.message)  // output 'an error'
  })

// or use done() method
aq.
  done(new Error('an error')).
  catch((err) => {
    console.log(err.message)  // output 'an error'
  })
```

**apply()**, invoke a function and return a Promise, the parameters for called function is an array.

code:
``` javascript
const fs = require('fs')
const aq = require('nblue').aq
const filename = 'data.txt'

aq.
  apply(fs, fs.readFile, [filename, 'utf-8']).
  then((data) => {
    console.log(data) // output file data
  }).
  catch((err) => {
    console.log(err)
  })
```

**aq.call()**, invoke a function and return a Promise, the parameters for called function is one by one to follow function name

code:
``` javascript
const fs = require('fs')
const aq = require('nblue').aq
const filename = 'data.txt'

aq.
  call(fs, fs.readFile, filename, 'utf-8').
  then((data) => {
    console.log(data) // output file data.
  }).
  catch((err) => {
    console.log(err)  // output error message if read file failed
  })
```


**aq.rest()**, call a rest service and return a Promise. Below code show how to get data from rest service with GET mothed. Before using rest method, you need install a fetch-http module like node-fetch or request.

for example:
```
npm install node-fetch
or
npm install request
```

code:
``` javascript
const aq = require('nblue').aq

aq.
  rest('http://127.0.0.1:8080/data/test.json').
  then((data) => {
    console.log(data)  // output {"key1":"data1", "key2":"data2"}
  })

// aq.rest() method also support to call complex rest services, the post data and result of rest service must use JSON format

const headers = {"token": "xcvsd23sfs23423"}
const body = {"a1":1, "a2":2}

aq.
  rest('http://127.0.0.1:8080/data/test2.json', 'POST', headers, body).
  then((data) => {
    console.log(data)  // output result
  })
```

**aq.parallel()**, can execute many Promise at the same time and return result within an array.

code:
``` javascript
const aq = require('nblue').aq

aq.
  parallel([
    aq.then(1),
    aq.then(2),
    aq.then(3)
  ]).
  then((data) => {
    console.log(data)  // [1, 2, 3]
  })

// We can complex aq.rest and aq.parallel to batch process a few rest service.
aq.
  parallel([
    aq.rest('http://127.0.0.1:8000?key1=data1&key2=data2'),
    aq.rest('http://127.0.0.1:8000?key3=data3&key4=data4')
  ]).
  then((data) => {
    // output [{"key1":"data1", "key2":"data2"}, {"key3":"data3", "key4":"data4"}]
    console.log(data)
  })
```

**aq.series()**, execute a few Promises one by one and return the result of the latest one

code:
``` javascript
const aq = require('nblue').aq

aq.
  series([
    aq.then(1),
    aq.then(2),
    aq.then(3)
  ]).
  then((data) => {
    console.log(data) // output 3
  })
```

**aq.readFile()**, read a file and return a Promise

code:
``` javascript
const aq = require('nblue').aq
const filename = 'data.txt'

aq.
  readFile(filename, 'utf-8').
  then((data) => {
    console.log(data) // output file data
  })
```
