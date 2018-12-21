import { FetchFunction } from "../fetch";
import { ProxyFunction } from "../proxy";
import { Pipe, pipe } from "../pipeline";

export interface ResponseHeadersOptions {
  headers?: {};
}

export function responseHeaders(options: ResponseHeadersOptions = {}): Pipe {
  const { headers } = options;
  
  return pipe("responseHeaders", (fetch) => {
    if (!headers || Object.keys(headers).length === 0) {
      console.log("no response headers set, skipping");
      return fetch;
    }

    return async function responseHeaders(req: RequestInfo, init?: RequestInit) {
      const resp = await fetch(req, init)

      for (const [k, v] of Object.entries(headers)) {
        if (v === false) {
          resp.headers.delete(k)
        }
        if (v) {
          resp.headers.set(k, v.toString())
        }
      }
      
      return resp
    }
  });
}