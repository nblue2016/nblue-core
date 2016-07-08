script({
  $metas: {
    $version: '1.0.0',
    $args: {
      a1: 6,
      a2: {
        default: 'test',
        type: 'string'
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
