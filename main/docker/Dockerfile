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

FROM node:10.13.0

EXPOSE 8080

WORKDIR /home/node/app
COPY package.json LICENSE /home/node/app/
COPY main/js /home/node/app/main/js/
COPY main/static /home/node/app/main/static/
COPY tools /home/node/app/tools/
COPY test /home/node/app/test/

ENV OH_ETH_PORT 8080
ENV KEYV_AUTH_NAMESPACE users
ENV BASIC_AUTH_ENABLED false

LABEL license MIT

RUN npm install

CMD ["node", "main/js/overhide-ethereum.js"]