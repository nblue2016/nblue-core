const jsYaml = require('js-yaml')

class YAML
{

  static parse (yaml) {
    return jsYaml.safeLoad(yaml)
  }

  static stringify (value, options) {
    return jsYaml.safeDump(value, options)
  }

}

module.exports = YAML
