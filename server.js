require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch(err => console.log(err));

const urlSchema = new mongoose.Schema({
  shortId: {
    type : String,
    required : true
  },
  redirectURL: {
    type : String,
    required : true
  },
  visitHistory: [
    { timestamp: { type: Number } }
  ]
}, {
  timestamps : true
});

const URL = mongoose.model("URL", urlSchema);

// Shorten URL
app.post("/url", async (req, res) => {
  const body = req.body;
  const shortId = uuidv4().slice(0, 6);
  try {
    await URL.create({
      shortId,
      redirectURL: body.redirectURL,
      visitHistory: []
    });
  }
  catch(err) {
    console.log("Error " , err);
  }
  res.json({ shortId });
});

// Redirect to long URL and track visit
app.get("/:shortId", async (req, res) => {
  const shortId = req.params.shortId;
  const entry = await URL.findOneAndUpdate({ shortId }, {
    $push: { visitHistory: { timestamp: Date.now() } }
  });
  if (!entry) return res.status(404).send("Not found");
  res.redirect(entry.redirectURL);
});

// Get analytics
app.get("/analytics/:shortId", async (req, res) => {
  const shortId = req.params.shortId;
  const entry = await URL.findOne({ shortId });
  if (!entry) return res.status(404).send("Not found");
  res.json({
    totalClicks: entry.visitHistory.length + 1,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});