const userModel = require("../models/userModel")
const mongoose = require("mongoose")
const {uploadFile} = require("../middlewares/aws")
var bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const { isValidName,isValidEmail,isValidNo,isValidPassword,isValidPin,isValid } = require("../validations/validation");

//========================================================<CREATE USER>========================================//

const registerUser = async function(req,res){
    try{
    let body = req.body
    let files= req.files
    if(body.address){
       
    body.address = JSON.parse(body.address)
    }
    let {fname,lname,email,profileImage,phone,password,address} = body

if (!body || Object.keys(body).length == 0)return res.status(400).send({ status: false, message: "Enter data in body." })

if(!fname) return res.status(400).send({status:false,message:"Please provide first name in body."})
if (!isValid(fname)) return res.status(400).send({ status: false, message: "first name is not valid" })
fname = fname.trim()  
if(!isValidName(fname)) return res.status(400).send({status:false,message:"FirstName should have only letters and minumum 3 letters."})

if(!lname) return res.status(400).send({status:false,message:"Please provide last name in body."})
if (!isValid(lname)) return res.status(400).send({ status: false, message: "Please provide Last Name in string form and it cannot be empty." })
lname = lname.trim()
if(!isValidName(lname)) return res.status(400).send({status:false,message:"LastName should have only letters and minumum 3 letters."})

if (!email) return res.status(400).send({ status: false, message: "Please enter email in body." })
email = email.trim()
if (!isValidEmail(email)) return res.status(400).send({ status: false, message: "Please enter valid email." })
let emailPresent = await userModel.findOne({email:email})
if(emailPresent) return res.status(400).send({ status: false, message: "This email already exists." })
 
if(!phone) return res.status(400).send({ status: false, message: "Please enter phone number in body." })
phone = phone.trim()
if (!isValidNo(phone))return res.status(400).send({status: false,message: "Please enter a valid Mobile number.",});
let phonePresent = await userModel.findOne({phone:phone})
if(phonePresent) return res.status(400).send({ status: false, message: "This phone number already exists." })

if (!password) return res.status(400).send({ status: false, message: "Please enter password in body." });

if (!isValidPassword(password))return res.status(400).send({status: false,message:"Password must be in the Range of 8 to 15 , it must contain atleast 1 lowercase, 1 uppercase, 1 numeric character and one special character."});

if(!address) return res.status(400).send({ status: false, message: "Please enter address in body." })
if(typeof address != "object") return res.status(400).send({ status: false, message: "Address must be in object form." });
let {shipping,billing}=address

if(!shipping) return res.status(400).send({ status: false, message: "Please enter shipping in body." });
if(typeof shipping != "object") return res.status(400).send({ status: false, message: "Shipping must be in object form." });

if(!shipping.street) return res.status(400).send({ status: false, message: "Please enter street in shipping." });
if(typeof shipping.street != "string") return res.status(400).send({ status: false, message: "street must be in string form." });

if(!shipping.city) return res.status(400).send({ status: false, message: "Please enter city in shipping." });
if(typeof shipping.city != "string") return res.status(400).send({ status: false, message: "City must be in string form." });

if(!shipping.pincode) return res.status(400).send({ status: false, message: "Please enter pincode in shipping." });
if(typeof shipping.pincode != "number") return res.status(400).send({ status: false, message: "Pincode must be in Number form." });
if (!isValidPin(shipping.pincode))return res.status(400).send({ status: false, message: "Shipping Pincode must be in number form." });


if(!billing) return res.status(400).send({ status: false, message: "Please enter billing." });
if(typeof billing != "object") return res.status(400).send({ status: false, message: "billing must be in object form." });

if(!billing.street) return res.status(400).send({ status: false, message: "Please enter street in billing." });
if(typeof billing.street != "string") return res.status(400).send({ status: false, message: "street must be in string form." });

if(!billing.city) return res.status(400).send({ status: false, message: "Please enter city in billing." });
if(typeof billing.city != "string") return res.status(400).send({ status: false, message: "City must be in string form." });

if(!billing.pincode) return res.status(400).send({ status: false, message: "Please enter pincode in billing." });
if(typeof billing.pincode != "number") return res.status(400).send({ status: false, message: "Billing Pincode must be in number form." });
if (!isValidPin(billing.pincode))return res.status(400).send({ status: false, message: "Please enter valid pincode." });





let hashing = bcrypt.hashSync(body.password,10)
body.password=hashing

    if(files && files.length>0){
        let uploadedFileURL= await uploadFile(files[0] )
        body.profileImage = uploadedFileURL
  
    }
    else{
       return res.status(400).send({ message: "Please enter profile image in body" })
    }
    

    let createUser = await userModel.create(body)

    
   createUser = createUser._doc
   delete createUser.__v

   
    return res.status(201).send({status:true,message:"Success",data:createUser})

}
catch(err){
    return res.status(500).send({status:false,message:err.message})
}
}

//==========================================================<USER LOGIN>==================================================//

let loginUser = async function(req,res){
    try{
    const {email,password} = req.body
    
    if (!req.body || Object.keys(req.body).length == 0)return res.status(400).send({ status: false, message: "Enter data in body." })

    if(!email) return res.status(400).send({status:false, message: "email is required"}) 
    let check = await userModel.findOne({email : email})  // for getting the hashed password from db
    if(!check) return res.status(404).send({status : false, message: "email is not found"})

    let hashedToken = check.password        // assign hashed token into hashedToken

    if(!password) return res.status(400).send({status:false, message: "password is required"})

    let decrypt = await bcrypt.compare(password,hashedToken)  // have boolean true or false 

    if(decrypt === true){
        let token = jwt.sign({userId : check._id.toString()}, "dummykey",{expiresIn : "4h"})
        return res.status(200).send({status : true, message : "User login successfull",data : {userId : check._id, token : token}})
    }else{
        return res.status(400).send( {status : false, message : "enter valid password"})
    }
    }catch(err){
        res.status(500).send({status : false, error : err.message})
    }

}

//================================================<GET USER>========================================================//

    const getUserByParams = async function(req,res){
    try {
        let userId=req.params.userId
        if(!userId) return res.status(400).send({ status: false, message: "userId is required in params" })
        if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "userId is invalid" })
        
        let getUser=await userModel.findOne({_id:userId})
        if(!getUser)return res.status(404).send({status: false, message: "userdetails not found"})


        return res.status(200).send({status:true,message: "User profile details",data:getUser})

    } catch (error) {
        return res.status(500).send({status:false,message:error.message})
    }
}

//===================================================<UPDATE USER>=======================================================//

const updateUser = async function (req, res) {
    let data = req.body
    let userId = req.params.userId
try{
    
 let {fname,lname,email,phone,password,profileImage} = data
    let result = {}

    if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).send({ status: false, message: "please Provide valid userId" })
    }
   

    let checkUser = await userModel.findOne({ _id: userId })
    if (!checkUser) {
        return res.status(400).send({ status: false, message: " User Does Not Exist" })
    }
    if(userId!=req.bearerToken) return res.status(403).send({ status: false, message: "you are not authorized" })

    if (fname) {
        fname = fname.trim()
        if (!isValid(fname)) return res.status(400).send({ status: false, message: "first name is not valid" })
        if(!isValidName(fname)) return res.status(400).send({status:false,message:"First Name should have only letters and minumum 3 letters."})
        result.fname = fname
    }

    if (lname) {
        lname = lname.trim()
       if (!isValid(lname)) return res.status(400).send({ status: false, message: "Please provide Last Name in string form and it cannot be empty." })
        if(!isValidName(lname)) return res.status(400).send({status:false,message:"Last Name should have only letters and minumum 3 letters."})
        result.lname = lname
    }



    if (email) {
        email = email.trim()
        if (!isValid(email)) return res.status(400).send({ status: false, message: "Email is  is not valid" })
        if (!isValidEmail(email)) return res.status(400).send({ status: false, message: "Please enter valid email." })

        let emailPresent = await userModel.findOne({ email: email })
        if (emailPresent) return res.status(400).send({ status: false, message: " email already exist please provide another email" })
        result.email = email
    }


    if (password) {
        password = password.trim()
        if (!isValid(password)) return res.status(400).send({ status: false, message: "Please Provide Proper Password" })
        // if(password.length<8 || password.length>15)  return res.status(400).send({ status: false, message: "Password's length must be between 8 & 15." });
    if (!isValidPassword(password))return res.status(400).send({status: false,message:"Password must be in the Range of 8 to 15 , it must contain atleast 1 lowercase, 1 uppercase, 1 numeric character and one special character."});
        let encryptPassword = await bcrypt.hash(password, 10)
        result.password = encryptPassword

    }

    if (phone) {
        phone = phone.trim()
        
        if (!isValidNo(phone))return res.status(400).send({status: false,message: "Please enter a valid Mobile number.",});
        let checkPhone = await userModel.findOne({ phone: phone })
        if (checkPhone) return res.status(400).send({ status: false, message: " mobile number already exist please provide another phone number" })
        result.phone = data.phone

    }

    let files = req.files
    if (files && files.length > 0) {
       let uploadedFileURL = await uploadFile(files[0])
        data.profileImage = uploadedFileURL
        result.profileImage = data.profileImage

    }

if(data.address){
    data.address = JSON.parse(data.address)
}

let {address} = data
 

//================================================"shipping add"==============================================//
if (address) {
    if (address.shipping) {
    if (address.shipping.street) {
        if (!isValid(address.shipping.street)) return res.status(400).send({ status: false, message: "Street  is not valid" })
        result["address.shipping.street"] = address.shipping.street
    }
    }
}

if (address) {
    if (address.shipping) {
    if (address.shipping.city) {
        if (!isValid(address.shipping.city)) return res.status(400).send({ status: false, message: "City  is not valid" })
        result["address.shipping.city"] = address.shipping.city
    }
    }
}

if (address) { 
    if (address.shipping) {
    if (address.shipping.pincode) {
        if(typeof (address.shipping.pincode) != "number" )//|| address.shipping.pincode.trim()=="")
        return res.status(400).send({ status: false, message: "please Enter pincode in Number" })
        result["address.shipping.pincode"] = address.shipping.pincode
    }
    }
}

//======================================"for billing address"======================================//

if (address) {
    if (address.billing) {
    if (address.billing.street) {
        if (!isValid(address.shipping.street)) return res.status(400).send({ status: false, message: "Street  is not valid" })    
        result["address.billing.street"] = address.billing.street 
    } 
    } 
}

    if (address) {
        if (address.billing) {
        if (address.billing.city) {
            if (!isValid(address.shipping.city)) return res.status(400).send({ status: false, message: "city  is not valid" })

            result["address.billing.city"] = address.billing.city   
        }
        }
    }
 
    if (address) {
        if (address.billing) {
        if (address.billing.pincode) {
            if(typeof (address.billing.pincode) !="number")//|| address.billing.pincode.trim()=="")
            return res.status(400).send({ status: false, message: "please Enter pincode in Number" })
            result["address.billing.pincode"] = address.billing.pincode    
        }
        }
    }

   
    if (Object.keys(result).length == 0) {
        return res.status(400).send({ status: false, message: "Please Provide some data for updation" })
    }

    let updateUser = await userModel.findOneAndUpdate({ _id: userId }, result, { new: true })

    return res.status(200).send({ status: true,message:"User profile updated", data: updateUser })
}catch(error){
    return res.status(500).send({status:false, message: error.message})
}
}






module.exports={registerUser,loginUser,getUserByParams,updateUser}