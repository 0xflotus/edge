import { FetchFunction, FetchGenerator, normalizeRequest } from "./fetch";
import { pipeline } from "./pipeline";
import { httpsUpgrader } from "./middleware/https-upgrader";
import { githubPages } from "./backends/github_pages";
import { netlify } from "./backends/netlify";
import { heroku } from "./backends/heroku";

export interface Matcher extends FetchFunction{
  matches: (req: Request) => boolean | Promise<boolean>
}

export interface MatchGenerator extends FetchGenerator{
  choices: (Matcher|FetchFunction)[]
}

export function match(...choices: (Matcher|FetchFunction)[]): MatchGenerator{
   function matchBuilder(fetch: FetchFunction){
    return async function match(req: RequestInfo, init?: RequestInit){
      if(typeof req === "string"){
        req = new Request(req, init)
        init = undefined
      }
      for(const c of choices){
         // * if matcher, check `matches`
         // * if function, treat it as default fetch
        let m = isMatcher(c) ? c.matches(req) : typeof c === "function";
        if(m instanceof Promise){
          m = await m
        }
        if(m){
          return c(req, init)
        }
      }
      return fetch(req, init)
    }
  }

  function configureMatch(): FetchFunction{
    throw "match has no configuration options"
  }
  return Object.assign(matchBuilder, { choices: choices, configure: configureMatch})
}

export function path(pattern: string | RegExp, fetch: FetchFunction): Matcher{
  async function pathFetch(req: RequestInfo, init?: RequestInit){
    return fetch(req, init)
  }
  async function pathMatch(req: Request){
    const url = new URL(req.url);
    if(typeof pattern === "string" && url.pathname.startsWith(pattern)){
      return true;
    }
    if(pattern instanceof RegExp && url.pathname.match(pattern)){
      return true;
    }
    return false;
  }
  return Object.assign(
    pathFetch,
    { matches: pathMatch }
  )
}

function isMatcher(obj: any): obj is Matcher{
  return typeof obj === "function" && typeof obj.matches === "function";
}
function isMatchGenerator(obj: any): obj is MatchGenerator{
  return typeof obj === "function" && obj.choices instanceof Array;
}

declare const mount: (path: string, ...args: (FetchFunction | Matcher)[]) => Matcher;
declare const segment: (name: string, pct: number, fetch: FetchFunction) => Matcher;

const origin = githubPages("superfly/landing");
const docs = githubPages("superfly/docs");
const newApp = netlify("hot-new-jamstack")
const railsApp = heroku("blue-collar-rails")
const fetch = pipeline(
                httpsUpgrader,
                match(
                  mount("/docs", docs),
                  mount("/app",
                    segment("beta-users", 20, newApp),
                    origin
                  ),
                  mount("/api",
                    pipeline(
                      rateLimiter,
                      jsonErrors,
                      api
                    )
                  )
                ),
                origin
              );

/*match((r:Matcher) => {
  r.mount("/docs", githubPages("superfly/docs")),
  r.path("/", githubPages("superfly/landing"))
})*/