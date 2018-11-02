let express = require('express');
let router = express.Router();
let User = require('../models/User');
let Tweet = require('../models/Tweet');
let bodyParser = require('body-parser');
let bcrypt = require('bcrypt');
let jwt = require('jsonwebtoken');
let config = require('config');
let auth = require('../middleware/auth');
var nodemailer = require('nodemailer');

router.post('/fileupload',(req,res)=>{
    //let loggedInUser = req.user._id;
    console.log('Entered file upload API');
    console.log(req.body);
    return;
})

router.post('/signup',(req,res)=>{
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;

    User.findOne({email : email}).then(
        (user) => {
            if(user){
                return res.json({ User : 'already exits' });
            }
            else{
                createNewUser();
            }
        }
    ).catch((err) => {
        console.error("Error occured ",+err);
    });

    async function createNewUser() {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password,salt);

        const activationNumber = Math.floor(( Math.random() * 546795) + 54 );

        const newUser = new User({
            firstname : firstname,
            lastname : lastname,
            username : username,
            email : email,
            salt : salt,
            hash : hashed,
            activation : activationNumber
        });
        newUser.save().then(()=>{
        
        let link = `http://localhost:3000/verify?id=${activationNumber}&email=${email}`;

        //  NodeMailer : To send email
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'idiotfriends04@gmail.com',
              pass: ''
            }
          });
          var mailOptions = {
            from: 'idiotfriends04@gmail.com',
            to: email,
            subject: 'Airtime account activation link.',
            html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify your account.</a>"
          };
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
              console.log('Email not sent...error');
            } else {
              console.log('Email sent: ' + info.response);
            }
          });


        return res.json( { User : ' created'} );
    });
    }

});

router.get('/verify',(req,res)=>{
    console.log(req.query);
    User.findOne({email : req.query.email, activation : req.query.activationNumber }).then(
        user=>{
            User.findOneAndUpdate({ _id : user._id },{ $set : { isverified : true } }).then(
                verfied=>{
                    if(verfied){
                        let link = 'http://localhost:3000';
                        return res.send('Account verfied...Now you can login to your account.');
                    }
                    else{
                        res.send('Error in account verification.')
                    }
                }
            )
        }
    ).catch()
});

router.post('/forgotpassword',(req,res)=>{
    let email = req.body.email;
    const activationNumber = Math.floor(( Math.random() * 484216) + 54 );
    User.findOne({email : email }).then(
        user=>{
            if(user){
                User.findOneAndUpdate({ _id : user._id },{ $set : { activation : activationNumber } }).then(
                    setActivationNumber=>{
                        let link = `http://localhost:4200/setnewpassword?id=${activationNumber}&email=${email}`;

                        //  NodeMailer : To send email
                        var transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                            user: 'idiotfriends04@gmail.com',
                            pass: 'aj16112111'
                            }
                        });
                        var mailOptions = {
                            from: 'idiotfriends04@gmail.com',
                            to: email,
                            subject: 'Airtime forgot password link.',
                            html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify your account.</a>"
                        };
                        transporter.sendMail(mailOptions, function(error, info){
                            if (error) {
                            console.log(error);
                            console.log('Email not sent...error');
                            } else {
                            console.log('Email sent: ' + info.response);
                            }
                        });

                        return res.status(200).json({sent : 'New password email sent...Click on the link in your email to set new password.'});
                    }
                )
            }
            else{
                res.status(404).json({ Error : 'user not found' })
            }
        }
    ).catch()
});

router.get('/setnewpassword',(req,res)=>{
    console.log(req.query);
    User.findOne({email : req.query.email, activation : req.query.activationNumber }).then(
        user=>{
            if(user){

            }
            else{
                res.status(401).json({unauthorization : 'access.'});
            }
        }
    ).catch()
});

router.post('/signin',(req,res)=>{
    let email = req.body.email;
    let password = req.body.password;
    if(!email)
        return res.status(422).json({Errors: {Email: "can't be blank"}});
    if(!password)
        return res.status(422).json({Errors: {Password: "can't be blank"}});
    else{
        User.findOne({email : email}).then(
            (user)=>{
                if(user){
                    bcrypt.compare(password, user.hash, (err, result)=> {
                        if(result){
                            if(user.isverified){
                                const token = user.generateAuthToken();
                                //res.header('x-auth-token',token).json({ name: user.name,email: user.email,token:token });
                                res.header('x-auth-token',token).json({ user : user, token : token });
                            }
                            else{
                                res.status(401).json({ auth : 'Account not verified.Check your email to verify your account' })
                            }
                       }
                       else{
                           res.status(401).json({ Message : 'Authentication failed. Invalid Password.'});
                       }
                    });
                }
                else{
                    return res.status(401).json({ Message : 'Authentication failed. User not found.' });
                }
            }
        ).catch((err) => {
            console.error("Error occured ",+err);
        })
    }

});

router.get('/findfriends',auth,(req,res)=>{
    let loggedInUser = req.user._id;
    User.findOne({_id : loggedInUser}).select('following').then(
        (user)=>{
            User.find( { _id : { $ne : loggedInUser , $nin : user.following } }).sort({'createdAt': -1}).select('firstname lastname').then(
                (findfriends)=>{
                    if(findfriends){
                        res.status(200).json(findfriends);
                    }
                    else{
                        res.status(404).send('Users not found');
                    }
                }
            );
        }
    );
});

// router.get('/getnewsfeed',auth,(req,res)=>{
//     let loggedInUser = req.user._id;
//     let tweets = [];
//     let likedBy = [];
//     User.findById(loggedInUser).select('following').populate('following').then(
//         (following)=>{
//             if(following){
//                 following.following.forEach(element=>{
//                     for(let i=0;i<element.tweets.length;i++){
//                         tweets.push(element.tweets[i]);
//                     }
//                 }
//                 )
//                 //console.log(tweets);
//                 Tweet.find({ _id : { $in : tweets } }).select('body likesCount likedBy createdAt user').populate('likedBy','firstname lastname').populate('user','firstname lastname').sort({'createdAt': -1}).then(
//                     (tweetsData)=>{
//                         if(tweetsData){
//                             res.status(200).json({ tweetData : tweetsData });
//                         }
//                         else{
//                             res.status(404).json({ tweetData : ['No tweets available.'] });
//                         }
//                     }
//                 )
//             }
//         }
//     );
// });



router.get('/getnewsfeed/:pageno',auth,(req,res)=>{
    let loggedInUser = req.user._id;
    let page = req.params.pageno;
    let perpage = 2;
    let tweets = [];
    let likedBy = [];
    User.findById(loggedInUser).select('following').populate('following').then(
        (following)=>{
            if(following){
                following.following.forEach(element=>{
                    for(let i=0;i<element.tweets.length;i++){
                        tweets.push(element.tweets[i]);
                    }
                }
                )
                //console.log(tweets.length,' length');
                
                // const options = {
                //     page : parseInt(page, 3) || 1,
                //     limit : parseInt(perPage, 2) || 10,
                //     populate: {
                //         path:'user',
                //         select:'firstname lastname'
                //     }
                // };

                // Tweet.paginate({ _id : { $in : tweets } }, { limit: 2 })
                // .then(response => {
                //     console.log(response);
                //     res.status(200).json(response);
                //   /**
                //    * Response looks like:
                //    * {
                //    *   docs: [...] // array of Posts
                //    *   total: 42   // the total number of Posts
                //    *   limit: 10   // the number of Posts returned per page
                //    *   page: 2     // the current page of Posts returned
                //    *   pages: 5    // the total number of pages
                //    * }
                //   */
                // })
                // .catch(handleQueryError);

                Tweet.find({ _id : { $in : tweets } }).select('body likesCount likedBy createdAt user').populate('likedBy','firstname lastname').populate('user','firstname lastname').sort({'createdAt': -1}).limit(perpage).skip((perpage * page)-perpage).then(
                    (tweetsData)=>{
                        if(tweetsData){
                            res.status(200).json({ tweetData : tweetsData , total : tweets.length});
                        }
                        else{
                            res.status(404).json({ tweetData : ['No tweets available.'] });
                        }
                    }
                );
            }
        }
    );
});





router.get('/profile',auth,(req,res)=>{
    let loggedInUser = req.user._id;
    User.findById(loggedInUser).select('-salt -hash -__v').populate('followers').populate('following').then(
        (user)=>{
            console.log(user);
            if(user){
                return res.send(user);
            }
        }
    )
});

router.get('/editprofile',auth,(req,res)=>{
    let loggedInUser = req.user._id;
    User.findById(loggedInUser).select('firstname lastname email username birthday contact bio relationship gender').then(
        (user)=>{
            console.log(user);
            if(user){
                return res.status(200).json({user : user});
            }
        }
    )
});

router.post('/editprofile',auth,(req,res)=>{
    let loggedInUser = req.user._id;
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let birthday = req.body.birthday;
    let contact = req.body.contact;
    let bio = req.body.bio;
    let relationship = req.body.relationship;
    let gender = req.body.gender;

    User.findByIdAndUpdate(loggedInUser, { $set : { firstname : firstname , lastname : lastname, birthday : birthday, contact : contact , bio : bio, relationship : relationship, gender : gender } }).then(
        (result)=>{
            if(result){
                return res.status(200).json({profile : 'Profile updated.'});
            }
            else{
                return res.status(400).send('Error in profile updation.');
            }
        }
    )
})

router.get('/getfollowsuggestions',auth,(req,res)=>{
    let loggedInUser = req.user._id;
    User.findOne({_id : loggedInUser}).select('following').then(
        (user)=>{
            //console.log(user);
            User.find( { _id : { $ne : loggedInUser , $nin : user.following } }).sort({'createdAt': -1}).limit(3).select('firstname lastname').then(
                (suggestions)=>{
                    if(suggestions){
                        res.status(200).json(suggestions);
                    }
                    else{
                        res.status(404).send('Users not found');
                    }
                }
            );
        }
    );
});

router.get('/followrequest/:id',auth,(req,res)=>{
    let loggedInUser = req.user._id;
    let tofollowuserId = req.params.id;

    User.findById( tofollowuserId , (err,followingres)=>{
        if(followingres){
            User.update({ _id : loggedInUser },{ $push : { following : tofollowuserId } },(error,following)=>{
                if(following){
                    User.update({ _id:loggedInUser },{ $inc: { followingCount: +1}},(err,followingcount)=>{
                        if(followingcount){
                            return;
                        }
                    });
                    return;
                }
            });
            User.findById(loggedInUser, (error,followersres)=>{
                if(followersres){
                    User.update({ _id : tofollowuserId },{ $push : { followers : loggedInUser } },(error,followers)=>{
                        if(followers){
                            User.update({ _id : tofollowuserId },{ $inc: { followersCount: +1}},(err,followerscount)=>{
                                if(followerscount){
                                    return;
                                }
                            });
                            return;
                        }
                    });
                }
            });
            //followingName = followingres.firstname+' '+followingres.lastname;
            res.status(200).json(followingres.firstname+' '+followingres.lastname);
        }
    });
});

router.get('/unfollowrequest/:id',auth,(req,res)=>{
    let loggedInUser = req.user._id;
    let tounfollowuserId = req.params.id;

    User.findById( tounfollowuserId , (err,unfollowingres)=>{
        if(unfollowingres){
            User.update({ _id : loggedInUser },{ $pull : { following : tounfollowuserId } },(error,following)=>{
                if(following){
                    User.update({ _id:loggedInUser },{ $inc: { followingCount: -1}},(err,followingcount)=>{
                        if(followingcount){
                            return;
                        }
                    });
                    return;
                }
            });
            User.findById(loggedInUser, (error,followersres)=>{
                if(followersres){
                    User.update({ _id : tounfollowuserId },{ $pull : { followers : loggedInUser } },(error,followers)=>{
                        if(followers){
                            User.update({ _id : tounfollowuserId },{ $inc: { followersCount: -1}},(err,followerscount)=>{
                                if(followerscount){
                                    return;
                                }
                            });
                            return;
                        }
                    });
                }
            });
            res.status(200).json({ unfollowed : unfollowingres.firstname+' '+unfollowingres.lastname});
        }
    });
});

router.get('/getfollowerslist',auth,(req,res)=>{
    let loggedInUser = req.user._id;
    User.findById(loggedInUser).select('followers').populate('followers','firstname lastname').then(
        (followerslist)=>{
            if(followerslist){
                res.status(200).json(followerslist);
            }
            else{
                res.status(404).send('No followers found.')
            }
        }
    )
});

router.get('/getfollowinglist',auth,(req,res)=>{
    let loggedInUser = req.user._id;
    User.findById(loggedInUser).select('following').populate('following','firstname lastname').then(
        (followinglist)=>{
            if(followinglist){
                res.status(200).json(followinglist);
            }
        }
    )
});

module.exports = router;
