import { build } from './builder.ts'
import { toSSG } from 'hono/ssg'
import app from './dev.ts'
import * as fs from 'node:fs/promises'

await Promise.all(['api.scratch.mit.edu'].map(build))

await toSSG(app, fs, {
  dir: 'dist',
})
