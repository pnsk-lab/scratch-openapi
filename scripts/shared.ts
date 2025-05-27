import * as fs from 'node:fs/promises'
export const getSchemIDs = async () => {
	return (await fs.readdir('src')).filter((v) => v !== 'shared.ts')
}
