const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Start
// express 4.16 include body-parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const mongoose = require('mongoose')
const User = require('./models/user')
const Exercise = require('./models/exercise')

mongoose.connect('mongodb://localhost/', { useNewUrlParser: true, useUnifiedTopology: true }).then(res =>{
  console.log("connected")
}).catch((e) => {
  console.log(e)
})

// Create new user
app.post('/api/users',(req,res) => {
  let uname = req.body.username
  User.create({username: uname},(err,data) =>{
    if(err) console.log(err)
    res.json({
      'username': data.username,
      '_id': data.id
    })
  })
})

//to get a list of all users
app.get('/api/users',(req,res) =>{
  User.find({},(err,data) => {
    if(err) console.log(err)
    res.json(data)
  })
})
// Save the exercise session info
app.post('/api/users/:_id/exercises',(req,res) => {
  let id = req.params._id

  User.findById(id, (err, db) =>{
    if(err) console.log(err)
    let username = db.username

    let newExercise = new Exercise({
      username: username,
      description: req.body.description,
      duration: parseInt(req.body.duration)
    })

    if (req.body.date) newExercise.date = req.body.date

    newExercise.save((err,data) => {
      if(err) console.log(err)

      res.json({
        '_id': id,
        'username': username,
        'date': data.date.toDateString(),
        'duration': data.duration,
        'description': data.description
      })
    })
  })

})

//Retrieve a full exercise log of a user
app.get('/api/users/:_id/logs',(req,res) => {
  let id = req.params._id

  let from = new Date(0)
  let to = new Date()
  let limitList = 0

  if(req.query.from) from = new Date(req.query.from)
  if(req.query.to) to = new Date(req.query.to)
  if(req.query.limit) limitList = parseInt(req.query.limit)

  User.findById(id, (err, data) => {
    if(err) console.log(err)
    let logArr = [] // array of exercise
    let counter = 0 // count how many exercise

    //Find list of exercise of the user
    //username connect UserSchema and ExerciseSchema
    //https://mongoosejs.com/docs/api/query.html
    // chaining query for condition and limitation response
      Exercise.find({username: data.username})
        .where('date').gte(from).lte(to)
        .limit(limitList).exec(function(err,result){
          if(err) console.log(err)
          counter = Object.keys(result).length
          logArr = result.map(e => ({
            'description': e.description,
            'duration': e.duration,
            'date': e.date.toDateString()
          }))
      res.json({
        'id': id,
        'username': data.username,
        'count': counter,
        'log': logArr
      })
    })
  })
})
// Finish

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
