const jsYaml = require('js-Yaml')

class YAML
{

  static parse (yaml) {
    return jsYaml.safeLoad(yaml)
  }

  static stringify (value, options) {
    return jsYaml.safeDump(value, options)
  }

}

// if (!global.YAML) global.YAML = YAML

module.exports = YAML
