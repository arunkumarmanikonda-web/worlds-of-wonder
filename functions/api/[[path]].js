export async function onRequest(context) {
  const url = new URL(context.request.url);
  const rail = "https://worlds-of-wonder-production.up.railway.app";
  const railwayUrl = rail + url.pathname + url.search;
  if (context.request.method === "OPTIONS") {
    return new Response(null, {headers:{
      "Access-Control-Allow-Origin":"*",
      "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers":"Content-Type,Authorization"
    }});
  }
  const response = await fetch(railwayUrl, {
    method: context.request.method,
    headers: context.request.headers,
    body: ["GET","HEAD"].includes(context.request.method) ? undefined : context.request.body
  });
  return new Response(response.body, {
    status: response.status,
    headers: {
      "Access-Control-Allow-Origin":"*",
      "Content-Type": response.headers.get("Content-Type") || "application/json"
    }
  });
}
