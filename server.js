const express = require('express');
var cors = require('cors');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
app.use(express.json())
const MongoClient = require('mongodb').MongoClient

MongoClient.connect('mongodb://localhost:27017', { useUnifiedTopology: true })
    .then(client => {
        const db = client.db('easygas')
        const ordersCollection = db.collection('orders');

        app.get('/',(req,res) => {
            res.sendFile(__dirname + '/index.html')
        });

        app.post('/place-order', (req, res) => {
            ordersCollection.insertOne({_id: req.body.order.order_no, drivers: req.body.drivers,status: req.body.status})
            .then(result => {
                res.status(200).send({success: 'ok', code:1});
            })
            .catch(error =>res.status(400).send({error: 'ok'}))
        });

        app.post('/reject-order', (req, res) => {
            ordersCollection.updateOne(
                {_id: req.body.order_no},
                {"$set": {[`drivers.$[outer].progress`]: 'rejected'}},
                {"arrayFilters": [{ "outer.id": parseInt(req.body.driver_id) }]})
                .then(result => {
                    res.status(200).send({success: 'ok', code:1});
                    // ordersCollection.find({_id: req.body.order_no, "drivers.progress":"pending"}).toArray().then(result2=>{
                    //     if(result2.length > 0){
                    //         res.status(200).send({success: 'ok', code:1});
                    //     }else {
                    //         ordersCollection.updateOne(
                    //             {_id: req.body.order_no},
                    //             {"$set": {status: "cancelled"}});
                    //         res.status(200).send({success: 'ok', code:2});
                    //     }
                    // })
                })
                .catch(error =>res.status(400).send({error: 'ok'}))
        });

        app.post('/accept-order', (req, res) => {
            ordersCollection.findOneAndUpdate({_id: req.body.order_no,status:"pending"},
                {"$set": {status:"completed", [`drivers.$[outer].progress`]: 'accepted'}},
                {"arrayFilters": [{ "outer.id": parseInt(req.body.driver_id) }]})
                .then(result => {
                    if(result.value !=null){
                        res.status(200).send({success: 'ok', code:1});
                    }else {
                        res.status(200).send({success: 'ok', code:2});
                    }
                })
                .catch(error =>res.status(400).send({error: 'ok'}))
        });

        app.get('/get-order-drivers/:id', (req, res) => {
            // ordersCollection.aggregate(
            //     {$match: {_id: req.params.id}},
            //     {$unwind: "$drivers"},
            //     {$match: {"drivers.progress": 'pending'}},
            //     {$project: { "drivers.$": 1, status:0 } }
            //   ).toArray().then(result => {
            //     console.log(result);
            //     res.status(200).send({success: 'ok', drivers:result});
            // })
            // .catch(error =>res.status(400).send({error: 'ok'}))

            ordersCollection.find({_id: req.params.id})
            .toArray().then(result => {
                    console.log(result[0].drivers);
                    res.status(200).send(JSON.stringify({success: 'ok', drivers:result[0].drivers}));
                })
                .catch(error =>res.status(400).send({error: error}))
        });

        app.listen(3000, function () {
            console.log('listening on 3000')
        });
    })

    .catch(error => console.error(error))
