const assert = require('assert')

describe('date functions', () => {
  it('method of format', () => {
    const d1 = new Date(2016, 1, 5, 14, 33, 12)
        // Date.parseDate('2016/02/05 14:33:12')
    const d2 = '2016/02/05 14:33:12'.toDate()
    const d3 = new Date(2016, 1, 5, 9, 3, 1)
        // Date.parseDate('2016/02/05 9:3:1')
    const d4 = '2016/05/24 9:3:1'.toDate()
    const d5 = '2015/11/24 9:3:1'.toDate()

    assert.equal(d1.format('MM/dd/yyyy'), '02/05/2016',
        "date.format('MM/dd/yyyy') should equal '02/05/2016'")
    assert.equal(d1.format('M/d/yy'), '2/5/16',
        "date.format('M/d/yy') should equal '2/5/16'")
    assert.equal(d2.format('MM/dd/yyyy'), '02/05/2016',
        "date.format('MM/dd/yyyy') should equal '02/05/2016'")
    assert.equal(d2.format('M/d/yy'), '2/5/16',
        "date.format('M/d/yy') should equal '2/5/16'")
    assert.equal(d1.format('HH-mm-ss'), '14-33-12',
        "date.format('HH-mm-ss') should equal '14-33-12'")
    assert.equal(d1.format('H-m-s'), '14-33-12',
        "date.format('H-m-s') should equal '14-33-12'")
    assert.equal(d3.format('HH-mm-ss'), '09-03-01',
        "date.format('HH-mm-ss') should equal '09-03-01'")
    assert.equal(d3.format('H-m-s'), '9-3-1',
        "date.format('H-m-s') should equal '9-3-1'")

    assert.equal(d1.format('HH-mm-ss tt'), '14-33-12 pm',
        "date.format('HH-mm-ss tt') should equal '14-33-12 pm'")
    assert.equal(d1.format('HH-mm-ss TT'), '14-33-12 PM',
        "date.format('HH-mm-ss TT') should equal '14-33-12 PM'")
    assert.equal(d3.format('H-m-s tt'), '9-3-1 am',
        "date.format('H-m-s tt') should equal '9-3-1 am'")
    assert.equal(d3.format('H-m-s TT'), '9-3-1 AM',
        "date.format('H-m-s TT') should equal '9-3-1 AM'")

    assert.equal(d4.format('ddd', { supportName: true }), 'Tue',
        "date.format('ddd') should equal 'Tue'")
    assert.equal(d4.format('dddd', { supportName: true }), 'Tuesday',
        "date.format('dddd') should equal 'Tuesday'")

    assert.equal(d1.format('MMM', { supportName: true }), 'Feb',
        "date.format('MMM') should equal 'Feb'")
    assert.equal(d1.format('MMMM', { supportName: true }), 'February',
        "date.format('MMMM') should equal 'February'")

    assert.equal(d5.format('MMM', { supportName: true }), 'Nov',
        "date.format('MMM') should equal 'Nov'")
    assert.equal(d5.format('MMMM', { supportName: true }), 'November',
        "date.format('MMMM') should equal 'November'")
  })

  it('method of isLeapYear', () => {
    assert.ok(Date.isLeapYear(2000), '2000 is leap year')
    assert.ok(!Date.isLeapYear(2010), '2010 is not leap year')
    assert.ok(Date.isLeapYear(2012), '2012 is leap year')
    assert.ok(!Date.isLeapYear(2014), '2014 is not leap year')
    assert.ok(!Date.isLeapYear(2015), '2015 is not leap year')
    assert.ok(Date.isLeapYear(2016), '2016 is leap year')

    assert.ok((new Date(2000, 1, 1)).isLeapYear(), '2000 is leap year')
    assert.ok(!(new Date(2010, 1, 1)).isLeapYear(), '2010 is not leap year')
    assert.ok((new Date(2012, 1, 1)).isLeapYear(), '2012 is leap year')
    assert.ok(!(new Date(2014, 1, 1)).isLeapYear(), '2014 is not leap year')
    assert.ok(!(new Date(2015, 1, 1)).isLeapYear(), '2015 is not leap year')
    assert.ok((new Date(2016, 1, 1)).isLeapYear(), '2016 is leap year')
  })

  it('method of getDaysInMonth', () => {
    assert.equal(Date.getDaysInMonth(2010, 0), 31, 'days in month (2010, 1)')
    assert.equal(Date.getDaysInMonth(2010, 1), 28, 'days in month (2010, 2)')
    assert.equal(Date.getDaysInMonth(2010, 2), 31, 'days in month (2010, 3)')
    assert.equal(Date.getDaysInMonth(2010, 3), 30, 'days in month (2010, 4)')
    assert.equal(Date.getDaysInMonth(2010, 4), 31, 'days in month (2010, 5)')
    assert.equal(Date.getDaysInMonth(2010, 5), 30, 'days in month (2010, 6)')
    assert.equal(Date.getDaysInMonth(2010, 6), 31, 'days in month (2010, 7)')
    assert.equal(Date.getDaysInMonth(2010, 7), 31, 'days in month (2010, 8)')
    assert.equal(Date.getDaysInMonth(2010, 8), 30, 'days in month (2010, 9)')
    assert.equal(Date.getDaysInMonth(2010, 9), 31, 'days in month (2010, 10)')
    assert.equal(Date.getDaysInMonth(2010, 10), 30, 'days in month (2010, 11)')
    assert.equal(Date.getDaysInMonth(2010, 11), 31, 'days in month (2010, 12)')
    assert.equal(Date.getDaysInMonth(2012, 1), 29, 'days in month (2012, 2)')
    assert.equal(Date.getDaysInMonth(2014, 1), 28, 'days in month (2014, 2)')
    assert.equal(Date.getDaysInMonth(2016, 1), 29, 'days in month (2016, 2)')
  })

  it('method of addDays', () => {
      // const date1 = Date.parseDate('2016/04/29')
      // const date3 = Date.parseDate('2016/04/29')
    const date1 = new Date(2016, 3, 29, 0, 0, 0)
    const date2 = new Date(2016, 4, 29, 0, 0, 0)
    const date3 = new Date(2016, 5, 28, 0, 0, 0)
    const date1b = Date.parseDate('2016/04/29')
    const date2b = Date.parseDate('2016/05/29')
    const date3b = Date.parseDate('2016/06/28')


    assert.deepEqual(date2, date1.addDays(30), 'add 30 days')
    assert.deepEqual(date2b, date1b.addDays(30), 'add 30 days b')

    assert.deepEqual(date3, date2.addDays(30), 'add 30 days 2')
    assert.deepEqual(date3b, date2b.addDays(30), 'add 30 days b2')
  })

  it('method of addMonths', () => {
      // const date1 = Date.parseDate('2016/04/29')
      // const date3 = Date.parseDate('2016/04/29')
    const date1 = new Date(2016, 3, 29, 0, 0, 0)
    const date2 = new Date(2018, 9, 29, 0, 0, 0)
    const date3 = new Date(2023, 9, 29, 0, 0, 0)
    const date1b = Date.parseDate('2016/04/29')
    const date2b = Date.parseDate('2018/10/29')
    const date3b = Date.parseDate('2023/10/29')


    assert.deepEqual(date2, date1.addMonths(30), 'add 30 months')
    assert.deepEqual(date2b, date1b.addMonths(30), 'add 30 months b')

    assert.deepEqual(date3, date2.addMonths(60), 'add 60 months 2')
    assert.deepEqual(date3b, date2b.addMonths(60), 'add 60 months b2')

    const date4 = new Date(2016, 0, 31, 0, 0, 0)
    const date5 = new Date(2016, 1, 29, 0, 0, 0)

    assert.deepEqual(
      date5,
      date4.addMonths(1),
      'add 1 months when it is in edge')
  })
})
