import { typiaToOpenAPI } from '@pnsk-lab/typia-openapi'
import typia from 'typia'

export default typiaToOpenAPI({
	openapi: '3.0.0',
	info: {
		title: 'Scratch API',
		version: '1.0.0',
		description: 'API for Scratch platform',
	},
	servers: [
		{
			url: 'https://api.scratch.mit.edu',
			description: 'Main Scratch API server',
		},
	],
	paths: {
		'/': {
			get: {
				summary: 'Responses API info',
				responses: {
					200: {
						description: 'Successful response',
						content: {
							'application/json': {
								schema: typia.json.schema<{
									/** a url of main website */
									website: string
									api: string
									/** @default help@scratch.mit.edu */
									help: string
								}>(),
							},
						},
					},
				},
			},
		},
	},
})
