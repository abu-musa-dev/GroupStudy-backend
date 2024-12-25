require('dotenv').config();  // dotenv লোড করুন
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const app = express();
const port = 3001;

// MongoDB Atlas URI - এখানে আপনার ব্যবহারকারী নাম এবং পাসওয়ার্ড পরিবেশ ভেরিয়েবল থেকে নেওয়া হচ্ছে
const uri = `mongodb+srv://${process.env.MONGODB_Email}:${process.env.MONGODB_Password}@groupstudycluster.licae.mongodb.net/?retryWrites=true&w=majority&appName=GroupStudyCluster`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.use(cors());
app.use(express.json());

// Database Connection
async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToDatabase();

// Basic route
app.get('/', (req, res) => {
  res.send('Hello, MongoDB is connected!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
