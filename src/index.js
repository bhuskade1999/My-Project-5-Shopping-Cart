const express = require('express')
const route = require('./route/route')
const mongoose = require('mongoose')
const cors = require('cors')
const multer= require("multer")
var path = require("path")
const env =  require("dotenv")

env.config({path: path.join(__dirname,"../.env")})
const app = express()

app.use(express.json())

app.use(cors())

app.use(multer().any())


mongoose.set('strictQuery', false)

mongoose.connect(process.env.Mongodb_Connect , {
    useNewUrlParser: true
})
    .then(() => console.log("MongoDB is connected"))
    .catch(err => console.log(err))


app.use("/", route)

app.listen(process.env.PORT, function () {
    console.log("Express app running on port : ", process.env.PORT)
})