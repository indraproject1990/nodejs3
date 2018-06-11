var express = require('express'); // Link - https://expressjs.com/
var router = express.Router();
var fs = require('fs'); // Link - https://nodejs.org/api/fs.html
// sharp might depends on "grapicMagick(gm)" so you can install grapicMagick binary file  for windows/linux so on
// here is the link - http://www.graphicsmagick.org/download.html
var sharp = require('sharp'); // this is the image processing library, link - http://sharp.dimens.io/
var Joi = require('joi'); // Link - https://github.com/hapijs/joi
const url = require('url'); // Link - https://nodejs.org/api/url.html
var path = require('path'); // Link - https://nodejs.org/api/path.html
var bodyParser = require('body-parser'); // Link -https://github.com/expressjs/body-parser
var multer = require('multer'); // Link - https://github.com/expressjs/multer
var jsonwebtoken = require('jsonwebtoken'); // jwt as "jsonwebtoken" module
var mongodb = require('mongodb'); // Link - http://mongodb.github.io/node-mongodb-native/
const MongoClient = require('mongodb').MongoClient
var ObjectID = require('mongodb').ObjectID;
var db;
var width = 150,height = 150;

router.use(express.json());
router.use(bodyParser.urlencoded({
    extended: true
}));

// there is two kind of storage are the in multer one is diskStorage and another one is memoryStorage
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads')  // to use multer you must have to set the static path at the "app" section like - "app.use(express.static('./public'));"
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.jpg')
    }
})

var upload = multer({ //multer settings
    storage: storage,
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {  // sharp doesnt work with "gif" file so kindly avoid the extention 
            callback('Choose an Image file!', null)

        }
        callback(null, true)
    },
    limits: {
        fileSize: 1024 * 1024
    }
})

// you can directly use image processing through image url like
// http://localhost:3000/uploads/thumbnail/image-1528561938847.jpg?resize=200
// or you can use the following one
// make sure that you are using the same order as defined in the doc (http://sharp.dimens.io/)
function imageResize(path,filename,width,height){
    sharp.cache(false); 
    sharp(path)
        .resize(width, height)
        .withoutEnlargement()
        .toFile('public/uploads/thumbnail/' + filename, function (err) {  // toFile method will save your file into the disk after resizing
            if (err) {
                console.log(err)
            }
            console.log('image resized')
        });
}

// // mlab url - mongodb://<username>:<password>@ds245170.mlab.com:45170/trading-db
// mlab url - mongodb://trading-db:Mlab123@ds245170.mlab.com:45170/trading-db
MongoClient.connect('mongodb://localhost:27017/trading-product-db', async (err, client) => {
    if (err) return console.log(err);
    db = await client.db('trading-product-db'); // whatever your database name is
});


/////////////// get the list of docs //////////////////////////
// GET  http://localhost:3000/api/products
router.get('/products', async (req, res) => {


    await db.collection('products').find().toArray((err, products) => {
        if (err) res.send(err);
        res.json(products);
    });
});

////////////////////// Working with Query Strings ////////////////////////
// GET http://localhost:3000/api/products/query?title=indra&limit=3
router.get('/products/query', async (req, res) => {
    var categoryQueryString;
    var mySort;
    if (req.query.category == "") {
        categoryQueryString = {}
    } else {
        categoryQueryString = {
            category: req.query.category
        };
    }

    var limitQueryString = parseInt(req.query.limit);
    await db.collection('products').find(categoryQueryString).limit(limitQueryString).sort({
        category : 1
    }).toArray((err, product) => {
        if (err) res.send(err);
        res.send(product);
    });
});

/////////////// get the result on perticular id //////////////////////////
// GET  http://localhost:3000/api/products/5b0d455281ed57057460975e
router.get('/products/:id', async (req, res) => {
    var id = ObjectID(req.params.id);

    await db.collection('products').findOne({
        _id: id
    }, (err, product) => {
        if (err) res.send(err);

        if (product == null) {
            res.status(404).json({
                "error": "Not Found"
            });
        }

        res.json(product);
    });

});



/////////////// POST the result  //////////////////////////
// POST  http://localhost:3000/api/products
// **** no header will be there while you are using postman ****

router.post('/products', upload.single('image'), async (req, res) => {  // "upload.single('image')" this portion of code will be used to use "multer" and make sure that the "image" name should be matched with the body name 

    if (!req.body.title || (req.body.status == '') || !req.body.desc || !req.body.category || !req.file.path) {
        res.status(400).json({
            "error": "Bad Request"
        });
    }

    var tempImg = req.file.path;
    var tempImgName = req.file.filename;
    imageResize(tempImg,tempImgName,width,height);

    var product = {
        title: req.body.title,
        status: req.body.status,
        desc: req.body.desc,
        category: req.body.category,
        images: {
            img1: 'public/uploads/thumbnail/' + tempImgName,
            // or
            // img1: 'public/uploads/thumbnail/' + tempImgName + '?resize=' + width,
            img2: 'public/uploads/' + tempImgName
            // or
            // img1: 'public/uploads/' + tempImgName + '?resize=' + width,
            
            // if you use the above alternatives then you no need to store the same file at diffrent location,and your effort will be less
        }
    };

    await db.collection('products').save(product, (err, product) => {
        if (err) {
            res.send(err);
        };


        console.log('saved to database');
        res.json(product);
    });
});


/////////////// PUT the result  //////////////////////////
// PUT  http://localhost:3000/api/products/5b0d355c4508db1e30f466f8
// **** no header will be there while you are using postman ****

router.put('/products/:id', upload.single('image'), async (req, res) => {
    var product = req.body;
    var paramsId = ObjectID(req.params.id);
    var myquery = {
        _id: paramsId
    };
    var newvalues = {};

    var tempImg = req.file.path;
    var tempImgName = req.file.filename;
    imageResize(tempImg,tempImgName,width,height);

    if (product.title != "" || product.status != "" || product.desc != "" || product.category != "" || req.file.path != "") {
        newvalues.title = product.title;
        newvalues.status = product.status;
        newvalues.desc = product.desc;
        newvalues.category = product.category;
        newvalues.images = {
            newimg1: 'public/uploads/thumbnail/' + tempImgName,
            // or
            // newimg1: 'public/uploads/thumbnail/' + tempImgName + '?resize=' + width,
            
            newimg2: 'public/uploads/' + tempImgName
            // or
            // newimg2: 'public/uploads/' + tempImgName + '?resize=' + width,

            // if you use the above alternatives then you no need to store the same file at diffrent location,and your effort will be less
        }
    }

    if (!newvalues) {
        res.status(400).json({
            "error": "Bad Request"
        });
    } else {
        newvalues = {
            $set: {
                title: newvalues.title,
                status: newvalues.status,
                desc: newvalues.desc,
                category: newvalues.category,
                images: {
                    img1: newvalues.images.newimg1,
                    img2: newvalues.images.newimg2
                }
            }
        };

        await db.collection('products').findOne({
            _id: paramsId
        }, (err, product) => {
            if (err) res.send(err);

            if (product == null) {
                res.status(404).json({
                    "error": "Not Found"
                });
            }
            var temp1 = product.images.img1;
            var temp2 = product.images.img2;
            db.collection('products').updateOne(myquery, newvalues, (err, product) => {
                if (err) res.send(err);
                
                res.json(product);
            });
            ///////////////////////////////////
            fs.unlink(temp1, (err) => { // Delete the file Asynchronously
                if (err) console.log(err);
                console.log(temp1 + ' successfully deleted');
            });
            fs.unlink(temp2, (err) => { // Delete the file Asynchronously
                if (err) console.log(err);
                console.log(temp2 + ' successfully deleted');
            });
            ///////////////////////////////////
        });
        
    }
});


/////////// delete document using default auto generated generated id ////////////
// DELETE  http://localhost:3000/api/products/5b0d455281ed57057460975e

router.delete('/products/:id', async (req, res) => {
    var id = ObjectID(req.params.id);


    await db.collection('products').findOne({
        _id: id
    }, (err, product) => {
        if (err) res.send(err);

        if (product == null) {
            res.status(404).json({
                "error": "Not Found"
            });
        }
        var temp1 = product.images.img1;
        var temp2 = product.images.img2;
        db.collection('products').deleteOne({
            _id: id
        }, (err, product) => {
            if (err) res.send(err);
            /////////////////////////////
            fs.unlink(temp1, (err) => {  // Delete the file Asynchronously 
                if (err) console.log(err);
                console.log(temp1 + ' successfully deleted');
            });
            fs.unlink(temp2, (err) => {  // Delete the file Asynchronously
                if (err) console.log(err);
                console.log(temp2 + ' successfully deleted');
            });
            ///////////////////////////
            res.json(product);
        });
    });
});
module.exports = router;