## request headers

accept-charset
accept-encoding
accept-language
accept
te (~accept-transfer-encoding)
cache-control // this is a blind do not match
host // only if host header does not match url
##
keep anything listed in the vary response header

## response headers

age
cache-control
content-encoding
content-language
content-type
date
etag
expires
host
last-modified
pragma
transfer-encoding
vary

## may be handled differently when fetching by integrity

host
