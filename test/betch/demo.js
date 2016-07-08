script({
  r1: 1,
  r2: Promise.resolve(2),
  r3: (ctx) => {
    if (ctx.$args && ctx.$args.a1) {
      return ctx.$args.a1
    }

    return 5
  }
})
