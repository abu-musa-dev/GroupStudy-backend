// Import dependencies
require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
// const jwt = require('jsonwebtoken');

const app = express();
const port = 5000;

// MongoDB URI
const uri = `mongodb+srv://${process.env.MONGODB_Email}:${process.env.MONGODB_Password}@groupstudycluster.licae.mongodb.net/?retryWrites=true&w=majority&appName=GroupStudyCluster`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let assignmentsCollection;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB database
async function connectToDatabase() {
  try {
    await client.connect();
    const database = client.db('GroupStudy');
    assignmentsCollection = database.collection('assignments');
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToDatabase();

// Utility function to check if ObjectId is valid
const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

// Endpoint to create an assignment
app.post('/api/assignments', async (req, res) => {
  try {
    const { title, description, marks, thumbnail, difficulty, dueDate, creatorEmail } = req.body;

    // Validate required fields
    if (!title || !description || !marks || !thumbnail || !difficulty || !dueDate || !creatorEmail) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const newAssignment = {
      title,
      description,
      marks,
      thumbnail,
      difficulty,
      dueDate: new Date(dueDate),
      creatorEmail,
      createdAt: new Date(),
    };

    const result = await assignmentsCollection.insertOne(newAssignment);
    const insertedAssignment = { ...newAssignment, _id: result.insertedId };

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: insertedAssignment,
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to get all assignments
app.get('/api/assignments', async (req, res) => {
  try {
    const assignments = await assignmentsCollection.find().toArray();
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to get a specific assignment by ID
app.get('/api/assignments/:id', async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid assignment ID' });
  }

  try {
    const assignment = await assignmentsCollection.findOne({ _id: new ObjectId(id) });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.status(200).json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete("/api/assignments/:id", async (req, res) => {
  const { id } = req.params;
  const { currentUserEmail } = req.query; 

  // Validate the ObjectId
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid assignment ID" });
  }

  if (!currentUserEmail) {
    return res.status(400).json({ message: "Current user email is required." });
  }

  try {
    // Find the assignment
    const assignment = await assignmentsCollection.findOne({ _id: new ObjectId(id) });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Check if the current user is the creator
    if (assignment.creatorEmail !== currentUserEmail) {
      return res.status(403).json({ message: "You are not authorized to delete this assignment." });
    }

    // Delete the assignment
    const result = await assignmentsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Failed to delete the assignment." });
    }

    res.status(200).json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
 
});



// Endpoint to update an assignment by ID
// 

// app.put('/api/assignments/:id', async (req, res) => {
//   const { id } = req.params;
//   const { title, description, marks, difficulty, dueDate } = req.body;

//   // Extract user email from JWT token
//   const token = req.headers['authorization']?.split(' ')[1];
//   if (!token) {
//     return res.status(401).json({ message: "Authorization required" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const currentUserEmail = decoded.email;

//     // Find the assignment by ID
//     const assignment = await assignmentsCollection.findOne({ _id: new ObjectId(id) });

//     if (!assignment) {
//       return res.status(404).json({ message: "Assignment not found" });
//     }

//     // Proceed with update logic
//     const updatedFields = { title, description, marks, difficulty, dueDate };
//     const result = await assignmentsCollection.updateOne(
//       { _id: new ObjectId(id) },
//       { $set: updatedFields }
//     );

//     res.status(200).json({ message: "Assignment updated successfully" });
//   } catch (error) {
//     console.error("Error updating assignment:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });
app.put('/api/assignments/:id', async (req, res) => {
  const { id } = req.params;
  const updatedAssignment = req.body;

  try {
    // Remove _id from the update data as it cannot be modified
    const { _id, ...updateData } = updatedAssignment;

    console.log('Updating Assignment:', updateData);
    
    // MongoDB updateOne method
    const result = await assignmentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.status(200).json({ message: "Assignment updated successfully" });
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ message: "Error updating assignment" });
  }
});







// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
