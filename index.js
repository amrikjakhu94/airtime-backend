let express = require('express');
let app = express();
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
let cors = require('cors');
let indexRoute = require('./routes');
let config = require('config');

mongoose.connect('mongodb://localhost:27017/backendneww')
    .then(()=>{
        console.log('Connected to mongoDB')
    })
    .catch(err => console.error('Could not connect',err));
// if(!config.get('jwtPrimaryKey')){
//     console.error('FATAL ERROR : jwtPrimaryKey is not defined.');
//     process.exit(1);
// }

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(indexRoute);

let port = process.env.PORT || 3000;
app.listen(port,()=>{
    console.log(`App started at ${port}`);
});
