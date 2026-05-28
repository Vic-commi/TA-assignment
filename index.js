require('dotenv').config()

const express = require('express');
const cors = require('cors');
const expressLayouts = require('express-ejs-layouts');
const port = 3000;
const methodOverride = require('method-override');

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
app.use(methodOverride('_method'))

app.set('layout', 'layout/base');

const path = require('path');
const { reverse } = require('dns');
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
                const { name, displayName, imageUrl , flowers } = req.body;

                if(!name || !displayName || !imageUrl || !flowers) {
                    return res.status(400).send("missing required field");
                }

                await db.collection('arrangements').insertOne({
                    name: name,
                    imageUrl: imageUrl,
                    displayName: displayName,
                    flowers: flowers,
                    reviews: []
                })

                res.redirect('/arrangements');

            } catch(error) {
                console.error("Error adding new flower arrangement: ", error);
                res.status(500).send("Internal server error");
            }
        });

        app.get('/arrangements/:arrangementId/reviews/add', (req,res) => {
            res.render('./review/add');
        });

        app.post('/arrangements/:arrangementId/reviews/add', async (req,res) => {
            try {
                const { rating, content } = req.body;
                const { arrangementId } = req.params;
    
                if (!rating || !content) {
                    return res.status(400).send("missing required field");
                }

                await db.collection('arrangements').updateOne(
                    { _id: new ObjectId(arrangementId) },
                    { $push: { reviews: {_id: new ObjectId(), rating: rating, content: content } } }
                )

                res.redirect(`/arrangements/${arrangementId}/details`);

            } catch (error) {
                console.error("Error adding a new review: ", error);
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

        app.put('/arrangements/:arrangementId/update', async (req,res) => {
            try {
                const { arrangementId } = req.params;
                const { name, displayName, imageUrl, flowers } = req.body;

                if(!name || !displayName || !imageUrl || !flowers) {
                    return res.status(400).send("missing required field");
                }

                const updatedFA = {
                    name,
                    imageUrl,
                    displayName,
                    flowers
                }
                
                await db.collection('arrangements').updateOne(
                    {_id: new ObjectId(arrangementId)},
                    { $set: updatedFA }
                )

                res.redirect('/arrangements');

            } catch(error) {
                console.error("Error updating flower arrangement: ", error);
                res.status(500).send("Internal server error");
            }
        });

        app.get('/arrangements/:arrangementId/reviews/:reviewId/update', async(req,res) => {
            const { arrangementId, reviewId } = req.params;
            const result = await db.collection('arrangements').findOne(
                {
                    _id: new ObjectId(arrangementId),
                    "reviews._id": new ObjectId(reviewId)
                },
                {
                    projection:
                    {
                        reviews: {
                            $elemMatch: {_id: new ObjectId(reviewId)}
                        }
                    }
                }
            );

            // console.log(result.reviews[0])

            res.render('./review/update', {
                arrangement: result
            });
        })

        app.put('/arrangements/:arrangementId/reviews/:reviewId/update', async(req,res) => {
            try {
                const { rating, content } = req.body;
                const { arrangementId, reviewId } = req.params;
                const updatedReview = {
                    rating: rating,
                    content: content
                };
    
                await db.collection('arrangements').updateOne(
                    {
                        _id: new ObjectId(arrangementId),
                        "reviews._id": new ObjectId(reviewId)
                    },
                    {
                        $set: {
                            "reviews.$.rating": rating,
                            "reviews.$.content": content
                        }
                    }
                );
    
                res.redirect(`/arrangements/${arrangementId}/details`);

            } catch (error) {
                console.error("Error updating review: ", error);
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

        app.delete('/arrangements/:arrangementId/delete', async (req,res) => {
            try {
                const { arrangementId } = req.params;

                await db.collection('arrangements').deleteOne({ _id: new ObjectId(arrangementId) })

                res.redirect('/arrangements');

            } catch(error) {
                console.error("Error deleting flower arrangement: ", error);
                res.status(500).send("Internal server error");
            }
        });

        app.get('/arrangements/:arrangementId/reviews/:reviewId/delete', async (req,res) => {
            const { arrangementId, reviewId } = req.params;
            const result = await db.collection('arrangements').findOne(
                {
                    _id: new ObjectId(arrangementId),
                    "reviews._id": new ObjectId(reviewId)
                },
                {
                    projection:
                    {
                        reviews: {
                            $elemMatch: {_id: new ObjectId(reviewId)}
                        }
                    }
                }
            );

            // console.log(result.reviews[0])

            res.render('./review/delete', {
                arrangement: result
            });
        });

        app.delete('/arrangements/:arrangementId/reviews/:reviewId/delete', async (req,res) => {
            try {
                const { arrangementId, reviewId } = req.params;

                await db.collection('arrangements').updateOne(
                    { 
                        _id: new ObjectId(arrangementId),
                    },
                    {
                        $pull: {
                            reviews: {
                                _id: new ObjectId(reviewId)
                            }
                        }
                    }
                )

                res.redirect(`/arrangements/${arrangementId}/details`);

            } catch(error) {
                console.error("Error deleting a review: ", error);
                res.status(500).send("Internal server error");
            }
        });

        // READ
        app.get('/arrangements', async (req,res) => {
            try {
                const arrangements = await db.collection('arrangements').find().toArray();
                // console.log(arrangements);
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

                const result = await db.collection('arrangements').findOne({_id: new ObjectId(arrangementId)});
                // console.log(result);
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

