let mongoose = require('mongoose');
let mongoosePaginate = require('mongoose-paginate');
let Schema = mongoose.Schema;
let User = require('./User');

const tweetSchema = new Schema({
    user : {
        type : Schema.Types.ObjectId,
        ref : 'User'
    },
    body : {
        type : String
    },
    likesCount : {
        type : Number,
        default : 0
    },
    likedBy : [{
        type : Schema.Types.ObjectId,
        ref : 'User'
    }]
},{ timestamps : true });

tweetSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Tweet',tweetSchema);
