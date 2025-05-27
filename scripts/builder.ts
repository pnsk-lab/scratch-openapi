import * as fs from 'node:fs/promises'
import UnpluginTypia from '@ryoppippi/unplugin-typia/bun'
import yaml from 'yaml'

export const build = async (id: string) => {
	const built = await Bun.build({
		entrypoints: [`./src/${id}/index.ts`],
		plugins: [
			UnpluginTypia({
				cache: true,
			}),
		],
	})

	const js = (await built.outputs[0]?.text()) ?? ''
	const blob = new Blob([js], { type: 'application/javascript' })
	const url = URL.createObjectURL(blob)
	const mod = await import(url)
	URL.revokeObjectURL(url)
	await Bun.write(`./schema/${id}.yaml`, await yaml.stringify(mod.default))
}
export const startBuilder = async () => {
	const hasToBuild = new Set<string>()
	const building = new Set<string>()

	setInterval(() => {
		for (const apiId of hasToBuild) {
			if (building.has(apiId)) {
				continue
			}
			building.add(apiId)
			build(apiId).then(() => {
				building.delete(apiId)
			})
		}
		hasToBuild.clear()
	}, 100)
	for await (const evt of fs.watch('./src', { recursive: true })) {
		if (evt.eventType === 'change') {
			const apiId = evt.filename?.split(/[\/\\]/).shift() ?? ''
			hasToBuild.add(apiId)
		}
	}
}
