const http = require('http')
const querystring = require('querystring')
const url = require('url')

const errors =
  Object.toMap({
    403: 'forbidden',
    404: 'not found',
    500: 'server error'
  })

const correctResponseCode = 200
const inCorrectResponseCode = 400

class FakedServer {

  constructor (port) {
    this.server = this.createServer()
    this.port = port
  }

  createServer () {
    const server = http.createServer(this.process)

    server.ctx = this

    return server
  }

  start () {
    if (this.server !== null) {
      try {
        this.server.listen(this.port)
      } catch (err) {
        // console.log('failed: ' + err.message)
        throw err
      }
    }
  }

  stop () {
    if (this.server !== null) {
      this.server.close()
    }
  }

  process (req, res) {
    // get current from server, this should point to created server
    let
      body = null,
      context = null

    if (this && this.ctx) {
      context = this.ctx
    } else {
      context = {}
      context.setResponse = () => null
    }

    // parse request url
    const parsedUrl = url.parse(req.url)

    // convert keys in headers to lower case
    const headerMap =
      new Map(
        Object.
          keys(req.headers || {}).
          map((key) => [key.toLowerCase(), req.headers[key]])
      )

    // create function for set response
    const fnSetResponse = context.setResponse

    const output = () => {
      if (headerMap.has('haserror') ||
            headerMap.has('errorcode')) {
        let errorCode = -1

        if (headerMap.has('errorcode')) {
          errorCode = Number.parseInt(headerMap.get('errorcode'), 10)
        } else {
          errorCode = correctResponseCode
        }

        const errorMessage = errors.has(errorCode) ? errors.get(errorCode) : ''

        fnSetResponse(res, errorCode, body ? body : errorMessage)
      } else {
        const responseBody = body ? body : querystring.parse(parsedUrl.query)

        fnSetResponse(res, correctResponseCode, responseBody)
      }

      res.end()
    }

    // receive body from request
    req.on('data', (data) => {
      if (body === null) {
        body = data.toString()
      } else {
        body += data.toString()
      }
    })

    req.on('end', () => {
      // parse body
      if (body) body = JSON.parse(body)

      // output to response
      output()
    })
  }

  setResponse (res, code, data) {
    if (typeof data === 'string') {
      res.writeHead(code, { 'Content-Type': 'text/plain' })

      if (code >= correctResponseCode &&
          code < inCorrectResponseCode) {
        res.write(data)
      } else {
        res.statusMessage = data
        res.write(data)
      }
    } else if (typeof data === 'object') {
      res.writeHead(code, { 'Content-Type': 'application/json' })
      res.write(JSON.stringify(data))
    } else {
      res.statusCode = code
      res.write(data)
    }
  }

}

module.exports = FakedServer
