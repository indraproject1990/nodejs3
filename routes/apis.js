var express = require('express'); // Link - https://expressjs.com/
var router = express.Router();
const url = require('url'); // Link - https://nodejs.org/api/url.html
var bodyParser = require('body-parser'); // Link -https://github.com/expressjs/body-parser
var maps = require('@google/maps');
var request = require('request'); // Link - https://www.npmjs.com/package/request

var key = 'AIzaSyC4t4mKN11tqZEAnfx4J8tTczbscGqXeg8';

// creating a client for google
const googleMapsClient = maps.createClient({
    key: 'AIzaSyC4t4mKN11tqZEAnfx4J8tTczbscGqXeg8',
    Promise: Promise
});

router.use(express.json());
router.use(bodyParser.urlencoded({
    extended: true
}));


/////////////// get the list of docs //////////////////////////
router.get('/geocode/query', async (req, res, next) => {
    // Geocode an address.
    var address = req.query.address;
    var temp;
    // request({
    //     uri: "https://maps.googleapis.com/maps/api/geocode/json?address=" + address + "&key=" + key,
    //     json: true // *** you must have to specify the format ***
    // },(err,response,body)=>{
    //     // console.log(JSON.stringify(body.results[0].formatted_address, undefined ,2));
    //     // or
    //     // console.log(body.results[0].formatted_address);
    // });

    googleMapsClient.geocode({
            address: address
        })
        .asPromise()
        .then((response) => {
            // console.log(response.json.results[0].formatted_address);
            temp = response.json.results[0].formatted_address;
        })
        .catch((err) => {
            console.log(err);
        });

    res.json({
        'address': temp
    });
});

////////////////////// Working with Query Strings ////////////////////////
// GET http://localhost:3000/api/products/query?title=indra&limit=3
router.get('/products/query', async (req, res, next) => {
    var categoryQueryString;
    var mySort;
    if (req.query.category == "") {
        categoryQueryString = {}
    } else {
        categoryQueryString = {
            category: req.query.category
        };
    }

});


/////////////// POST the result  //////////////////////////
// POST  http://localhost:3000/api/products
// **** no header will be there while you are using postman ****

router.post('/products', async (req, res, next) => { // "upload.single('image')" this portion of code will be used to use "multer" and make sure that the "image" name should be matched with the body name 

});

module.exports = router;