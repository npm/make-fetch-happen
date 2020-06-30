import { ClientRequestArgs, AgentOptions } from "http";
import { SecureContextOptions, CommonConnectionOptions } from "tls";
import { RequestInit } from "node-fetch";
import { TimeoutsOptions } from "retry";
import { Integrity } from "ssri";

type NodeFetchOpts = Pick<
  RequestInit,
  "method" | "body" | "redirect" | "follow" | "timeout" | "compress" | "size"
>;

type TlsOpts = Pick<SecureContextOptions, "ca" | "cert" | "key"> & {
  strictSSL?: CommonConnectionOptions["rejectUnauthorized"];
};

type MakeFetchHappenOpts = {
  cacheManager?: string | Cache;
  cache?:
    | "default"
    | "no-store"
    | "reload"
    | "no-cache"
    | "force-cache"
    | "only-if-cached";
  // TODO: is URL correct here?
  proxy?: string | URL;
  noProxy?: string | string[];
  localAddress?: ClientRequestArgs["localAddress"];
  maxSockets?: AgentOptions["maxSockets"];
  retry?: boolean | number | TimeoutsOptions;
  onRetry?: () => any;
  // may either be a string or an ssri Integrity-like
  integrity?: string | Integrity;
};

type CachingFetchOpts = NodeFetchOpts & TlsOpts & MakeFetchHappenOpts;

interface CachingFetch {
  (uriOrRequest: string | Request, opts?: CachingFetchOpts): Promise<Response>;
  defaults(uri: string, opts?: CachingFetchOpts): CachingFetch;
  defaults(opts: CachingFetchOpts): CachingFetch;
}

export default CachingFetch;
