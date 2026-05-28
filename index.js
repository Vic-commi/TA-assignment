require('dotenv').config()

const express = require('express');
const cors = require('cors');
const expressLayouts = require('express-ejs-layouts');
const port = 3000;

const mongoUrl = process.env.MONGO_URL;
const dbName = "flower_arrangements";

const { connect } = require('./db');
const { ObjectId } = require('mongodb');

let app = express();
app.use(cors());
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.set('layout', 'layout/base');

const path = require('path');
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));

async function main () {
    try{
        const db = await connect(mongoUrl, dbName);
       
        app.get('/', (req,res) => {
            res.render('landing');
        });
        
        // CREATE
        app.get('/arrangements/add', (req,res) => {
            res.render('./fa/add');
        });

        app.post('/arrangements/add', async (req,res) => {
            try {
                const { name, displayName, imageUrl } = req.body;

                if(!name || !displayName || !imageUrl) {
                    return res.status(400).send("missing required field");
                }

                await db.collection('arrangements').insertOne({
                    name: name,
                    imageUrl: imageUrl,
                    displayName: displayName
                })

                res.redirect('/arrangements');

            } catch(error) {
                console.error("Error adding new flower arrangement: ", error);
                res.status(500).send("Internal server error");
            }
        });


        // UPDATE
        app.get('/arrangements/:arrangementId/update', async (req,res) => {
            const { arrangementId } = req.params;

            const result = await db.collection('arrangements').findOne({ _id: new ObjectId(arrangementId) });
            
            res.render('./fa/update', {
                arrangement: result
            });
        });

        app.post('/arrangements/:arrangementId/update', async (req,res) => {
            try {
                const { name, displayName, imageUrl } = req.body;

                if(!name || !displayName || !imageUrl) {
                    return res.status(400).send("missing required field");
                }

                await db.collection('arrangements').insertOne({
                    name: name,
                    imageUrl: imageUrl,
                    displayName: displayName
                })

                res.redirect('/arrangements');

            } catch(error) {
                console.error("Error adding new flower arrangement: ", error);
                res.status(500).send("Internal server error");
            }
        });


        // DELETE
        app.get('/arrangements/:arrangementId/delete', async (req,res) => {
            const { arrangementId } = req.params;

            const result = await db.collection('arrangements').findOne({ _id: new ObjectId(arrangementId) });
            
            res.render('./fa/delete', {
                arrangement: result
            });
        });

        app.post('/arrangements/:arrangementId/delete', async (req,res) => {
            try {
                const { arrangementId } = req.params;

                await db.collection('arrangements').deleteOne({ _id: new ObjectId(arrangementId) })

                res.redirect('/arrangements');

            } catch(error) {
                console.error("Error adding new flower arrangement: ", error);
                res.status(500).send("Internal server error");
            }
        });

        // READ
        app.get('/arrangements', async (req,res) => {
            try {
                const arrangements = await db.collection('arrangements').find().toArray();
                console.log(arrangements);
                res.render('./fa/index', {
                    arrangements: arrangements
                });
            } catch (error) {
                console.error("Error fetching flower arrangements: ", error);
                res.status(500).send("Internal server error");
            }
        });

        app.get('/arrangements/:arrangementId/details', async (req,res) => {
            try {  
                const { arrangementId } = req.params;

                const result = db.collection('arrangements').findOne({_id: new ObjectId(arrangementId)});

                res.render('./fa/details', {
                    arrangement: result
                });
            } catch (error) {
                console.error("Error fetching flower arrangements: ", error);
                res.status(500).send("Internal server error");
            }
        });

    } catch(error) {
        console.error('Error connecting to MongoDB', error);
    }
}
main();

app.listen(port, () => {
    console.log(`Successfully run server on port ${port}`);
})

