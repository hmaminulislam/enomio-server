const express = require("express");
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.port || 5000;
const Products = require ('./products.json')

// middleware
app.use(cors());
app.use(express.json());

// default respons
app.get("/", (req, res) => {
  res.send("enomio server is running...");
});

app.listen(port, () => {
  console.log(`enomio server on port ${port}`);
});



// mongodb credentials
const uri = `mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@cluster0.wpflsxi.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});


async function run () {
  try {
    const productsCollection = client.db("Enomio").collection("products");

    // create main api
    app.get("/products", async (req, res) => {
      const query = {}
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });
  }
  catch(error) {
    console.log(error);
  }
}
run().catch(console.log)