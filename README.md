# rimg
Image resizing microservice

![Code Tests](https://github.com/ct-martin/rimg/workflows/Code%20Tests/badge.svg?branch=main)
![Deploy](https://github.com/ct-martin/rimg/workflows/Deploy/badge.svg?branch=main)
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
