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
      res.json({error: err});
    });
});

app.get('/api/users', (req, res) => {
  User.find({})
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
          description: req.body.description,
          duration: req.body.duration,
          date: checkedDate.toDateString()
      });
      newExercise.save()
        .then(data => {
          res.json({
            'username' : data.username,
            'description' : data.description,
            'duration' : data.duration,
            'date' : data.date.toDateString(),
            '_id' : idCheck
          });
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

app.get('/api/users/:_id/logs', (req, res) => {
  const {from, to, limit} = req.query;
  let idJson = { 'id': req.params._id };
  let idCheck = idJson.id;

User.findById(idCheck)
  .then(data => {
    // handle the found document
    var query = {
      username: data.username
    }
    if(from !== undefined && to === undefined){
      query.date = { $gte: new Date(from) };
    }else if(from === undefined && to !== undefined){
      query.date = { $lte: new Date(to) };
    }else if(from !== undefined && to !== undefined){
      query.date = { $gte: new Date(from), $lte: new Date(to) };
    }

    let limitChecker = (limit) => {
      let maxLimit = 100
      if(limit){
          return limit;
      }else{
          return maxLimit;
      }
    }

    Exercise.find((query), null, {limit: limitChecker(+limit)})
      .then(docs => {
        // handle the found documents
        let loggedArray = docs.map(item => ({
          'description': item.description,
          'duration': item.duration,
          'date' : item.date.toDateString()
        }));

        const test = new Log({
          'username': data.username,
          'count': loggedArray.length,
          'log': loggedArray,
        });

        test.save()
          .then(data => {
            // handle saved document
            res.json({
              'username' : data.username,
              'count' : data.count,
              '_id' : idCheck,
              'log' : loggedArray
            });
          })
          .catch(err => {
            // handle error when saving document
            console.log('error', err);
            res.json({error: err});
          });
      })
      .catch(err => {
        // handle error when finding documents
        console.log('error', err);
      });
  })
  .catch(err => {
    // handle error when finding document by id
    console.log('error', err);
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
