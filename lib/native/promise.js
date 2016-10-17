// define done method, it can throw error in promise
if (!Promise.prototype.done) {
  Promise.prototype.done =
    function (onFulfilled, onRejected) {
      this.
        then(onFulfilled, onRejected).
        catch(
          (err) => {
            // throw new Error to outside
            setTimeout(() => {
              throw err
            }, 0)
          }
        )
    }
}

// define finally method, it will be executed after then and catch methods
if (!Promise.prototype.finally) {
  Promise.prototype.finally =
    function (callback) {
      return this.
        then(
          (data) =>
            Promise.resolve(callback()).
              then(() => data)
          ,
          (err) =>
            Promise.resolve(callback()).
              then(() => {
                throw err
              })
        )
    }
}

// define map method, map array result of promise .then
if (!Promise.prototype.map) {
  Promise.prototype.map =
    function (callback) {
      return this.
        then(
          (data) =>
            Promise.resolve(Array.isArray(data) ? data.map(callback) : data),
          (err) => Promise.reject(err)
        )
    }
}

// define filter method, filter array result of promise .then
if (!Promise.prototype.filter) {
  Promise.prototype.filter =
    function (callback) {
      return this.
        then(
          (data) => {
            if (Array.isArray(data)) {
              return Promise.resolve(data.filter(callback))
            }

            return Promise.reject(new Error('filter method doesn\'t support'))
          },
          (err) => Promise.reject(err)
        )
    }
}
