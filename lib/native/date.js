const DayShortNames = {
  $$0: 'Sun',
  $$1: 'Mon',
  $$2: 'Tue',
  $$3: 'Wed',
  $$4: 'Thr',
  $$5: 'Fri',
  $$6: 'Sat'
}

const DayNames = {
  $$$0: 'Sunday',
  $$$1: 'Monday',
  $$$2: 'Tuesday',
  $$$3: 'Wednesday',
  $$$4: 'Thursday',
  $$$5: 'Friday',
  $$$6: 'Saturday'
}

const MonthShortNames = {
  __10: 'Oct',
  __11: 'Nov',
  __12: 'Dec',
  __1: 'Jan',
  __2: 'Feb',
  __3: 'Mar',
  __4: 'Apr',
  __5: 'May',
  __6: 'Jun',
  __7: 'Jul',
  __8: 'Aug',
  __9: 'Sep'
}

const MonthNames = {
  ___10: 'October',
  ___11: 'November',
  ___12: 'December',
  ___1: 'January',
  ___2: 'February',
  ___3: 'March',
  ___4: 'April',
  ___5: 'May',
  ___6: 'June',
  ___7: 'July',
  ___8: 'August',
  ___9: 'September'
}

const createDict = (ctx) => {
  const dict = {
    dddd: `$$$$$$${ctx.getDay()}`,
    ddd: `$$$$${ctx.getDay()}`,
    dd: ctx.getDate().
          toString().
          padStart(2, '0'),
    d: ctx.getDate(),
    MMMM: `___${ctx.getMonth() + 1}`,
    MMM: `__${ctx.getMonth() + 1}`,
    MM: (ctx.getMonth() + 1).
            toString().
            padStart(2, '0'),
    M: (ctx.getMonth() + 1).
                    toString(),
    yyyy: ctx.getFullYear(),
    yyy: ctx.getFullYear(),
    yy: ctx.getFullYear().
            toString().
            substr(2, 2),
    HH: ctx.getHours().
                    toString().
                    padStart(2, '0'),
    H: ctx.getHours(),
    hh: (ctx.getHours() % 12 || 12).
        toString().
        padStart(2, '0'),
    h: (ctx.getHours() % 12 || 12).
            toString(),
    mm: ctx.getMinutes().
            toString().
            padStart(2, '0'),
    m: ctx.getMinutes(),
    ss: ctx.getSeconds().
            toString().
            padStart(2, '0'),
    s: ctx.getSeconds(),
    L: (() => {
      let m = ctx.getMilliseconds()

      if (m > 99) m = Math.round(m / 10)

      return m.toString().padStart(3, '0')
    })(),
    l: ctx.getMilliseconds().
          toString().
          padStart(3, '0'),
    S: ctx.getMilliseconds(),
    TT: ctx.getHours() < 12 ? 'AM' : 'PM',
    tt: ctx.getHours() < 12 ? 'am' : 'pm',
    z: ctx.toUTCString().match(/[A-Z]+$/)
  }

  return dict
}

if (!Date.prototype.format) {
  Date.prototype.format = function (format, options) {
    const ctx = this
    const dict = createDict(ctx)

    let
      newFormat = format,
      newOptions = options

    if (!newOptions) {
      newOptions = {}
      newOptions.supportName = false
    }

    for (const key of Object.keys(dict)) {
      if (new RegExp(`(${key})`).test(newFormat)) {
        newFormat = newFormat.replace(RegExp.$1, dict[key])
      }
    }

    if (newOptions.supportName) {
      for (const key of Object.keys(DayNames)) {
        if (newFormat.indexOf(key) >= 0) {
          newFormat = newFormat.replace(key, DayNames[key])
        }
      }

      for (const key of Object.keys(DayShortNames)) {
        if (newFormat.indexOf(key) >= 0) {
          newFormat = newFormat.replace(key, DayShortNames[key])
        }
      }

      for (const key of Object.keys(MonthNames)) {
        if (newFormat.indexOf(key) >= 0) {
          newFormat = newFormat.replace(key, MonthNames[key])
        }
      }
      for (const key of Object.keys(MonthShortNames)) {
        if (newFormat.indexOf(key) >= 0) {
          newFormat = newFormat.replace(key, MonthShortNames[key])
        }
      }
    }

    return newFormat
  }
}

if (!Date.hasOwnProperty('parseDate')) {
  Reflect.defineProperty(
    Date,
    'parseDate',
    {
      value: (text) => new Date(Date.parse(text))
    }
  )
}
