const express = require("express");
let app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const fs = require("fs")

const multer = require('multer');
 
// SET STORAGE
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
    cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
    }
    })
const upload = multer({ storage: storage })    


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


//Schema image
var imgSchema = mongoose.Schema({
    title:String,
    content:String,
    img:String,
    img_type:String,
    email:String,
    like:[String],
    comment:[String]
    });
    const image = mongoose.model("posts",imgSchema,"posts"); 

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

// reset
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


// creating  a post


app.post("/create-post",upload.single('myImage'),(req,res)=>{
    const title = req.body.title;
    const content = req.body.content;
    const email = req.body.userEmail;
    const imgs = fs.readFileSync(req.file.path);
    const encode_img = imgs.toString('base64');
    var final_img = {
      contentType:req.file.mimetype,
      image: new Buffer(encode_img,'base64')
    };
    console.log(imgs)
    image.create({
        title: title,
        content:content,
        img: encode_img, 
        img_type: final_img.contentType,
        email: email,
        like: ''
    })
    const dis  = {
        img:final_img,
        content: content
    }
    res.send(dis)
})

// retriving the post
app.get("/view-post", async function(req,res){
    const find = await image.find({})
    res.send(find)
})

// update-post
app.put("/update-post",upload.single('myImage'),async function(req, res){
    const id = req.body.id;
    const title = req.body.title;
    const content = req.body.content;
    const userEmail = req.body.userEmail;
    const imgs = fs.readFileSync(req.file.path);
    const encode_img = imgs.toString('base64');
    console.log(req.body)
    await image.updateOne(
        {_id:id},
        {
            $set: {title:title, content:content, userEmail:userEmail, img:encode_img}
        }
    )
    res.send("updated")
})

//delete a post

app.delete("/delete-post",upload.single('myImage'), async function(req,res){
    const id = req.body.id;
    await image.deleteOne({_id:id});
    res.send("successfully deleted")
})


//like a post
app.put("/like-post",upload.single('myImage'), async function(req,res){
    const email = req.body.userEmail;
    const id = req.body.id;
    await image.updateOne(
        {_id:id},
        {
            $push: {like: [email] }
        }
    )
    res.send("liked the post");
})

// comment
app.put("/comment-post",upload.single('myImage'), async function(req,res){
    const comment = req.body.comment;
    const id = req.body.id;
    await image.updateOne(
        {_id:id},
        {
            $push: {comment: [comment]}
        }
    )
    res.send("commented the post");
})



