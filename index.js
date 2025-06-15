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

app.get("/", (req, res) => {
  res.send("Room Mate Server is Ready.........");
});

app.listen(port, () => {
  console.log("Room Mate server is running on port ", port);
});
