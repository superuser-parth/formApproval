const mongoose = require('mongoose')

const User= new mongoose.Schema(
    {
        name :{type:String, required:true},
        email:{type:String , required:true},
        password:{type:String, required:true},
        quote:{type:String},
        role: {
            type: String,
            enum: ['admin', 'user'],
            default: 'user' 
        },
        formDetails: {
          name: { type: String },
            age: { type: Number },
            country: {type: String},
            approved: {
                type: Boolean,
                default: false 
            }

        }


    },
    {collection: 'user-data'}
)

const model=mongoose.model('Userdata', User)

module.exports= model 

