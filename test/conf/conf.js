const assert = require('assert')
const path = require('path')

const core = require('../../lib')
const aq = core.aq
const ConfigMap = core.ConfigMap

const cf = new ConfigMap()

describe('conf', () => {
  it('get/set key-value', () => {
    // test set key and get key
    cf.set('key1', 1).set('key2', 'test string')
    assert.equal(cf.get('key1'), 1, 'get key1')
    assert.equal(cf.get('key2'), 'test string', 'get key2')
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
    const m1 = new ConfigMap()
    const cf3 = new ConfigMap()

    m1.set('k1', 'v1').set('k2', 'v2')
    cf3.copy(m1)

    assert.equal(cf3.get('k1'), 'v1', 'copied k1')
    assert.equal(cf3.get('k2'), 'v2', 'copied k2')
  })

  it('check read configuration file', (done) => {
    // get full file path and parse it for JSON format
    const configJSONFile = path.join(__dirname, 'config.json')
    const configYamlFile = path.join(__dirname, 'config.yml')

    let
      configFromJSON = null,
      configFromYaml = null

    aq.
      readFile(configJSONFile, { encoding: 'utf-8' }).
      then((data) => {
        configFromJSON = ConfigMap.parseJSON(data)

        return aq.readFile(configYamlFile, { encoding: 'utf-8' })
      }).
      then((data) => {
        configFromYaml = ConfigMap.parseYAML(data)

        const configs = [configFromJSON, configFromYaml]

        configs.forEach((config) => {
          assert.equal(config.get('name'), 'test file', 'get name from config')

          const databases = config.get('databases')

          if (!databases) throw new assert.AssertionError('get datatabase node')

          assert.equal(databases.has('dbtest'), true, 'got dbtest node')
          assert.equal(databases.has('dbsys'), true, 'got dbsys node')
          assert.notEqual(
            databases.has('dbuser'), true, 'doesn\'t got dbuser node')
        })

        done()
      }).
      catch((err) => done(err))
  })

  it('check parse configuration file', (done) => {
    const configFile = path.join(__dirname, 'config.yml')

    ConfigMap.
      parseConfig(configFile, ['debug', 'qa']).
      then((data) => {
        assert.equal(
          data.get('databases').get('dbtest'),
          'connection string for test with debug mode',
          'get databases.dbtest from config by callback'
        )

        done()
      }).
      catch((err) => done(err))
  })


  it('check parse configuration file by callback', (done) => {
    const configFile = path.join(__dirname, 'config.yml')

    ConfigMap.
        parseConfig(configFile, 'debug', (err, data) => {
          if (err) {
            done(err)

            return
          }

          assert.equal(
            data.get('databases').get('dbtest'),
            'connection string for test with debug mode',
            'get databases.dbtest from config'
          )

          done()
        })
  })

  it('check parse configuration file sync', (done) => {
    const configFile = path.join(__dirname, 'config.yml')

    try {
      const data = ConfigMap.parseConfigSync(configFile)

      assert.equal(
        data.get('databases').get('dbtest'),
        'connection string for test with debug mode',
        'get databases.dbtest from config'
      )

      done()
    } catch (err) {
      done(err)
    }
  })

  it('check parse invalid configuration file', (done) => {
    const configFile = path.join(__dirname, 'error.yml')

    ConfigMap.
      parseConfig(configFile).
      then((data) => {
        if (!data) {
          // try to prase a configuration file that doesn't exist
          done()

          return
        }

        done(new Error('get data for by invalid file name.'))
      }).
      catch((err) => done(err))
  })
})
