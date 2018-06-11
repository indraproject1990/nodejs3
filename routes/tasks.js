var express = require('express');
var router = express.Router();
var Joi = require('joi');
var bodyParser = require('body-parser');
const url = require('url');
var jsonwebtoken = require('jsonwebtoken');  // jwt as "jsonwebtoken" module
const MongoClient = require('mongodb').MongoClient
var ObjectID = require('mongodb').ObjectID;
var db;

router.use(express.json());
router.use(bodyParser.urlencoded({ extended: true }));

// mlab url - mongodb://sstechnoskills:Mlab@123@ds245170.mlab.com:45170/trading-db
MongoClient.connect('mongodb://localhost:27017/my-task-db', async (err, client) => {
    if (err) return console.log(err);
    db = await client.db('my-task-db'); // whatever your database name is
});


// router.get('/api',(req,res,next)=>{
//     var token = req.headers['x-access-token'];
//     if(!token){
//         res.status(401).json({
//             auth: false,
//             message:'no token provided.'
//         });
//     }
//     jsonwebtoken.verify(token, 1234567,(err,decoded)=>{
//         if(err){
//             res.status(500).send({
//                 auth : false,
//                 message : 'Failed to authenticate token'
//             });
//         }
//         res.status(200).send(decoded);
//     });
// });

/////////////// get the list of docs //////////////////////////
// GET  http://localhost:3000/api/tasks
router.get('/tasks', async (req, res, next) => {


    await db.collection('tasks').find().toArray((err, tasks) => {
        if (err) res.send(err);
        res.json(tasks);
    });
});

////////////////////// Working with Query Strings ////////////////////////
// GET http://localhost:3000/api/tasks/query?title=indra&limit=3
router.get('/tasks/query', async (req, res, next) => {
    var titleQueryString;
    var mySort;
    if (req.query.title == "") {
        titleQueryString = {}
    } else {
        titleQueryString = { title: req.query.title };
    }

    // not worked
    // if (req.query.sort == "") {
    //     mySort = {};
    // } else {
    //     var sortQueryString = req.query.sort;
    //     var temp = JSON.parse({ sortQueryString: 1 });
    //     mySort = temp;
    // }
    //  not worked

    var limitQueryString = parseInt(req.query.limit);
    await db.collection('tasks').find(titleQueryString).limit(limitQueryString).sort({ title: 1 }).toArray((err, task) => {
        if (err) res.send(err);
        res.send(task);
    });
});

/////////////// get the result on perticular id //////////////////////////
// GET  http://localhost:3000/api/tasks/5b0d455281ed57057460975e
router.get('/tasks/:id', async (req, res ,next) => {
    var id = ObjectID(req.params.id);

    await db.collection('tasks').findOne({ _id: id }, (err, task) => {
        if (err) res.send(err);

        if(task == null){
            res.status(404).json({
                "error":"Not Found"
            });
        }

        res.json(task);
    });

});



/////////////// get the result on perticular id //////////////////////////
// POST  http://localhost:3000/api/tasks
// x-www-form-urlencoded - { "title":"job", "isDone":true }
router.post('/tasks', async (req, res, next) => {
    var task = req.body;
    if(!task.title || (task.isDone == '')){
        res.status(400).json({
            "error":"Bad Request"
        });
    }else{
        await db.collection('tasks').save(task, (err, task) => {
            if (err) {
                res.send(err);
            };
    
            console.log('saved to database');
            res.json(task);
        });
    }
});


/////////////// get the result on perticular id //////////////////////////
// PUT  http://localhost:3000/api/tasks/5b0d355c4508db1e30f466f8
// x-www-form-urlencoded - { "title":"job", "isDone":true }
router.put('/tasks/:id', async (req, res) => {
    var task = req.body;
    var paramsId = ObjectID(req.params.id);
    var myquery = { _id: paramsId };
    var newvalues = {}; 
    if(task.title){
        newvalues.title = task.title;
    }

    if(task.isDone){
        newvalues.isDone = task.isDone;
    }

    if(!newvalues){
        res.status(400).json({
            "error":"Bad Request"
        });
    }else{
        newvalues = {
            $set: {
                title: newvalues.title,
                isDone: newvalues.isDone
            }
        };
        await db.collection('tasks').updateOne(myquery, newvalues, (err, task)=> {
            if (err) res.send(err);
            res.json(task);
        });
    }
});


/////////// delete document using default auto generated generated id ////////////
// DELETE  http://localhost:3000/api/tasks/5b0d455281ed57057460975e
router.delete('/tasks/:id', async (req, res, next) => {
    await db.collection('tasks').deleteOne({ _id: ObjectID(req.params.id) }, (err, task) => {
        if (err) res.send(err);
        res.json(task);
    });
});

module.exports = router;