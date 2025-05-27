import * as fs from 'node:fs/promises'
import { toSSG } from 'hono/ssg'
import { build } from './builder.ts'
import app from './dev.ts'
import { getSchemIDs } from './shared.ts'

await Promise.all((await getSchemIDs()).map(build))

await toSSG(app, fs, {
	dir: 'dist',
	extensionMap: {
		'text/plain': 'yaml',
	},
})
