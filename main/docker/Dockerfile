# BUILDING
#
#   docker build -t oh-eth -f main/docker/Dockerfile .
#
#   -> build from root of this source (cd ../.. from here)  
#
# RUNNING
#
#   docker run --rm --name oh-eth -p 8080:8080 oh-eth 
#
#   -> map to 0.0.0.0:8080 so localhost 8080 works for running tests against container
#   -> if running in VirtualBox (docker-machine) ensure to port forward port 8080 in the docker-machine VM ('default')
#   -> if using docker-machine, make sure to stop machine before running node.js outside of docker:  `docker-machine stop`
#
# LOGGING
#
#   npm install -g bunyan
#   docker logs oh-eth | bunyan
#
#   -> application has a JSON logger 'bunyan' 
#   -> make these logs easier to consume by human: pipe log output to bunyan CLI.
#

FROM node:10.13.0

EXPOSE 8080

WORKDIR /home/node/app
COPY package.json LICENSE /home/node/app/
COPY main/js /home/node/app/main/js/

ENV OH_ETH_PORT 8080
ENV LOG_LEVEL warn
ENV KEYV_URI redis://redis:6379
ENV KEYV_AUTH_NAMESPACE users

LABEL license MIT

RUN npm update

CMD ["node", "main/js/overhide-ethereum.js"]
