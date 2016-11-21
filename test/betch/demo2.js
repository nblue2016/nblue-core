script({
  $metas: {
    $version: '1.0.0',
    $args: {
      a1: {
        default: 6,
        type: 'int'
      },
      a2: {
        default: 'test',
        type: 'string'
      },
      a3: {
        default: '2016/10/10',
        type: 'date'
      }
    }
  },
  $before: (ctx) => [ctx.$args.a1, ctx.$args.a2, 3],
  r1: [
    (ctx, data) => data[0],
    (ctx, data) => data[1],
    (ctx, data) => data[2]
  ]
})
