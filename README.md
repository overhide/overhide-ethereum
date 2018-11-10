 # Running Server
 
 `npm install`
 
 `npm run start`
 
## Bunyan

We use *bunyan* for JSON log output.  

JSON logs are hard to read.  To make *bunyan* output more human friendly ensure to have *bunyan* CLI installed: 

`npm install -g bunyan`  

Then run node piping STDOUT to *bunyan* CLI:

`npm run start | bunyan`

 # Running Development Environment

To restart Node.js every time you change source files ensure to have *nodemon* installed:

`npm install -g nodemon`

Start Node.js using *nodemon*, pipe to *bunyan*:

 `nodemon main/js/overhide-ethereum.js | bunyan`

 Or use the npm script:

 `npm run dev`

 # Docker

 ## Building Docker Image

 `docker build -t oh-eth -f main/docker/Dockerfile .`

 * build from root of this source (same as this *README*)  

 ## Running Docker Image

 `docker run --rm --name oh-eth -p 8080:8080 oh-eth`

* map to 0.0.0.0:8080 so localhost 8080 works for running tests against container
* if running in VirtualBox (docker-machine) ensure to port forward port 8080 in the docker-machine VM ('default')
* if using docker-machine, make sure to stop machine before running node.js outside of docker:  `docker-machine stop`

## Logging from Docker Image

`docker logs oh-eth | bunyan`
