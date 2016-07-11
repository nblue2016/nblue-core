// define done method, it can throw error can promise
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

if (!Promise.prototype.finally) {
  Promise.prototype.finally =
    function (callback) {
      const constructor = this.constructor
      const resolve = constructor.resolve

      return this.
        then(
          (data) => resolve(callback()).
            then(() => data),
          (err) => resolve(callback()).
            then(() => {
              throw err
            }
          )
        )
    }
}

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