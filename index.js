// Import dependencies
require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');

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
let submissionsCollection;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await client.connect();
    const database = client.db('GroupStudy');
    assignmentsCollection = database.collection('assignments');
    submissionsCollection = database.collection('submissions'); // Initialize submissionsCollection
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
      status: 'pending', // Default status for new assignments
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
    const { difficulty, search } = req.query;
    const filter = {};

    if (difficulty) {
      filter.difficulty = difficulty.toLowerCase();
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const assignments = await assignmentsCollection.find(filter).toArray();
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

// Endpoint to delete an assignment
app.delete("/api/assignments/:id", async (req, res) => {
  const { id } = req.params;
  const currentUserEmail = req.headers['authorization']?.split(' ')[1];

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid assignment ID" });
  }

  if (!currentUserEmail) {
    return res.status(400).json({ message: "Current user email is required." });
  }

  try {
    const assignment = await assignmentsCollection.findOne({ _id: new ObjectId(id) });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (assignment.creatorEmail !== currentUserEmail) {
      return res.status(403).json({ message: "You are not authorized to delete this assignment." });
    }

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

// Endpoint to update an assignment
app.put('/api/assignments/:id', async (req, res) => {
  const { id } = req.params;
  const updatedAssignment = req.body;

  try {
    const { _id, ...updateData } = updatedAssignment;

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

// Endpoint to submit an assignment
app.post('/api/assignments/submit/:id', async (req, res) => {
  const { id } = req.params;
  const { googleDocLink, note, userEmail } = req.body;

  if (!googleDocLink || !note || !userEmail) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const submission = {
      assignmentId: id,
      googleDocLink,
      note,
      status: 'pending',  // Set status as 'pending' when a submission is made
      userEmail,
      createdAt: new Date(),
    };

    const result = await submissionsCollection.insertOne(submission);
    res.status(201).json({
      message: 'Submission successful!',
      submissionId: result.insertedId,
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Endpoint to get all submissions
app.get('/api/submissions', async (req, res) => {
  try {
    const submissions = await submissionsCollection.find().toArray();
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to get pending assignments based on email
app.get('/api/assignments/pending', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: "Email query parameter is required" });
  }

  try {
    const assignments = await assignmentsCollection
      .find({ creatorEmail: email, status: 'pending' })
      .toArray();

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching pending assignments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to update the submission status
app.put('/api/submissions/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required.' });
  }

  try {
    const result = await submissionsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.status(200).json({ message: 'Submission status updated successfully' });
  } catch (error) {
    console.error('Error updating submission status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
/////////////////////
app.put('/api/assignments/:id', async (req, res) => {
  const { id } = req.params;
  const { marks, feedback, status } = req.body;

  if (!marks || !feedback) {
    return res.status(400).json({ message: "Marks and feedback are required." });
  }

  // Ensure status is set to "completed"
  const updatedAssignment = {
    marks,
    feedback,
    status: "completed",  // Force status to "completed" when marks are submitted
  };

  try {
    const result = await assignmentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedAssignment }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.status(200).json({ message: "Assignment updated successfully" });
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});




// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
