// Import dependencies
require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const port = 5000;
app.use(cors());
app.use(express.json());

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

// Connect to MongoDB
async function connectToDatabase() {
  try {
    // await client.connect();
    const database = client.db('GroupStudy');
    assignmentsCollection = database.collection('assignments');
    submissionsCollection = database.collection('submissions');
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}
connectToDatabase();

// JWT Middleware
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// Generate JWT Token
app.post('/jwt', (req, res) => {
  const user = req.body;
  if (!user?.email) return res.status(400).json({ message: "Email is required" });

  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.send({ token });
});

// Create an assignment (Protected)
app.post('/assignments', verifyJWT, async (req, res) => {
  try {
    const { title, description, marks, thumbnail, difficulty, dueDate, creatorEmail } = req.body;
    if (!title || !description || !marks || !thumbnail || !difficulty || !dueDate || !creatorEmail) {
      return res.json({ message: 'All fields are required.' });
    }

    const newAssignment = {
      title, description, marks, thumbnail,
      difficulty, dueDate: new Date(dueDate),
      creatorEmail, createdAt: new Date(), status: 'pending',
    };

    const result = await assignmentsCollection.insertOne(newAssignment);
    res.json({ message: 'Assignment created', assignment: { ...newAssignment, _id: result.insertedId } });
  } catch (error) {
    res.json({ message: 'Error creating assignment' });
  }
});

// Get all assignments
app.get('/assignments', async (req, res) => {
  try {
    const { difficulty, search } = req.query;
    const filter = {};
    if (difficulty) filter.difficulty = difficulty.toLowerCase();
    if (search) filter.title = { $regex: search, $options: 'i' };

    const assignments = await assignmentsCollection.find(filter).toArray();
    res.json(assignments);
  } catch {
    res.json({ message: 'Error fetching assignments' });
  }
});

// Get assignment by ID
app.get('/assignments/:id', async (req, res) => {
  try {
    const assignment = await assignmentsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!assignment) return res.json({ message: 'Assignment not found' });
    res.json(assignment);
  } catch {
    res.json({ message: 'Error fetching assignment' });
  }
});

// Delete assignment (Protected)
app.delete("/assignments/:id", verifyJWT, async (req, res) => {
  try {
    const id = req.params.id;
    const assignment = await assignmentsCollection.findOne({ _id: new ObjectId(id) });

    if (!assignment || assignment.creatorEmail !== req.user.email) {
      return res.status(403).json({ message: "Unauthorized or not found" });
    }

    await assignmentsCollection.deleteOne({ _id: new ObjectId(id) });
    res.json({ message: "Deleted successfully" });
  } catch {
    res.json({ message: "Error deleting assignment" });
  }
});

// Update assignment (Protected)
app.put('/assignments/:id', verifyJWT, async (req, res) => {
  try {
    const { marks, feedback, status, ...rest } = req.body;
    const updateData = marks && feedback
      ? { marks, feedback, status: 'completed' }
      : rest;

    const result = await assignmentsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) return res.json({ message: "Assignment not found" });
    res.json({ message: "Assignment updated" });
  } catch {
    res.json({ message: "Error updating assignment" });
  }
});

// Submit assignment (Protected)
app.post('/assignments/submit/:id', verifyJWT, async (req, res) => {
  try {
    const { googleDocLink, note, userEmail } = req.body;
    const assignment = await assignmentsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!assignment) return res.json({ message: 'Assignment not found' });

    const submission = {
      assignmentId: req.params.id, googleDocLink, note,
      status: 'pending', userEmail,
      assignmentTitle: assignment.title,
      createdAt: new Date(),
    };

    const result = await submissionsCollection.insertOne(submission);
    res.json({ message: 'Submitted', submissionId: result.insertedId });
  } catch {
    res.json({ message: 'Error submitting' });
  }
});

// Get all submissions (Protected)
app.get('/submissions',  async (req, res) => {
  try {
    const submissions = await submissionsCollection.find().toArray();
    res.json(submissions);
  } catch {
    res.json({ message: 'Error fetching submissions' });
  }
});

// Update submission (Protected)
app.put('/submissions/:id', verifyJWT, async (req, res) => {
  try {
    const updateFields = {};
    const { status, marks, feedback } = req.body;
    if (status) updateFields.status = status;
    if (marks !== undefined) updateFields.marks = marks;
    if (feedback !== undefined) updateFields.feedback = feedback;

    const result = await submissionsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) return res.json({ message: 'Submission not found' });
    res.json({ message: 'Updated' });
  } catch {
    res.json({ message: 'Error updating submission' });
  }
});

// Get pending assignments by creator email (Protected)
app.get('/assignments/pending', verifyJWT, async (req, res) => {
  try {
    const email = req.user?.email;
    if (!email) return res.json({ message: "Email is required" });

    const pendingAssignments = await assignmentsCollection.find({ creatorEmail: email, status: 'pending' }).toArray();
    res.json(pendingAssignments);
  } catch {
    res.json({ message: 'Error fetching pending assignments' });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('Grup-Study Running here..');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
