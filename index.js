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
// app.put('/api/assignments/:id', async (req, res) => {
//   const { id } = req.params;
//   const { title, description, marks, thumbnail, difficulty, dueDate, currentUserEmail } = req.body;

//   // Validate the ObjectId
//   if (!isValidObjectId(id)) {
//     return res.status(400).json({ message: "Invalid assignment ID" });
//   }

//   // Check if current user email is provided
//   if (!currentUserEmail) {
//     return res.status(400).json({ message: "Current user email is required." });
//   }

//   try {
//     // Find the assignment by ID
//     const assignment = await assignmentsCollection.findOne({ _id: new ObjectId(id) });

//     if (!assignment) {
//       return res.status(404).json({ message: "Assignment not found" });
//     }

//     // Check if the current user is the creator
//     if (assignment.creatorEmail !== currentUserEmail) {
//       return res.status(403).json({ message: "You are not authorized to update this assignment." });
//     }

//     // Build the updated fields
//     const updatedFields = {};
//     if (title) updatedFields.title = title;
//     if (description) updatedFields.description = description;
//     if (marks) updatedFields.marks = marks;
//     if (thumbnail) updatedFields.thumbnail = thumbnail;
//     if (difficulty) updatedFields.difficulty = difficulty;
//     if (dueDate) updatedFields.dueDate = new Date(dueDate);

//     // Perform the update
//     const result = await assignmentsCollection.updateOne(
//       { _id: new ObjectId(id) },
//       { $set: updatedFields }
//     );

//     if (result.matchedCount === 0) {
//       return res.status(404).json({ message: "Assignment not found for update." });
//     }

//     res.status(200).json({
//       message: "Assignment updated successfully",
//       updatedAssignment: { ...assignment, ...updatedFields },
//     });
//   } catch (error) {
//     console.error("Error updating assignment:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// Endpoint to update an assignment by ID
app.put('/api/assignments/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, marks, thumbnail, difficulty, dueDate } = req.body;
  const { currentUserEmail } = req.query;  // Assuming the current user's email is sent as a query param

  // Validate the ObjectId
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid assignment ID" });
  }

  // Check if current user email is provided
  if (!currentUserEmail) {
    return res.status(400).json({ message: "Current user email is required." });
  }

  try {
    // Find the assignment by ID
    const assignment = await assignmentsCollection.findOne({ _id: new ObjectId(id) });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Build the updated fields
    const updatedFields = {};
    if (title) updatedFields.title = title;
    if (description) updatedFields.description = description;
    if (marks) updatedFields.marks = marks;
    if (thumbnail) updatedFields.thumbnail = thumbnail;
    if (difficulty) updatedFields.difficulty = difficulty;
    if (dueDate) updatedFields.dueDate = new Date(dueDate);

    // Perform the update
    const result = await assignmentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Assignment not found for update." });
    }

    res.status(200).json({
      message: "Assignment updated successfully",
      updatedAssignment: { ...assignment, ...updatedFields },
    });
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});





// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
