
import mongoose from "mongoose";
import { GenderEnum, ProvidersEnum, RolesEnum } from "../../Common/enums/user.enum.js";
// import { GoogleAuth } from "google-auth-library";
// import { Profiler } from "react";

const userScema = new mongoose.Schema({
    // TASK: "Make another field the _id and delete the original _id"
    // We use the (unique, required) email field as the document's real _id,
    // instead of letting MongoDB auto-generate an ObjectId.
    _id: {
        type: String,
    },
    firstName: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 20,
        lowercase: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 20,
        lowercase: true,
        trim: true
    },
    age: {
  type: Number,
  required: true,
  min: 1,
  max: 120,
  index: true
},
    gender: {
        type: String,
        // enum: ['male', 'female'],
         enum:Object.values(GenderEnum),
        default: GenderEnum.MALE

    },
    email: {
        type: String,
        required: true
        // No separate unique index needed here: email IS the _id now,
        // and MongoDB already enforces uniqueness on _id.
    },
    // password: {
    //     type: String,
    //     unique: true,
    //     set(value) {
    //         const randomValue = Math.random()
    //         return value + randomValue

    //     }
    // },
    password: {
      type: String,
      required: true, 
    },
    phoneNumber: {
        type: String,
        required: true
    },
    otps: {
        confirmation: String,
        resetPassword: String
    },
    isConfirmed:{
        type:Boolean,  
        default:false
    },
    role:{
        type:String,
        // enum:["user","admin"],
          enum:Object.values(RolesEnum),
        default:RolesEnum.USER

    },
     provider: {
    type: String,
    enum: Object.values(ProvidersEnum),
    default: ProvidersEnum.LOCAL
  },
  GoogleSub:String,
  profilePicture:String,

},
    {
        _id: false, // stop Mongoose from auto-generating an ObjectId _id
        timestamps: true,
        toJSON: { virtuals: true },
        virtuals: {
            fullName: {
                get() {
                    return `${this.firstName} ${this.lastName}`
                }
            }
        },
        methods: {
            getFullName() {
                return `${this.firstName} ${this.lastName}`
            },
            getDouleAge() {
                return this.age * 2
            }
        }
    })


// Fill the custom _id from the email right before validation runs,
// so `required` checks on _id still pass and duplicate emails are
// rejected as duplicate _id (E11000) errors.
userScema.pre('validate', function (next) {
    if (!this._id) {
        this._id = this.email
    }
    next()
})

userScema.index({ firstName: 1, lastName: 1 }, { name: 'idx_first_last_unique', unique: true })
userScema.virtual("Message",{
    ref:"Messages",
    localField:"_id",
    foreignField:"receiverId"
})
const user = mongoose.model("user", userScema)
export default user