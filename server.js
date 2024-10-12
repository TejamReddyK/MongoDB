const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const port = 3000;

// Middleware to parse JSON data
app.use(cors());
app.use(express.json()); // For parsing application/json

// MongoDB connection (Connect to the 'budget' database)
const mongoUrl = 'mongodb://localhost:27017/budget';

mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB (budget database)');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err.message);
});

// Define the budget schema and model
const budgetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true // Title is required
  },
  value: {
    type: Number,
    required: true // Value is required
  },
  color: {
    type: String,
    required: true, // Color is required
    validate: {
      // Ensure it's in the format #RRGGBB
      validator: function (v) {
        return /^#[0-9A-F]{6}$/i.test(v); // 6-digit hex color format
      },
      message: props => `${props.value} is not a valid 6-digit hexadecimal color!`
    }
  }
});

const Budget = mongoose.model('Budget', budgetSchema);

// GET endpoint to fetch data from MongoDB
app.get('/budget', async (req, res) => {
  try {
    const budgetData = await Budget.find();
    // Wrap the fetched data in an object with the key 'myBudget'
    res.json({
      myBudget: budgetData.map(item => ({
        title: item.title,
        budget: item.value, // Use the field name 'budget' to match your frontend expectations
        color: item.color
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// POST endpoint to add multiple budget entries to MongoDB
app.post('/addbudget', async (req, res) => {
  const { myBudget } = req.body; // Expecting myBudget to be an array

  if (!myBudget || !Array.isArray(myBudget)) {
    return res.status(400).json({ error: 'myBudget must be an array' });
  }

  const newEntries = [];

  for (const item of myBudget) {
    const { title, budget, color } = item;

    if (!title || !budget || !color) {
      return res.status(400).json({ error: 'All fields are required for each entry' });
    }

    // Create a new entry using the schema
    const newEntry = new Budget({
      title,
      value: budget, // Use the budget value from your structure
      color
    });
    
    try {
      const savedEntry = await newEntry.save();
      newEntries.push(savedEntry); // Add saved entry to the newEntries array
    } catch (err) {
      return res.status(500).json({ error: 'Failed to add one or more entries', details: err.message });
    }
  }

  res.status(201).json(newEntries); // Return all saved entries
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
