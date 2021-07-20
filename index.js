const express = require("express");
let app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const JWT_SECRET ='hiebebrhibhvbhivhrvr'

// database connection
mongoose.connect('mongodb://localhost:27017/users', {useNewUrlParser: true, useUnifiedTopology: true}, function(err){
    if(err){
        throw err;
    }
    else{
        console.log('Connected to database');
        app.listen(3000);
        console.log('Server listening on port 3000');
    }
});
const conn = mongoose.connection;


// schema 
const login = new mongoose.Schema({
    name: String,
    email: {type: String, unique: true},
    pass: String
});
const user_details = mongoose.model('user_details', login , 'user_details');


//user registration
app.post('/register', async function (req,res) {
    const { name, email, pass: ppass} = req.body;
    const pass = await bcrypt.hash(ppass, 5)
    try{
        await user_details.create({
            name,
            email,
            pass,
        })
        res.send('user created successfully')
    }catch(error){
        if(error.code === 11000){
            res.send("email already exists");
        }
        else{
            console.log(error.message)
        }
    }
});

//user_login

app.post('/login', async function(req,res){
    const {email, pass}= req.body;
    console.log(email)
    const log= await user_details.findOne({email})
    console.log(log)
    if(!log){
        res.send("invalid email/password  ")
    }
    if(await bcrypt.compare(pass, log.pass)){
        const token = jwt.sign
        ({
            email: log.email
        },
        JWT_SECRET
        )
        return res.json ({status: 'ok', data: token})
    }else{
        res.send("invalid email/password  ")
    }

})

// change password
app.post('/forgot', async function(req, res){
    const email = req.body.email;
    const log= await user_details.findOne({email})
    if(!log){
        res.send("invalid email/password  ")
    }
    else{
        const token = jwt.sign
        ({
            email: log.email
        },
        JWT_SECRET
        )
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'vishalbond547@gmail.com',
              pass: 'Vishal0007'
            }
          });
          
        const  mailOptions = {
            from: 'vishalbond547@gmail.com',
            to: `${email}`,
            subject: 'reset link',
            text: `click this link http://localhost:3000/reset/${token}`
          };
          
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
    res.send("email sent")
    }

})

app.get('/reset/:id', async function(req, res){
    const token = req.params.id;
    const pass = req.body.pass;
    console.log(token)
    try{
        const user = jwt.verify(token, JWT_SECRET)
        const email = user.email;
        const hashpass = await bcrypt.hash(pass, 5);
        await user_details.updateOne(
            {email},
            {
                $set: {pass: hashpass}
            }
        )
        
        res.send("password changed")
    }catch(error){
        res.json({statu: 'error', error: ';))'})
    }
    


});