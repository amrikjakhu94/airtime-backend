let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let jwt = require('jsonwebtoken');
let Tweet = require('./Tweet')

const userSchema = Schema({
    firstname : {
        type : String
    },
    lastname : {
        type : String
    },
    username  : {
        type : String,
        required : true,
        unique : true,
        index : true
    },
    email : {
        type : String,
        unique : true,
        lowercase: true,
        required: [true, "can't be blank"],
        match: [/\S+@\S+\.\S+/, 'is invalid'],
        index: true
    },
    tweets : [{
        type : Schema.Types.ObjectId,
        ref : 'Tweet'
    }],
    salt : {
        type : String
    },
    hash : {
        type : String
    },
    gender : {
        type : String,
        enum : ['Male','Female']
    },
    relationship : {
        type : String,
        enum : ['Single','Married','Divorce','Widow']
    },
    birthday : {
        type : String
    },
    contact : {
        type : Number
    },
    bio : {
        type : String,
        maxlength : 100
    }
    ,
    followers : [{
        type : Schema.Types.ObjectId,
        ref : 'User',
        unique : true
    }],
    following : [{
        type : Schema.Types.ObjectId,
        ref : 'User',
        unique : true
    }],
    followersCount : {
        type : Number,
        default : 0
    },
    followingCount : {
        type : Number,
        default : 0
    },
    activation : {
        type : Number
    }
    ,
    isverified : {
        type : Boolean,
        default : false
    }
},{ timestamps : true });

userSchema.methods.generateAuthToken = function(){
    const token = jwt.sign({ _id:this._id },'jwtPrimaryKey');
    return token;
}

userSchema.methods.addTweetToUser = function(tweet){
    this.tweets.push(tweet);
    return this.save();
}

module.exports = mongoose.model('User',userSchema);
