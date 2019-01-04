/**
 * @module Backends
 */

import { proxy, ProxyFunction } from "../proxy";
import { normalizeOptions, SubdomainOptions } from "./subdomain_service";

/**
 * Creates a `fetch` like function for proxying requests to hosted Netlify sites.
 * @param options Netlify site information. Accepts subdomain as a string.
 */
export function netlify(options: SubdomainOptions | string): ProxyFunction<SubdomainOptions> {
  const config = normalizeOptions(options);

  const netlifyHost = `${config.subdomain}.netlify.com` 
  const uri = `https://${netlifyHost}${config.directory}`
  const headers = {
    "host": netlifyHost,
    "x-forwarded-host": config.hostname || false
  }

  const fn = proxy(uri, { headers: headers })
  return Object.assign(fn, { proxyConfig: config})
}

netlify.normalizeOptions = normalizeOptions;
