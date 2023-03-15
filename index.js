const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');


const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// freecodecamp exercise tracker
const Schema = mongoose.Schema;
const exerciseSchema = new Schema({
  username: { type: String, required: true },
  log: [{
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, required: true }
  }]
});
const userSchema = new Schema({
  username: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);


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
      res.json({error: err});
    });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  let idJson = { _id: req.params._id };
  let checkedDate = new Date(req.body.date);
  let idCheck = idJson._id;

  let noDateHandler = () => {
    if(checkedDate instanceof Date && !isNaN(checkedDate)){
      return checkedDate;
    } else {
      checkedDate =  new Date();
    }
  }

  User.findById(idCheck)
    .then(data => {
      noDateHandler(checkedDate);

      const newExercise = new Exercise({
        username: data.username,
        log: [{
          description: req.body.description,
          duration: req.body.duration,
          date: checkedDate
        }]
      });
      newExercise.save()
        .then(data => {
          res.json(data);
        })
        .catch(err => {
          console.log('error', err);
          res.json({error: err});
        });
    })
    .catch(err => {
      console.log('error', err);
      res.json({error: err});
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
