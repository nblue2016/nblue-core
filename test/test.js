require('../')

// const qs = require('querystring')
// const aq = global.aq
const betch = global.betch
const options = {
  $catchError: true,
  $ignoreError: true,
  $fullReturn: true
}

betch({
  r0: Promise.reject(1),
  r1: Promise.reject(2),
  r2: Promise.reject(3),
  r3: Promise.resolve(4)
}, options).
then((data) => {
  console.log(data)
  console.log('## ok')
}).
catch((err) => {
  console.log('## failed')
  console.log(err)
})


/*
const helloUrl = 'https://hdc.uat.mkiapp.com/client/hello'
const loginUrl = 'https://hdc.uat.mkiapp.com/client/login?sessionId=%s'

let apiUrl =
  'https://uat.api.ap.marykayintouch.com/ap/mapi/v1/'

apiUrl += 'AgreementServices/consultants'

const deviceInfo = {}

deviceInfo['dedev.manufacturer'] = 'Apple'
deviceInfo['app.version'] = '1.0.3'
deviceInfo['dev.uuid'] = 'C4CA34C4-2925-42BD-8C48-8472861197B0'
deviceInfo['app.seed'] = '1454579498.418262'
deviceInfo['os.version'] = '9.2'
deviceInfo['dev.retina'] = 'true'
deviceInfo['app.name'] = 'com.marykay.ap.mobilityApp.nz'
deviceInfo['os.name'] = 'IOS'
deviceInfo['dev.model'] = 'Simulator'
deviceInfo['dev.netType'] = 'UNKNOWN'
deviceInfo['dev.resHeight'] = 716
deviceInfo['dev.type'] = 'Mobile'
deviceInfo['dev.resWidth'] = 414

aq.
  postForm(helloUrl, {}, deviceInfo).
  then((data) => {
    const sessionId = data.sessionId ? data.sessionId : null

    if (!sessionId) throw new Error('Can\'t get session Id')

    console.log(`got session identity`)

    const loginInfo = {}

    loginInfo.loginName = '012573'
    loginInfo.password = 'MKuat2015'
    loginInfo.domain = 'nz'

    return aq.
      postForm(
        String.format(loginUrl, sessionId),
        {},
        loginInfo
      )
  }).
  then((data) => {
    const profile = data.profile ? data.profile : null

    const accessToken = profile.accessToken

    if (!accessToken) throw new Error(`Can\'t found access token.`)

    console.log('got access token')

    let ConsultantId = null

    ConsultantId = profile.ConsultantNumber
    if (ConsultantId.length === 8) ConsultantId = ConsultantId.substr(0, 6)

    const headers = {}

    headers.subsidiary = 'NZ'
    headers.culture = 'en-NZ'
    headers.access_token = accessToken

    console.log('request api')

    const params = {}

    params.format = 'json'
    params.ConsultantId = ConsultantId
    params.IncludeRecruiter = true
    params.IncludeDirector = true
    params.ConsultantSuffix = 'NZ'

    // return aq.get(apiUrl)
    return aq.get(`${apiUrl}?${qs.stringify(params)}`, headers, null)
  }).
  then((data) => {
    console.log('got result')
    console.log(data)
  }).
  catch((err) => {
    if (err) {
      console.log(`#failed, details: ${err.message}`)
      if (err.source) console.log(err.source)
    }
  })
*/
