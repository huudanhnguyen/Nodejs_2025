const mongoose = require('mongoose'); // Erase if already required
const bcrypt = require('bcrypt'); // For hashing passwords
// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema({
    firstname:{
        type:String,
        required:true,
    },
    lastname:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    mobile:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    cart:{
        type:Array,
        default:[], 
    },
    address:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'Address'
        }
    ],
    wishlist:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'Product'
        }
    ],
    isBlocked:{
        type:Boolean,
        default:false,
    },
    role:{
        type:String,
        default:'user',
        enum:['user','admin'],
    },
    refreshToken:{
        type:String,
    },
    passwordchangeAt:{
        type:String,
    },
    passwordResetToken:{
        type:String,
    },
    passwordResetExpires:{
        type:Date,
    },

}, {
    timestamps: true, // Automatically add createdAt and updatedAt fields

});
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        // Hash the password before saving
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    // Compare the candidate password with the hashed password
    return await bcrypt.compare(candidatePassword, this.password);
};

//Export the model
module.exports = mongoose.model('User', userSchema);