const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
// freecodecamp exercise tracker
const Schema = mongoose.Schema;
const exerciseSchema = new Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true }
});
const userSchema = new Schema({
  username: { type: String, required: true }
});
const logSchema = new Schema({
  username: { type: String, required: true },
  count: { type: Number, required: true },
  log: [{
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, required: true }
  }]
});
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);
const Log = mongoose.model('Log', logSchema);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.post('/api/users', (req, res) => {
  console.log('req.body', req.body);
  const newUser = new User({
    username: req.body.username
  });
  newUser.save()
    .then(data => {
      res.json(data);
    })
    .catch(err => {
      console.log('error', err);
      res.json({ error: err });
    });
});
app.get('/api/users', (req, res) => {
  User.find({})
    .then(data => {
      res.json(data);
    })
    .catch(err => {
      console.log('error', err);
      res.json({ error: err });
    });
});
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  try {
    const user = await User.findById(_id);
    const checkedDate = date ? new Date(date) : new Date();
    if (isNaN(checkedDate)) {
      throw new Error('Invalid date');
    }
    const exercise = new Exercise({
      username: user.username,
      description,
      duration,
      date: checkedDate.toDateString(),
    });
    await exercise.save();
    res.json({
      username: exercise.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id,
    });
  } catch (error) {
    console.log('error', error);
    res.json({ error: error.message });
  }
});
app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const { _id } = req.params;
  try {
    const user = await User.findById(_id);
    const query = { username: user.username };
    if (from) query.date = { $gte: new Date(from) };
    if (to) query.date = { ...query.date, $lte: new Date(to) };
    const limitVal = limit ? +limit : 100;
    const exercises = await Exercise.find(query, null, { limit: limitVal });
    const loggedArray = exercises.map(item => ({
      description: item.description,
      duration: item.duration,
      date: item.date.toDateString()
    }));
    const log = new Log({
      username: user.username,
      count: loggedArray.length,
      log: loggedArray,
    });
    await log.save();
    res.json({
      username: user.username,
      count: log.count,
      _id,
      log: loggedArray,
    });
  } catch (error) {
    console.log('error', error);
    res.json({ error });
  }
});
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
