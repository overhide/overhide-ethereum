[Ethereum](https://www.ethereum.org/) implementation of the [overhide](https://overhide.io) remuneration API:  https://overhide.io/docs/remuneration.html.

# Quick Start
 
These steps assume Docker is available.

Please review the *Configuration* section below as at the very least *ETHERSCAN_KEY* must be configured to run the tests in this package.  

Read the rest of this README for details.

## Quick Start With *overhide-ethereum* In Docker Container

If you're running Docker in *VirtualBox* (a *docker-machine*), please read the *Docker/Using docker-machine in VirtualBox* section below for important port forwarding information from the VM running Docker to your host system.

1. `npm install` -- bring in dependencies
1. `npm config set overhide-ethereum:ETHERSCAN_KEY=...` -- replace '...' with your https://etherscan.io API key
1. `npm run build` -- build *overhide-ethereum* Docker image
1. `npm run redis` -- start Redis image in Docker container
1. `npm run run` -- start *overhide-ethereum* image in Docker container linked to Redis above
1. `npm test` -- run tests against above

From now on you'll need to use the following commands to stop/restart things:

* `npm run clean` -- stop *overhide-ethereum* Docker image: reverse of `npm run run`
* `docker rmi oh-eth` -- remove *overhide-ethereum* Docker image (only if first cleaned with above): reverse of `npm run build`
* `docker kill redis; docker rm redis` -- stop Redis Docker image: reverse of `npm run redis`

## Quick Start With *overhide-ethereum* Running Locally

If you're running Docker in *VirtualBox* (a *docker-machine*), please read the *Docker/Using docker-machine in VirtualBox* section below for important port forwarding information from the VM running Docker to your host system.  

Steps below assume *overhide-ethereum* is not running in a Docker container:  `docker ps -a` doesn't show "oh-eth" entry.  Otherwise `npm run clean` to stop it.

1. `npm install` -- bring in dependencies
1. `npm config set overhide-ethereum:ETHERSCAN_KEY=...` -- replace '...' with your https://etherscan.io API key
1. `npm config set overhide-ethereum:OH_ETH_PORT=8081` -- especially necessary if you're running Docker in VirtualBox
1. `npm run redis` -- start Redis image in Docker container
1. `npm run start` -- start *overhide-ethereum* on localhost
1. `npm test` -- in another terminal; run tests against above: 

#   Configuration

All the configuration points for the app are listed in the *package.json* *config* descriptor.

Configuration defaults in *package.json* are reasonable only for testing.  

These *npm* configuration points are override-able with `npm config edit` or `npm config set` (see [npm-config](https://docs.npmjs.com/misc/config)): e.g. `npm config set overhide-ethereum:KEYV_AUTH_NAMESPACE new-value` sets a new-value for *KEYV_AUTH_NAMESPACE* in the user's *~/.npmrc*.

If an environment variable of the same name is made available, the environment variable's value precedes that
of the *npm config* value (*~/.npmrc* or *package.json*).

Configuration points for *overhide-ethereum*:

| *Configuration Point* | *Description* | *Sample Value* |
| --- | --- | --- |
| OH_ETH_PORT | *overhide-ethereum*'s port | 8080 |
| OH_ETH_HOST | *overhide-ethereum*'s host: only respected when running test-suite | localhost |
| DEBUG | see 'Logging' section below | overhide-ethereum:*,-overhide-ethereum:is-signature-valid:txs,-overhide-ethereum:get-transactions:txs |
| KEYV_URI | see 'Keyv Datastore' section below | redis://localhost:6379 |
| KEYV_AUTH_NAMESPACE | see 'Keyv Datastore' section below | test_users |
| ETHERSCAN_KEY | *overhide-ethereum* key for etherscan.io APIs | 446WA8I76EEQMXJ5NSUQA5Q17UXARBAF2 |
| ETHERSCAN_TYPE | Empty for mainnet, else "morden", "ropsten", "rinkeby" | rinkeby |

# Logging

Logging is done via the https://www.npmjs.com/package/debug module.

Logging verbosity is controlled via the *DEBUG* environment variable or an *npm* configuration point of the same name.

Non-debug (error/warning/audit) logging is programmatically enabled by default despite setting of the *DEBUG* variable.  These are the "overhide-ethereum-log" logs.

Setting *DEBUG* to "overhide-ethereum:*" will enable all debug logging.  This will be very verbose.  It's likely desirable to target debug logging, e.g:

`npm config set overhide-ethereum:DEBUG "overhide-ethereum:*,-overhide-ethereum:is-signature-valid:txs,-overhide-ethereum:get-transactions:txs"`

# Keyv Datastore

We use [keyv](https://github.com/lukechilds/keyv) for key-value access for metadata.  The data store itself could be Redis, Mongo, MySql, Postgres, any persistence supported by [keyv](https://github.com/lukechilds/keyv).

## KEYV_AUTH_NAMESPACE

The namespace for the storage of basic-auth users is specified using the *KEYV_AUTH_NAMESPACE* configuration point.  The default value for the namespace is "test_users".

Keys stored in *KEYV_AUTH_NAMESPACE* are usernames and values are hashed passwords (SHA256 of user's password).

It is highly recommended to run the development environment with the *KEYV_AUTH_NAMESPACE* configuration point set to the value of "test_users".

## KEYV_URI

The *KEYV_URI* configuration point must be correctly configured to run *overhide-ethereum*.  The default setting of "redis://localhost:6379" will work fine if you start your Redis via Docker:

`docker run --name redis -p 6379:6379 -d redis`

This starts a Redis datastore exposing port 6379 to your host system 

To inspect your Redis datastore you can use the Redis CLI:

`docker run -it --rm redis redis-cli -h <IP> -p 6379` 

Replace the `<IP>` with your IP.

# Docker

The *package.json* contains all the *Docker* commands we use for development/testing; run `npm run` to list them all.

> ## Using *docker-machine* in *VirtualBox*
>
> If you're running Docker using a *docker-machine* in *VirtualBox*, don't forget to port-forward port 6379 from VirtualBox VM to your host machine as well.
>
> All the ports you need forwarded:
>
> | *port* | *why* |
> | --- | --- |
> | 8080 | node |
> | 6379 | redis |
>
> If you're running *docker-machine* with the above ports opened for listening by the VM, you cannot use port 8080 to run *overhide-ethereum* using *npm* on your local host--the port is already used by *docker-machine*.  If you're running *docker-machine* (e.g. for redis) and want to run the *overhide-ethereum* locally, take care to use the *OH_ETH_PORT* configuration to request a different port for your local *overhide-ethereum* and to target your tests against this local *overhide-ethereum*.

## Docker Containers for *overhide-ethereum*

### Building Docker Image

`docker build -t oh-eth -f main/docker/Dockerfile .`

* build from root of this source (same as this *README*)  

Alternatively: `npm run build`

### Running Docker Image

Assuming you're already running the *redis* Docker image (`docker run --name redis -p 6379:6379 -d redis`), run *overhide-ethereum* using:

`docker run -d --link redis:redis --name oh-eth -e ETHERSCAN_KEY='<ETHERSCAN API KEY>'-p 8080:8080 oh-eth`

* runs as daemon
* links to *redis* container
* furnishes ETHERSCAN_KEY environment variable
* map to 0.0.0.0:8080 so localhost 8080 works for running tests against container
* if running in VirtualBox (docker-machine) ensure to port forward port 8080 in the docker-machine VM ('default')
* if using docker-machine, make sure to stop machine before running node.js outside of docker:  `docker-machine stop`

Alternatively: `npm run run`

### Logging from Docker Image

`docker logs oh-eth`

# Notes on Running the Development Environment

To restart Node.js every time you change source files ensure to have *nodemon* installed:

`npm install -g nodemon`

Start Node.js using *nodemon*:

`nodemon --inspect main/js/overhide-ethereum.js`

Or use the npm script:

`npm run dev`

## Configuration for Development

Default configuration in *package.json* is reasonable for development/testing.

You can override the configuration as per *Configuration* section above.

## Nodemon (Remote) Debugging

If you start *overhide-ethereum* with `npm run dev` or *nodemon* from your command shell, you'll need to connect your development environment to this *node* process explicitly for remote debugging.

Note that `nodemon` above is started with `--inspect` to allow remote debugging.  

As an example, to remote-debug from *VSCode* use the following runtime configuration:

```
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Node: Nodemon",
      "processId": "${command:PickProcess}",
      "restart": true,
      "protocol": "inspector"
    }
  ]
```

Select the "Node: Nodemon" runtime configuration in *VSCode* and look for a "node" process matching the PID reported by the 'ctx_config' console log from *overhide-ethereum*.

Once you see a "Debugger attached." message in your *nodemon* shell you're in business.

## Testing

`npm run test` or run the Mocha/Chai tests in `./test/js/*` manually.

The tests aren't unit tests.  They do not start Node.js to run *overhide-ethereum*; they expect the target device-under-test *overhide-ethereum* to be running.

The tests should pass regardless of configuration being tested:

* a development environment started using `npm run dev`
* a standalone Docker container started using `npm run run`
* a full network of load-balanced Docker compose swarm started using `TBD`

> *KEYV_URI* must be correctly configured to run this test suite; see *Keyv* section above.  This configuration must match the test-target *overhide-ethereum*'s configuration for the suite to start.

> The *KEYV_AUTH_NAMESPACE* **MUST** be prefixed with "test_" otherwise the test suite will abort.

Keep in mind that tests run as *npm* scripts with `npm run test` respect your environment and [npm-config](https://docs.npmjs.com/misc/config).  Tests run using IDE test runners should have an IDE/extension-specific method to set environment variables.  For example in *VSCode* go to *File>Prefernces>[Workspace] Settings*, filter by "mocha", look for an "env" configuration point.  For the two most popular extensions--Mocha Sidebar, Mocha Test Explorer--you'll end up with:

```
"mocha.env": {
    "KEYV_URI":"redis://localhost:6379"
},
"mochaExplorer.env": {
    "KEYV_URI":"redis://localhost:6379"
}
```

> The OH_ETH_HOST and OH_ETH_PORT configurations points may be used to point the tests at the target *overhide-ethereum* for testing.
