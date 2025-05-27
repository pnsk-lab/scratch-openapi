import * as path from 'node:path'
import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { html, raw } from 'hono/html'
import { absolutePath } from 'swagger-ui-dist'
import { startBuilder } from './builder'
import { getSchemIDs as getSchemaIDs } from './shared'

if (import.meta.main) {
	startBuilder()
}
const app = new Hono()

const APIS = await getSchemaIDs()

for (const api of APIS) {
	app.get(`/${api}.yaml`, async (c) => {
		return c.body(await Bun.file(path.join('./schema', `${api}.yaml`)).text())
	})
}

app.get('/', async (c) =>
	c.html(html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Multiple APIs - Swagger UI</title>
        <link
          rel="stylesheet"
          type="text/css"
          href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css"
        />
        <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-standalone-preset.min.js"></script>
        <script>
        window.onload = function() {
            // Swagger UI のインスタンスを生成
            const ui = SwaggerUIBundle({
                urls: ${raw(
									JSON.stringify(
										(await getSchemaIDs()).map((id) => ({
											url: `${process.env.BASE_URL ?? ''}/${id}.yaml`,
											name: id,
										})),
									),
								)},
                layout: "StandaloneLayout",
                dom_id: '#swagger-ui', // Swagger UI を表示する要素のID
                deepLinking: true, // URLのハッシュで状態を共有できるようにする
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
            });
            window.ui = ui;
        };
        </script>
      </body>
    </html>
  `),
)

export default app
