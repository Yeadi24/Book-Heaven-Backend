require("dotenv").config();
const express = require("express");
//middleware
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  //verify token
  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      res.status(401).send({ message: "Unauthorized Access" });
    }
    console.log(decoded);
    req.decoded = decoded;
    next();
  });
};

const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.user}:${process.env.pass}@cluster0.om6unai.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

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
    const reviewsCollection = client.db("BookHeaven").collection("reviews");
    // jwt token related API
    app.post("/jwt", async (req, res) => {
      const userData = req.body;

      const token = jwt.sign(userData, process.env.JWT_ACCESS_SECRET, {
        expiresIn: "1d",
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
      });
      res.send({ success: true });
    });
    //Books API
    app.get("/books", async (req, res) => {
      const cursor = bookCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/books/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.findOne(query);
      res.send(result);
    });

    app.post("/books", verifyToken, async (req, res) => {
      const newBook = req.body;
      const result = await bookCollection.insertOne(newBook);
      res.send(result);
    });
    //get current user's books
    app.get("/mybooks", verifyToken, async (req, res) => {
      const email = req.query.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      if (!email) {
        return res
          .status(400)
          .send({ error: "Email query parameter is required!" });
      }
      const query = { user_email: email };
      const userBooks = await bookCollection.find(query).toArray();
      res.send(userBooks);
    });
    app.put("/books/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const { _id, ...updatedinfo } = req.body;
      const updateDoc = {
        $set: updatedinfo,
      };
      const result = await bookCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });
    // PATCH: Upvote a book
    app.patch("/upvote/:id", verifyToken, async (req, res) => {
      const bookId = req.params.id;

      try {
        const filter = { _id: new ObjectId(bookId) };
        const updateDoc = {
          $inc: { upvote: 1 },
        };
        const result = await bookCollection.updateOne(filter, updateDoc);
        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .send({ error: "Book not found or already upvoted" });
        }

        res.send(result);
      } catch (error) {
        console.error("Error in upvote:", error);
        res.status(500).send({ error: "Internal server error" });
      }
    });
    app.delete("/books/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.deleteOne(query);
      res.send(result);
    });
    //review section
    // GET all reviews for a specific book
    app.get("/reviews", verifyToken, async (req, res) => {
      const bookId = req.query.book_id;
      if (!bookId) {
        return res.status(400).send({ error: "book_id query is required" });
      }

      const query = { book_id: new ObjectId(bookId) };
      const reviews = await reviewsCollection.find(query).toArray();
      res.send(reviews);
    });

    // POST a new review
    app.post("/reviews", verifyToken, async (req, res) => {
      const { book_id, user_email, review_text, created_at } = req.body;
      if (!book_id || !user_email || !review_text) {
        return res.status(400).send({ error: "Missing required fields" });
      }

      const newReview = {
        book_id: new ObjectId(book_id),
        user_email,
        review_text,
        created_at: created_at ? new Date(created_at) : new Date(),
      };

      const result = await reviewsCollection.insertOne(newReview);
      res.send({ ...newReview, _id: result.insertedId });
    });
    // DELETE /reviews/:id
    app.delete("/reviews/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const result = await reviewsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });
    // PATCH /reviews/:id
    app.patch("/reviews/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const { review_text } = req.body;

      const result = await reviewsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { review_text } }
      );
      res.send(result);
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
