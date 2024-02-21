const express=require ('express');
const app=express();
const cors=require('cors');
const mongoose =require('mongoose');
const User=require('./models/user.model');
const jwt=require('jsonwebtoken');
const bcrypt=require('bcrypt');

app.use(cors());
app.use(express.json());
mongoose.connect('mongodb://localhost:27017/userAuth') 


function verifyToken(req, res, next){
    const token = req.headers['authorization'];
    if(!token){
        return res.status(401).json({message: 'Unauthorized: Token not found'})
    }

    jwt.verify(token, 'somethingsecure', (err, decoded)=>{
        if(err){
            return res.status(401).json({message:'Unauthorized: Couldnt decode token'})
            if (err.name === 'TokenExpiredError') {
                return res.redirect('/login');
            }
           
        }
       
        req.user=decoded;
        next();
    })
}

app.get('/api/quote',verifyToken, (req,res)=>{
    res.json({quote:req.user.name});
})

app.post('/api/register', async (req, res)=>{
    console.log(req.body)
    const hashedPass=await bcrypt.hash(req.body.password, 10);

    try{
    const user = await User.create({
        name:req.body.name,
        email:req.body.email,
        password:hashedPass,
        role: req.body.role || 'user',
    })
    res.json({status:'ok'})
    }catch (err){
        res.json({status:'error', error:'Duplicate email'})
    }
})

app.post('/api/login', async (req, res)=>{
    const user= await User.findOne({
        email:req.body.email,
    })

    if(!user){
        return res.json({status:'Error: email not found', user: false});
    }

    const match=await bcrypt.compare(req.body.password, user.password);
  
    if(match){
        const token=jwt.sign({
            name: user.name,
            email:user.email,
            role:user.role
        },'somethingsecure',{expiresIn:'1h'})


        return res.json({status:'ok', user:true, token, role:user.role});
    }else{
        return res.json({status:'error', user:false});
    }

})

app.get('/api/admin', verifyToken, (req,res)=>{
    res.json({quote:req.user.name});
})

app.post('/api/addForm', verifyToken, async(req, res)=>{
    try{
        const{name, age, country}=req.body;

        const userId=req.user.email;

        
        const user = await User.findOneAndUpdate(
            {email: userId},
            {$set: {"formDetails.name":name, "formDetails.age":age, "formDetails.country":country}},
            {new:true}
        )

        if(!user){
            return res.status(404).json({status:'error', message:'User not found'})
        }
        
        res.status(200).json({status:'success', message:'Form submitted successfully'});
        
    }catch(error){
        console.error('Error submitting form: ', error);
        res.status(500) .json({status:'error', message:'Internal server error'});
    }
})

app.get('/api/fetchForm',verifyToken, async(req, res)=>{
    try{
        const userId = req.user.email;

        const user=await User.findOne({email: userId}, {formDetails:1});

        if(!user){
            return res.status(404).json({status:'error', message:'User not found'});
        
        }

        const { formDetails } = user;
        const { approved } = formDetails;

        res.status(200).json({status:'ok', formDetails, approved});

  
    }catch(error){   
        console.error('Error fetching form data: ', error);
        res.status(500).json({status:'error', message:'Internal server errror'});
    }
})

app.get('/api/users', verifyToken, async(req, res)=>{
    try{
        const users=await User.find({role:'user'}, {password: 0});
   

        res.status(200).json({status:'error', users});
    }catch(error){
        console.error('Error fetching users', error);
        res.status(500).json({status:'error', message:'Internal server error'});
    }
})

app.post('/api/approveUser/:userId', verifyToken, async (req, res) => {
    try {
      const userId = req.params.userId;
  
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ status: 'error', message: 'User not found' });
      }
  
      user.formDetails.approved = true;
  
      await user.save();
  
  
      res.status(200).json({ status: 'success', message: 'User approved successfully' });

    } catch (error) {

      console.error('Error approving user:', error);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  });
  
  app.post('/api/rejectUser/:userId', verifyToken, async (req, res) => {
    try {
      const userId = req.params.userId;
  
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ status: 'error', message: 'User not found' });
      }
  
      user.formDetails.approved = false;
  
      await user.save();
  
  
      res.status(200).json({ status: 'success', message: 'User rejected' });
    } catch (error) {

      console.error('Error approving user:', error);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  });
  


app.listen(1337, ()=>{
    console.log('Server started at port 1337');
})