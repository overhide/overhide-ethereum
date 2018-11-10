const app = require('express')();
const router = require('./router');
const log = require('bunyan').createLogger({name:'overhide-ethereum'});

app.use("/", router);
app.listen(8080);
exports.app = app;  

[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
  process.on(eventType, () => {
    log.warn('exiting');
    process.exit();
  })});
