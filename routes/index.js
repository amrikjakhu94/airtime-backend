let express = require('express');
let router = express.Router();
let userRouter = require('./users');
let tweetRouter = require('./tweets')

router.get('/',(req,res)=>{
    res.send('Welcome to backend');
})

router.use(userRouter);
router.use(tweetRouter);

module.exports = router;
