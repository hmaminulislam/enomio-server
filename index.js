const express = require("express");
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const SSLCommerzPayment = require("sslcommerz-lts");
require("dotenv").config();
const app = express();
const port = process.env.port || 5000;

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
    const usersCollection = client.db("Enomio").collection("users");
    const ordersCollection = client.db("Enomio").collection("orders");

    // all products api
    app.get("/products", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = productsCollection.find(query);
      const products = await cursor
        .skip(page * size)
        .limit(size)
        .toArray();
      const count = await productsCollection.estimatedDocumentCount();
      res.send({ count, products });
    });

    //single products api
    app.get("/shop/:id", async(req, res) => {
      const id = req.params.id;
      const query = {_id: ObjectId(id)}
      const result = await productsCollection.findOne(query)
      res.send(result)
    })
    //categories products
    app.get("/category/:id", async (req, res) => {
      const id = req.params.id;
      const query = {category: id}
      const result = await productsCollection.find(query).toArray()
      res.send(result);
    });

    //users api
    app.put("/users", async (req, res) => {
      const user = req.body;
      const email = req.body.email;
      const filter = { email: email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    app.post("/orders", async (req, res) => {
      const orderInfo = req.body;
      const result = await ordersCollection.insertOne(orderInfo)
      res.send(result);
    });

  }
  catch(error) {
    console.log(error);
  }
}
run().catch(console.log)

// sslcommerc
app.post("/ssl-request", (req, res) => {
  const orderUserInfo = req.body.data;
  const {fullName, orderEmail, city, state, phone, zip, price} = orderUserInfo
  const data = {
    total_amount: price,
    currency: "BDT",
    tran_id: "REF123", // use unique tran_id for each api call
    success_url: `${process.env.ROOT}/ssl-payment-success`,
    fail_url: `${process.env.ROOT}/ssl-payment-fail`,
    cancel_url: `${process.env.ROOT}/ssl-payment-cencel`,
    ipn_url: `${process.env.ROOT}/ssl-payment-ipn`,
    shipping_method: "Courier",
    product_name: "Computer.",
    product_category: "Electronic",
    product_profile: "general",
    cus_name: fullName,
    cus_email: orderEmail,
    cus_add1: "Dhaka",
    cus_add2: "Dhaka",
    cus_city: city,
    cus_state: state,
    cus_postcode: zip,
    cus_country: "Bangladesh",
    cus_phone: phone,
    cus_fax: "000000",
    ship_name: fullName,
    ship_add1: "Dhaka",
    ship_add2: "Dhaka",
    ship_city: city,
    ship_state: state,
    ship_postcode: zip,
    ship_country: "Bangladesh",
  };
  const sslcommerz = new SSLCommerzPayment(
    process.env.STORE_ID,
    process.env.STORE_PASSWORD,
    false
  ); //true for live default false for sandbox
  sslcommerz.init(data).then((data) => {
    //process the response that got from sslcommerz
    //https://developer.sslcommerz.com/doc/v4/#returned-parameters
    if (data?.GatewayPageURL) {
      res.set({
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.send({paymentUrl: data?.GatewayPageURL});
    } else {
      return res.status(400).json({
        message: "Session was not successful",
      });
    }
  });
});

app.post("/ssl-payment-success", async (req, res) => {
  res.status(400).json(
    "Payment success"
  );
});

app.post("/ssl-payment-fail", async (req, res) => {
  res.status(400).json({
    data: req.body,
  });
});

app.post("/ssl-payment-cencel", async (req, res) => {
  res.status(200).json({
    data: req.body,
  });
});

app.post("/ssl-payment-ipn", async (req, res) => {
  res.status(200).json({
    data: req.body,
  });
});