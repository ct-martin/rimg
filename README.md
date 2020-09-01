# rimg
Image resizing microservice

![Code Tests](https://github.com/ct-martin/rimg/workflows/Code%20Tests/badge.svg?branch=master)
[![pipeline status](https://gitlab.com/ctmartin/rimg/badges/master/pipeline.svg)](https://gitlab.com/ctmartin/rimg/-/commits/master)
[![Maintainability](https://api.codeclimate.com/v1/badges/abca997c5b4cd3725645/maintainability)](https://codeclimate.com/github/ct-martin/rimg/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/abca997c5b4cd3725645/test_coverage)](https://codeclimate.com/github/ct-martin/rimg/test_coverage)

## Goals
* Resize images
* As fast as possible
* Support both generic `width`/`height` and oEmbed `maxwidth`/`maxheight`
* Basic abuse prevention
  * Forward Referer to origin and CORS headers back
  * Optional list of allowed hostnames to resize from
  * MIME checking of requested image

## Running
* `npm run dev` uses nodemon & ts-node to run and restart on watches in a single command
* `npm run build` & `npm run start` can be used by Heroku buildpack-based pipelines

### Environment variables
* `ALLOWED_HOSTNAMES` - comma-separated list of hostnames to allow (including port if applicable)
* `PORT` - Port to run server on

## Anti-goals
* Caching; this should be done by another layer
  * Caching headers from the origin should be passed back though
* TLS; this should be done by a proxy

## Security note
This acts as a proxy and may enable access to internal IP ranges.
**PLEASE** use `ALLOWED_HOSTNAMES` environment variable and configure your firewall correctly.

## Other
`server/utils.ts` has 100% Code Coverage.

I'm having trouble mocking `node-fetch` since this is TypeScript and it looks like I'm missing types or I can't partial mock `node-fetch` but not the types...
If you happen to know how to do this, please feel welcome to get in contact via a GitHub issue or make a PR.
To counteract this, I've tried to move as much logic as possible to `server/utils.ts`
