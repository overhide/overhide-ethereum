var router = require('express').Router();
const log = require('bunyan').createLogger({name:'router'});

router.use(function(request, response, next){
    next();
});

router.get('/get-transactions/:fromAddress/:toAddress', (req, rsp) => {
    rsp.json({fromAddressWas:req.params['fromAddress'], toAddressWas:req.params['toAddress']});
})

module.exports = router;