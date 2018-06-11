// importing all the middleware and dependencies
var express = require('express'); // Link - https://expressjs.com/
var path = require('path'); // Link - https://nodejs.org/api/path.html
var bodyParser = require('body-parser'); // Link -https://github.com/expressjs/body-parser
var multer = require('multer'); // Link - https://github.com/expressjs/multer
var processImage = require('express-processimage'); // Link - https://github.com/papandreou/express-processimage

// here we importing the routes
var index = require('./routes/index');
var tasks = require('./routes/tasks');
var products = require('./routes/products');
var apis = require('./routes/apis');

// here we creating an express app as "app"
var app = express();

// here we specifing the port no or it will take the environment port no as defined "PORT" 
var port = process.env.PORT || 3000;

// view engine
app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');
app.engine('html',require('ejs').renderFile);

// basically "app.use()" or "router.use()" and "app.all()" or "router.all()" method is used for implementing the middleware
// whats the diffrence between both of above two
// Link - https://stackoverflow.com/questions/14125997/difference-between-app-all-and-app-use  
app.use(processImage('./public/uploads')); // this is the declaration of image processing folder where all the image processing task will be happen
app.use(processImage('./public/uploads/thumbnail')); // this is the same above

// here we declaring the static path 
// otherwise it will show error like
// Error: ENOENT: no such file or directory, unlink 'e:\temp\node\nodejs1\public\uploads\thumbnail\image-1528556036247.jpg'
// on every file malipulations
app.use(express.static('./public'));


// app.use((req, res, next) => {
//     // req.header('AccessKey','123456');
//     if(req.header('AccessKey') != "123456"){
//         return res.status(400).json({});
        
//     }else{
//         return res.status(200).json({});
//     }
//     next();
//   });

// set static folder
app.use(express.static(path.join(__dirname,'client')));

// body parser Middleware
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());



app.use('/',index);
// app.use('/api',tasks);
app.use('/api',products);
app.use('/api',apis);

// set port variable using environment veriable
app.listen(port, () => {
    console.log(`Server is running into port no ${port} `);
});