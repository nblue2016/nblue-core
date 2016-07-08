require('../../runtime')

const path = require('path')
const ConfigMap = require('../../lib/conf/conf')

const configFile = path.join(__dirname, 'config.yml')
const config = ConfigMap.parseConfigSync(configFile)

for (const [k, v]
  of config.get('databases').entries()) {
  console.log(`${k}:${v}`)
}
