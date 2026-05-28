const { MongoClient, ServerApiVersion } = require('mongodb');

let client = null;

async function connect (mongoUrl, dbName) {
    if(client) {
        return client.db(dbName);
    }

    client = new MongoClient(mongoUrl, {
        serverApi: {
            version: ServerApiVersion.v1
        }
    })

    await client.connect();
    console.log("connected to DB");

    return client.db(dbName);
};

module.exports = { connect }