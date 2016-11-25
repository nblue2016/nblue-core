const assert = require('assert')
const path = require('path')
const nblue = require('../../lib')

const aq = nblue.aq
const ConfigMap = nblue.ConfigMap
const IIf = nblue.IIf

const cf = new ConfigMap()

describe('config', () => {
  it('get/set key-value', () => {
    const val1 = 1
    const val2 = 'test string'

    // test set key and get key
    cf.
      set('key1', val1).
      set('key2', val2)

    assert.equal(cf.get('key1'), val1, 'get key1')
    assert.equal(cf.get('key2'), val2, 'get key2')
  })

  it('toJson function', () => {
    // test toJSON function
    const cfJSON = `{"key1":1,"key2":"test string"}`

    assert.equal(cf.toJSON(), cfJSON, 'toJSON function')
  })

  it('clone function', () => {
    // test copy function
    const cf2 = cf.clone()

    assert.deepEqual(cf.toObject(), cf2.toObject(), 'clone function')
  })

  it('copy function', () => {
    const cm1 = new ConfigMap()
    const cm2 = new ConfigMap()

    const key1 = 'k1'
    const key2 = 'k2'
    const val1 = 'v1'
    const val2 = 'v2'

    cm1.
      set(key1, val1).
      set(key2, val2)

    cm2.copy(cm1)

    assert.equal(cm2.get(key1), val1, 'copied k1')
    assert.equal(cm2.get(key2), val2, 'copied k2')
  })

  it('read configuration file', (done) => {
    // get full file path and parse it for JSON format
    const configJSONFile = path.join(__dirname, 'config.json')
    const configYamlFile = path.join(__dirname, 'config.yml')

    const keyOfName = 'name'
    const valueOfName = 'test file'

    aq.
      parallel([
        aq.readFile(configJSONFile, { encoding: 'utf-8' }),
        aq.readFile(configYamlFile, { encoding: 'utf-8' })
      ]).
      then((data) => [
        ConfigMap.parseJSON(data[0]),
        ConfigMap.parseYAML(data[1])
      ]).
      then((data) => {
        data.forEach((config) => {
          assert.equal(
            config.get(keyOfName), valueOfName, 'get value by name key'
          )

          // check database section in config
          const databases = config.get('databases')

          if (!databases) {
            throw new assert.AssertionError('hasn\'t datatabase node')
          }

          assert.ok(databases.has('dbtest'), 'has dbtest key')
          assert.ok(databases.has('dbsys'), 'has dbsys key')
          assert.ok(!databases.has('dbuser'), 'hasn\'t dbuser key')

          // check settings section in config
          const settings = config.Settings

          assert.equal(settings.get('port'), 8088, 'ok')
          assert.equal(settings.get('port2'), null, 'ok')
          assert.equal(settings.get('port2', 8090), 8090, 'ok')
        })
      }).
      then(() => done()).
      catch((err) => done(err))
  })

  it('parse configuration file', (done) => {
    const configFile = path.join(__dirname, 'config.yml')

    ConfigMap.
      parseConfig(configFile, ['debug', 'qa']).
      then((data) => {
        const source = data.get('databases').get('dbtest')
        const target = 'connection string for test with debug mode'

        assert.equal(source, target, 'compare value')
      }).
      then(() => done()).
      catch((err) => done(err))
  })

  it('parse configuration file by callback', (done) => {
    const configFile = path.join(__dirname, 'config.yml')

    ConfigMap.
        parseConfig(configFile, 'debug', (err, data) => {
          if (err) return done(err)

          const source = data.get('databases').get('dbtest')
          const target = 'connection string for test with debug mode'

          assert.equal(source, target, 'compare value')

          return done()
        })
  })

  it('parse configuration file sync', () => {
    const configFile = path.join(__dirname, 'config.yml')

    const data = ConfigMap.parseConfigSync(configFile)

    assert.equal(
      data.get('databases').get('dbtest'),
      'connection string for test with debug mode',
      'get databases.dbtest from config'
    )
  })

  it('parse invalid configuration file', (done) => {
    const configFile = path.join(__dirname, 'error.yml')

    ConfigMap.
      parseConfig(configFile).
      then((data) => IIf(data, Promise.reject(-1), 1)).
      catch(() => null).
      then(() => done()).
      catch((err) => done(err))
  })
})
