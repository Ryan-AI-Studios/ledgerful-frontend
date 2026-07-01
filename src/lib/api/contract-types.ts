import type { paths } from "./generated";

type PathMethod<P extends keyof paths, M extends keyof paths[P]> = paths[P][M];

export type ExtractResponse<
  Route extends keyof paths,
  Method extends keyof paths[Route],
> = PathMethod<Route, Method> extends {
  responses: { 200: { content: { "application/json": infer R } } };
}
  ? R
  : never;

export type ExtractBody<
  Route extends keyof paths,
  Method extends keyof paths[Route],
> = PathMethod<Route, Method> extends {
  requestBody: { content: { "application/json": infer B } };
}
  ? B
  : never;

export type ExtractQuery<
  Route extends keyof paths,
  Method extends keyof paths[Route],
> = PathMethod<Route, Method> extends {
  parameters: { query?: infer Q };
}
  ? Q
  : never;
