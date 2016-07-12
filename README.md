# nblue
## Introduction
nblue is core module for nblue services, it supports more useful class in server side. This module was written by ES6, so it'd better run more than node v6.0.

## Installation:
You can use npm to install nblue
```
npm install nblue
```

Run test cases with mocha
```
npm install mocha
npm test
```

## Usage

### betch
**betch** is core module of nblue, it can be easy to apply list of promises one by one or merge their result by array. Also, the betch can apply a predefined script with arguments. betch was created base on co, but it add more complex features, for more details you can read  [this document](https://github.com/nblue2016/nblue/blob/master/doc/betch.md)
``` javascript
const betch = require('nblue').betch

// use an object to execute promises one by one
betch({
  r1: Promise.resolve(1),
  r2: (ctx, data) => Promise.resolve(data + 2),
  r3: (ctx, data) => data + 3
}).
then((data) => {
  console.log(data) // data should be 6
})

// or use array to execute promises with parallel mode
betch([
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3)
]).
then((data) => {
  console.log(data) // data should be [1, 2, 3]
})
```

### aq
**aq** is a static class, it can package a value or function to return a Promise. You can see following example to learn main usage about it, for more details, please see the [document](https://github.com/nblue2016/nblue/blob/master/doc/aq.md) by link

``` javascript
const aq = require('nblue').aq

// promise a value
aq.
  then('test').
  then((data) => {
    console.log(data) // data is test
  })

// read an file
const path = require('path')
const file = path.join(__dirname, 'test.dat')

aq.
  readFile(file, { encoding: 'utf-8' }).
  then((data) => {
    console.log(data) // output file content
  })

// invoke rest method
aq.
  rest("http://127.0.0.1:8080/?key1=val1&key2=val2").
  then((data) => {
    console.log(data) // output the response body by web api
  }).
  catch((err) => {
    console.log(err) // output error message
  })

```

### native object extends
nblue extends some methods for native object

Append finally and done method for Promise
``` javascript

```

StringBuilder class

Add some methods for date object

### ConfigMap and Logger


For more details, you can find these by following link
- [betch](https://github.com/nblue2016/nblue/blob/master/doc/betch.md)
- [aq](https://github.com/nblue2016/nblue/blob/master/doc/aq.md)
- [native extend](https://github.com/nblue2016/nblue/blob/master/doc/native.md)
- [configmap](https://github.com/nblue2016/nblue/blob/master/doc/configmap.md)
- [logger](https://github.com/nblue2016/nblue/blob/master/doc/logger.md)

## License

Released under the MIT license.

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
