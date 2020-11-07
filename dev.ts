import {
  bold,
  yellow,
} from "https://deno.land/std@0.75.0/fmt/colors.ts";
import {
  Application,
  Router,
  RouterContext,
  send,
  Status,
} from "https://deno.land/x/oak/mod.ts";

async function serveTicker(context: RouterContext) {
  try {
    const { headers } = context.request;
    const body = context.request.body();
    const contentType = headers.get("content-type") || "";
    if (
      context.request.method === "POST" &&
      contentType.includes("application/json")
    ) {
      const payload = await body.value;
      const { token } = payload;
      console.log("token: ", token);
      const API_KEY = Deno.env.get('API_KEY');
      const API_URL =
        `https://api.ethplorer.io/getAddressInfo/${token}?apiKey=${API_KEY}&showETHtotals=true`;

      let response = await fetch(API_URL);
      const json = await response.json();
      context.response.status = Status.OK;
      context.response.body = JSON.stringify(json);
      context.response.type = "json";
      return;
    }
    context.throw(Status.BadRequest, "Bad Request");
  } catch (error) {
    throw new Error(error);
  }
}

const router = new Router();

router.post("/api/ticker", serveTicker);
const app = new Application();

app.use(router.routes());

app.use(router.allowedMethods());

app.use(async (context) => {
  await send(context, context.request.url.pathname, {
    root: `${Deno.cwd()}/public`,
    index: "index.html",
  });
});

app.addEventListener("listen", ({ hostname, port }) => {
  console.log(
    bold("Start listening on ") + yellow(`${hostname}:${port}`),
  );
});
async function main() {
  await app.listen({ port: 8000 });
}
main();