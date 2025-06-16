require("dotenv").config();
const express = require("express");
//middleware
const cors = require("cors");
const app = express();

const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.user}:${process.env.pass}@cluster0.om6unai.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
app.use(cors());
app.use(express.json());

//user: bookUser
// pass: qZLXK0YNsJCrhwnd

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const bookCollection = client.db("BookHeaven").collection("books");
    //Books API
    app.get("/books", async (req, res) => {
      const cursor = bookCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.post("/books", async (req, res) => {
      const newBook = req.body;

      const result = await bookCollection.insertOne(newBook);
      res.send(result);
    });
    //get current user's books
    app.get("/mybooks", async (req, res) => {
      const email = req.query.email;

      if (!email) {
        return res
          .status(400)
          .send({ error: "Email query parameter is required!" });
      }
      const query = { user_email: email };
      const userBooks = await bookCollection.find(query).toArray();
      res.send(userBooks);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Room Mate Server is Ready.........");
});

app.listen(port, () => {
  console.log("Room Mate server is running on port ", port);
});
