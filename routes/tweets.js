let express = require('express');
let router = express.Router();
let User = require('../models/User');
let Tweet = require('../models/Tweet');
let auth = require('../middleware/auth');

router.get('/getmytweets',auth,(req,res)=>{
    let loggedInUser = req.user._id;
    //const user = await User.findById(req.user._id); //Finds which user is logged in
        Tweet.find({user : loggedInUser}).populate('user').populate('likedBy','firstname lastname').sort({'createdAt': -1})
            .then((mytweets)=>{
                if(mytweets == ''){
                    return res.status(404).json({No : 'tweets found'});
                }
                else{
                    return res.status(200).json({ mytweets:mytweets,user:loggedInUser });
                }
            });
});

router.post('/createtweet',auth,(req,res)=>{
    let loggedInUser = req.user._id;
    let tweet = req.body.tweetdata;
    if(!tweet){
        return res.status(422).json({Error : "Tweet has no data."});
    }
    else{
        // return req.user;
        User.findById(loggedInUser).then(
            (user)=>{
                if(user){
                    let newtweet = new Tweet({
                        user : user._id,
                        body : tweet
                    });
                    return newtweet.save().then(
                        ()=>{
                            newtweet.populate('user').execPopulate();
                            user.addTweetToUser(newtweet);
                            return res.status(200).json({Newtweet : 'posted successfully'});
                        }
                    ).catch((err)=>{ console.error(err) });
                }
                else{
                    return res.status(422).json({Invalid : 'tweet'});
                }
            }
        )
    }
});

router.get('/edittweet/:id',auth,(req,res)=>{
    let tweetId = req.params.id;
    let loggedInUser = req.user._id;
        if(!tweetId){
            return res.status(404).json({ Tweet : 'not found' })
        }
        else{
            Tweet.findOne({ _id : tweetId })
            .then((result)=>{
                if(result){
                    if(result.user == loggedInUser){
                        return res.send(result);
                    }
                    else{
                        return res.status(401).json({ Unauthorized : 'access' });
                    }
                }
            })
        }
});

router.post('/updatetweet/:id',auth,(req,res)=>{
    let tweetId = req.params.id;
    let tweet = req.body.body;
    if(!tweet){
        return res.status(422).json({Error : "Tweet has no data."});
    }
    else{
        Tweet.findByIdAndUpdate(tweetId,{$set : { body : tweet } }).then(
            (result)=>{
                if(result){
                    return res.status(200).json({ Tweet : 'updated' });
                }
                else{
                    return res.status(422).json({Invalid : 'tweet'});
                }
            }
        )
    }
});

router.get('/liketweet/:id',auth,(req,res)=>{
    let loggedInUser = req.user._id;
    let tweetId = req.params.id;
    Tweet.findById(tweetId,(err,result)=>{
        if(result){
            let increasedLikesCount = result.likesCount + 1;
            Tweet.update({ _id : tweetId },{ $push : { likedBy : loggedInUser } },(error,likedBy)=>{
                if(likedBy){
                    Tweet.update({ _id : tweetId },{ $inc: { likesCount: +1}},(err,likesCount)=>{
                        return;
                    });
                    return;
                }
            })
            return res.status(200).json({Liked :'You liked this tweet'});
        }
        else{
            return res.status(404).json({ notFound : 'Tweet not found'});
        }
    })
});

router.get('/disliketweet/:id',auth,(req,res)=>{
    let loggedInUser = req.user._id;
    let tweetId = req.params.id;
    Tweet.findById(tweetId,(err,result)=>{
        if(result){
            let decreasedLikesCount = result.likesCount - 1;
            Tweet.update({ _id : tweetId },{ $pull : { likedBy : loggedInUser } },(error,dislikedBy)=>{
                if(dislikedBy){
                    Tweet.update({ _id : tweetId },{ $inc: { likesCount: -1}},(err,likesCount)=>{
                        return;
                    })
                    return;
                }
            })
            return res.status(200).json({Disliked :'You disliked this tweet'});
        }
        else{
            return res.status(404).json({ notFound : 'Tweet not found'});
        }
    })
})

router.delete('/deletetweet/:id',auth,(req,res)=>{
    let tweetId = req.params.id;
    let loggedInUser = req.user._id;
    console.log(loggedInUser+' in delete request');
    Tweet.findOne({ _id : tweetId },(err,result)=>{
        if(result){
            if((result.user == loggedInUser)){
                Tweet.deleteOne({ _id : tweetId },(err,del)=>{
                    if(del){
                        console.log(del);
                        User.update({ _id : loggedInUser },{ $pull : { tweets : tweetId } },(error,remove)=>{
                            if(remove){
                                return res.json({success: 'Tweet deleted successfully'});
                            }
                        })
                    }
                });
            }
            else{
                return res.status(401).json({ Unauthorized :'access.' });
            }
        }
        else{
            return res.status(404).json({ Tweet : 'not found.' });
        }
    });

});

module.exports = router;
