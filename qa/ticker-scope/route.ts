export async function GET(request: Request) {
  return Response.json({ fixture: 'ticker-route-handler-precedence', probe: request.headers.get('x-ticker-probe') });
}
