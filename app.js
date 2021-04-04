//jshint eversion:6
require('dotenv').config()

const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose =require("mongoose");
const session = require('express-session')
//const md5 = require('md5');
//const encrypt = require("mongoose-encryption");
const bcrypt = require('bcrypt');
const multer  = require('multer')
//const upload = multer({ dest: 'uploads/' })

const path=require('path');

const saltRounds = 10;
const jwt = require('jsonwebtoken');
//const  popupS = require('popups');
const app=express();

var easyinvoice = require('easyinvoice');
 const fs=require("fs");
const { stringify } = require('querystring');

console.log(process.env.API_KEY);




app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
//app.use(express.static("public"));
app.use(express.static(__dirname+'/public'));

app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret:"Our little secret.",
  resave:false,
  saveUninitialized:false
}))


mongoose.connect("mongodb://localhost:27017/customersDB", {useNewUrlParser: true,useUnifiedTopology: true });

mongoose.connection.once('open',function(){
  console.log("connction has been made");
}).on('error',function(error){
  console.log('connection error',error);
})
mongoose.set("useCreateIndex",true)

const userSchema=new mongoose.Schema({
  email:String,
  password:String,
  name:String,
 number:String,
 masterpassword:String,
 token:String,
imagename:String,
isAdmin:Boolean
});


//userSchema.plugin(encrypt,{secret:process.env.SECRET , encryptedFields:["password"] })
const User=new mongoose.model("User",userSchema);

//category table
const categoryschema=new mongoose.Schema({
  categoryid:String,
  categoryname:String,
categoryimage:String

});

const Category=mongoose.model("Category",categoryschema);

// product schema
const productschema=new mongoose.Schema({
  categoryid:String,
  Pid:String,
  Pname:String,
  Pimage:String,
  Pprice:Number,
  Pminquantity:Number,
  Pmaxquantity:Number,
  });
//product table
const Product=mongoose.model("Product",productschema);

//raaddkress schema

const addressschema=new mongoose.Schema({
  fullname:String,
  phone_no:String,
  pincode:String,
  state:String,
 city:String,
address:String,
user_id:String

});

//ADDRESS MASTER TABLE

const Address=mongoose.model("Address",addressschema);

// cartschema
const cartschema=new mongoose.Schema({

product_id: String,
user_id: String,
order_id:String,
quantity:Number,
price:Number

});
const Cart=mongoose.model("Cart",cartschema);

// PLACING ORDER
const orderschema=new mongoose.Schema({
user_id: String,
product_quantity:Number,
amount_payable:Number,
delivery_address:String,
Mode_Of_Payment:String,
order_id:String,
date:String
});
const Placing_Order=mongoose.model("Placing_Order",orderschema);

const orderofuserschema=new mongoose.Schema({
user_id: String
});
const OrderOfUsers=mongoose.model("OrderOfUsers",orderofuserschema);



app.get("/users",function(req,res){
  User.find(function(err,foundArticles){
    res.send(foundArticles);
  })
})
app.get('/',function(req,res){
  res.render("login")
});
app.get("/signup",function(req,res){
  res.render("signup");
});
app.get("/welcome",function(req,res){
  res.render("welcome");
});
app.get("/forgot",function(req,res){
  res.render("forgot");
});
app.get("/managecategory",function(req,res){


  email = req.session.email_of_loggedin_user;

  User.findOne({email: email},function(err, foundforgot){
    if(err){
      console.log(err);
    }else{
      if(foundforgot){
          console.log(foundforgot.name);
       }
      else{
        console.log("not found");
      }
    }
    Category.find({},function(err,category){
      if(err){
        console.log(err);
      }else{
        console.log(category);
      }
        res.render("managecategory", {name: foundforgot,category:category});
    });

});
});
app.get("/dashboard",function(req,res){
  //fetch name from database using session variable email, and send it with res.render
  email = req.session.email_of_loggedin_user;

  User.findOne({email: email},function(err, foundforgot){
    if(err){
      console.log(err);
    }else{
      if(foundforgot){
          console.log(foundforgot.name);
       }
      else{
        console.log("not found");
      }
    }
  Category.find({},function(err,category){
    if(err){
      console.log(err);
    }else{
      console.log(category);
      //generate unique id which identifies current session
    }
    var query = Cart.findOne({user_id:req.session.logged_in_user._id});
    query.count(function (err, count) {
        if (err) {console.log(err);}
        else {console.log("Count is", count);}

      res.render("dashboard", {name: foundforgot,category:category, count_of_products:count});
  });
});
});
});

app.get("/master",function(req,res){
  //fetch name from database using session variable email, and send it with res.render
  email = req.session.email_of_loggedin_user;

  User.findOne({email: email},function(err, foundforgot){
    if(err){
      console.log(err);
    }else{
      if(foundforgot){
          console.log(foundforgot.name);
       }
      else{
        console.log("not found");
      }
    }

      res.render("master", {name: foundforgot});
    });
});


  var Storage = multer.diskStorage({
    destination:"./public/uploads/",
    filename:function (req, file, cb) {
      cb(null,file.filename+ '-' + Date.now()+path.extname(file.originalname));
    }

  });
  var upload=multer({
    storage:Storage
  }).single('filename')

  //post master add category
app.post("/master",upload,function(req,res,next){
var fileinfo=req.file.filename;
var category=req.body.categoryname;

console.log(category);
  console.log(fileinfo);

  const newaddress=new Category({


    categoryimage:fileinfo,
      categoryname:category


});
newaddress.save(function(err){
    if(err){
      console.log(err);

  }else{
      console.log('updateimage');

      res.redirect("/master");
    }

  });
  });








app.get("/Logout",function(req,res){
  req.session.destroy(function(err) {
  res.redirect('/');
});
});

app.get('/myprofile',function(req,res){
  email = req.session.email_of_loggedin_user;
  // User.find({}).exec(function(err,data)){
  //   if(err) throw err;


  User.findOne({email: email},function(err, foundforgot){
    if(err){
      console.log(err);
    }else{
      if(foundforgot){
         req.session.user = foundforgot;
          console.log(foundforgot);

      }
      else{
        console.log("not found");
      }
    }
    var query = Cart.findOne({user_id:req.session.logged_in_user._id});
    query.count(function (err, count) {
        if (err) {console.log(err);}
        else {console.log("Count is", count);}
  res.render("myprofile", {user: foundforgot,count_of_products:count});
});
});
});
app.get("/product/:id",function(req,res){
  email = req.session.email_of_loggedin_user;
   var id = req.params.id;
   console.log(id);
  User.findOne({email: email},function(err, foundforgot){
    if(err){
      console.log(err);
    }else{
      if(foundforgot){
         req.session.user = foundforgot;
          console.log(foundforgot);
        }
      else{
        console.log("not found");
      }
    }
    Category.find({_id:id},function(err, cat){
      if(err){
        console.log(err);
      }else{

            console.log(cat);
          }



    Product.find({categoryid:id},function(err,product){
      if(err){
        console.log(err);
      }else{
        console.log(product);
      }

      var query = Cart.findOne({user_id:req.session.logged_in_user._id});
      query.count(function (err, count) {
          if (err) {console.log(err);}
          else {console.log("Count is", count);}



  res.render("product",{user: foundforgot,product:product,cat:cat,count_of_products:count});
});
});
});
});
  });


app.get("/address",function(req,res){
  email = req.session.email_of_loggedin_user;
     var id = req.params.id;
Address.find({user_id:req.session.logged_in_user._id},function(err,address){
    if(err){
      console.log(err);
    }else{
      console.log(address);
    }

  User.findOne({email: email},function(err, foundforgot){
    if(err){
      console.log(err);
    }else{
      if(foundforgot){
         req.session.user = foundforgot;
          console.log(foundforgot);

      }
      else{
        console.log("not found");
      }
    }



    var query = Cart.findOne({user_id:req.session.logged_in_user._id});
    query.count(function (err, count) {
        if (err) {console.log(err);}
        else {console.log("Count is", count);}




  res.render("address", {user:foundforgot,address:address,count_of_products:count});
});
});
});
});

app.get("/delete_address",function(req,res){
  email = req.session.email_of_loggedin_user;
     var id = req.params.id;
     Address.deleteOne({user_id:req.session.logged_in_user._id},function(err,addressdel){
         if(err){
           console.log(err);
         }else{
           console.log("delete_address");
           res.redirect("/address");
         }
});
});
app.get("/manageproduct/:id",function(req,res){

  category_id = req.params.id;
  console.log(category_id);
  email = req.session.email_of_loggedin_user;

  User.findOne({email: email},function(err, foundforgot){
    if(err){
      console.log(err);
    }else{
      if(foundforgot){
          console.log(foundforgot.name);
       }
      else{
        console.log("not found");
      }
    }
    Product.find({categoryid:category_id},function(err,product){
      if(err){
        console.log(err);
      }else{
        console.log(product);

      }



  res.render("manageproduct", {user: foundforgot,product:product,categoryid:category_id});
});
});
});
 // cart get
app.get("/cart",function(req,res){
  email = req.session.email_of_loggedin_user;

  User.findOne({email: email},function(err, foundforgot){
    if(err){
      console.log(err);
    }else{
      if(foundforgot){
          console.log(foundforgot.name);
       }
      else{
        console.log("not found");
      }
    }

  Cart.find({user_id: req.session.logged_in_user._id},function(err, products){
      if(err){
        console.log(err);
      }else{
        if(products){
            // make object of product ids
            console.log(products);
            var products_of_user = new Array();
            var total_price = 0;
            console.log("count="+products.count);
            for (var item1 of products) {
                  Product.findOne({_id:item1.product_id}, function(err, product){
                    if(err){
                      console.log(err);
                    }else{
                      console.log(total_price);
                      console.log(item1.product_id);

                      console.log("PC="+item1.price*item1.quantity);
                      products_of_user.push(product);
                      total_price += (item1.price*item1.quantity);
                          req.session.total_price = total_price;
                          console.log(  req.session.total_price);
                    }
                  });

                   console.log("Main"+item1.product_id);


                }
         }
        else{
          console.log("not found");
        }
      }
      var query = Cart.findOne({user_id:req.session.logged_in_user._id});
      query.count(function (err, count) {
          if (err) {console.log(err);}
          else {console.log("Count is", count);}

  res.render("cart", {name: foundforgot,myporoducts: products_of_user,count_of_products:count,total_price:total_price});
});
});
});
});

app.get("/increase-qty/:userid/:productid", function(req, res){

  var productid = req.params.productid;
    var userid = req.params.userid;

    Cart.findOne({user_id:userid, product_id:productid},function(err, product){
      if(err){
        console.log(err);
      }else{
        console.log('done');
      }

    Cart.updateOne({user_id:userid, product_id:productid},{quantity:product.quantity+1},function(err, updateproduct){
      if(err){
        console.log(err);
      }else{
        console.log('done');
      }
    });

});
res.redirect("/cart");
});


// CHECKOUT GET

app.get("/checkout",function(req,res){
  email = req.session.email_of_loggedin_user;

  User.findOne({email: email},function(err, foundforgot){
    if(err){
      console.log(err);
    }else{
      if(foundforgot){
          console.log(foundforgot.name);
       }
      else{
        console.log("not found");
      }
    }

    Address.find({user_id:req.session.logged_in_user._id},function(err,address){
        if(err){
          console.log(err);
        }else{
          console.log("gfg");
          console.log(address);
        }

    var query = Cart.findOne({user_id:req.session.logged_in_user._id});
    query.count(function (err, count) {
        if (err) {console.log(err);}
        else {console.log("Count is", count);}

res.render("checkout", {name: foundforgot,count_of_products:count,address:address,  total_price:req.session.total_price});
});
});
});
});
app.get("/add_product/:categoryid/:productid", function(req, res){
  var productid = req.params.productid;
  var categoryid = req.params.categoryid;
  Product.findOne({_id:productid}, function(err, product){
    if(err){
      console.log(err);
    }else{
      console.log(product);
  }

  OrderOfUsers.findOne({user_id:req.session.logged_in_user._id}, function(err, orderOfUser){
    if(err){
      console.log(err);
    }else{
        if (orderOfUser){
          var order_id = orderOfUser._id;
          console.log("orderofuser",orderOfUser);
        }else{
          const newOrder=new OrderOfUsers({
                 user_id:req.session.logged_in_user._id
        });

        newOrder.save(function(err){
          if(err){
            console.log(err);
          }else{

            console.log("new OrderOfUsers");
          }
        });

          var order_id = newOrder._id;

        }
  }




  const newcart=new Cart({
         user_id:req.session.logged_in_user._id,
         product_id:productid,
         quantity:1,
         price: product.Pprice,
         order_id:order_id
});

newcart.save(function(err){
  if(err){
    console.log(err);
  }else{
    // window.alert("successfully registered");
    console.log("cart data save");
    res.redirect("/product/"+categoryid);
  }
});

});


  });


});
app.get("/delete_cart_item/:productid",function(req, res){
  var productid = req.params.productid;
  var categoryid = req.params.categoryid;
  Cart.deleteOne({product_id: productid},function(err,del){
    if(err){
      console.log(err);
    }else{
      console.log("product deleted");
  res.redirect("/cart")
  }
});
});

app.get("/autocompete/",function(req, res){
var regex=new RegExp(req.query["term"],'i');
var productFilter=Product.find({Pname:regex},{'Pname':1}).sort({"updated_at":-1}).sort({"created_at":-1}).limit(10);
productFilter.exec(function(err,data){

  console.log(data);
  var result=[];
  if(!err){
    if(data && data.length && data.length>0){
      data.forEach(user=>{
      let obj={
        id:user._id,
        label:user.Pname
      } ;
      result.push(obj);
    });

    }
    res.jsonp(result);
  }
});


});




app.post("/signup",function(req,res){
//console.log(req.body);

User.findOne({$or:[{email: req.body.email},{number: req.body.number}]},function(err, foundforgot){
  if(err){
    console.log(err);
  }else{
    if(foundforgot){
        console.log(foundforgot);
        res.send("email_already_exists");
    }


    else{
      bcrypt.hash(req.body.password,saltRounds,function(err,hash){


      var token = jwt.sign({ foo: 'bar' }, 'shhhhh');

        const newUser=new User({
             name:req.body.name,
              email:req.body.email,
              number:req.body.number,
              password:hash,
              token:token,
              isAdmin:false
            //  token:getRandomInt(1000,9999)

});

        newUser.save(function(err){
          if(err){
            console.log(err);
          }else{
            // window.alert("successfully registered");
            res.send(true);
          }
        });
      });
    }
  }

});
});




  app.post("/login",function(req,res){
  console.log("hfhfh");
  const email=req.body.email;
  const password=req.body.password;
  const isAdmin = req.body.isAdmin;
  User.findOne({$and: [{email: email ,isAdmin:isAdmin}]},function(err, foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        bcrypt.compare(password,foundUser.password,function(err,result){
          if(result === true){
            //create session variable email of logged in user

           req.session.email_of_loggedin_user = email;
           req.session.logged_in_user = foundUser;
             res.send({foundUser:true,isAdmin:isAdmin});
            //res.redirect("/welcome")

          }else{
               res.send({foundUser:false});
          }
        })


        }

      }

  });
});
app.post("/forgot",function(req,res){
  console.log("forgot app");

  const email=req.body.email;
  const masterpassword="123456";
  User.findOne({email: email},function(err, foundforgot){
    if(err){
      console.log(err);
    }else{
      if(foundforgot){
        req.session.email = email;
        console.log(req.session.email);
        var data = {
          "is_matched": true,
          "masterpassword": masterpassword
        }
         res.send(data);

      }
      else{
        data = {
          "is_matched": false
        }
        res.send(data)
      }
    }

});
});

app.post("/updatepassword",function(req,res){
      email = req.session.email;
      console.log(email);
      bcrypt.hash(req.body.newpassword,saltRounds,function(err,hash){


      User.updateOne({email:email},{password:hash},function(err){
        if(err){
          console.log(err);
        }else{
          console.log(123);
          res.send(true);
        }


});
});
});

//disk storage

var Storage = multer.diskStorage({
  destination:"./public/uploads/",
  filename:function (req, file, cb) {
    cb(null,file.filename+ '-' + Date.now()+path.extname(file.originalname));
  }

});

var upload=multer({
  storage:Storage
}).single('filename')

app.post("/myprofile",upload,function(req,res){

  var imageFile=req.file.filename;

  User.updateOne({email:req.session.email_of_loggedin_user},{imagename:imageFile},function(err){
    if(err){
      console.log(err);
    }else{
      console.log('done');
    }
});

User.findOne({email:req.session.email_of_loggedin_user},function(err,user){
  if(err){
    console.log(err);
  }else{
    console.log('updateimage');
  }
res.render('myprofile',{user:user});
});


});
app.post("/update-address",function(req,res){
  Address.updateOne({_id:req.session.address_update_id},{fullname:req.body.name,phone_no:req.body.number, state:req.body.state, pincode:req.body.pincode,  city:req.body.city,
    address:req.body.address},function(err){
    if(err){
      console.log(err);
    }else{
      console.log('updatedone');
    }
});
});

app.post("/delete-address",function(req,res){
  Address.DeleteOne({_id:req.session.address_update_id},{fullname:req.body.name,phone_no:req.body.number,  pincode:req.body.pincode,  city:req.body.city,
    address:req.body.address},function(err){
    if(err){
      console.log(err);
    }else{
      console.log('delete');
    }
});
});
//post method for  address
app.post("/address",function(req,res){

       const newaddress=new Address({
        fullname:req.body.name,
        phone_no:req.body.number,
        pincode:req.body.pincode,

        state:req.body.state,
        city:req.body.city,
        address:req.body.address,
        user_id:req.session.logged_in_user._id
      //  token:getRandomInt(1000,9999)
    });
    newaddress.save(function(err){
    if(err){
      console.log(err);
    }else{
      // window.alert("successfully registered");

      // res.render(true);
      res.send(true);

    }
  });
});
app.post("/address_by_id",function(req,res){
console.log(req.body);
 address_id = req.body.address_id;
 console.log(address_id);
 Address.findOne({_id:address_id},function(err,address){
   if(err){
     console.log(err);
   }else{
     console.log(address);
     req.session.address_update_id = address._id;
     res.send(address);

   }


});
});
app.post("/checkout",function(req,res){

  OrderOfUsers.findOne({user_id:req.session.logged_in_user._id},function(err,orderofuser){
    if(err){
      console.log(err);
    }else{

      order_id = orderofuser._id;

  const placing_order=new Placing_Order({
       user_id:req.session.logged_in_user._id,
       product_quantity:req.body.quantity,
       delivery_address:req.body.address,
      amount_payable:req.body.price,
      Mode_Of_Payment:req.body.ModeOfPayment,
      order_id:order_id,
      date:req.body.date

    });
   placing_order.save(function(err){
    if(err){
      console.log(err);
    }else{

      Cart.find({order_id:order_id},function(err,products_in_cart){
        if(err){
          console.log(err);
        }else{
           console.log(products_in_cart);

          var productArray = [];
          var arrayLength = products_in_cart.length;
          for (var i = 0; i < arrayLength; i++) {

            productArray.push(
              {
                  "quantity": products_in_cart[i].quantity,
                  "description": "product",
                  "tax": 0,
                  "price": products_in_cart[i].price
              }
            )


              //Do something
          }
         Address.findOne({_id:placing_order.delivery_address},function(err,address){
            if(err){
              console.log(err);
            }else{
              console.log(address);
              console.log(address.fullname);
            }

           Placing_Order.findOne({date:placing_order.date},function(err,date){
              if(err){
                console.log(err);
              }else{
                console.log("date"+date.date);
              }

            console.log(productArray);
          var data = {
          //"documentTitle": "RECEIPT", //Defaults to INVOICE
          "currency": "INR",
          "taxNotation": "vat", //or gst
          "marginTop": 25,
          "marginRight": 25,
          "marginLeft": 25,
          "marginBottom": 25,
          "logo": "https://www.easyinvoice.cloud/img/logo.png", //or base64
          //"logoExtension": "", //only when logo is base64
          "sender": {
              "company": "Aditya Ecommerce Website",
              "address": "XYZ,Jabalpur(M.P)",
              "zip": "482002",
              "city": "Jabalpur",
              "country": "India"
              //"custom1": "custom value 1",
              //"custom2": "custom value 2",
              //"custom3": "custom value 3"
          },
          "client": {
            "company":address.fullname,
            "address":  address.phone_no,
            "zip": address.address,
            "city":address.state,
            "country": address.city,
           "custom1": address.pincode
           //"custom2": "custom value 2",
           //"custom3": "custom value 3"
       },
          "invoiceNumber":order_id,
          "invoiceDate": date.date,
          "products":productArray,
          "bottomNotice": "Kindly pay your invoice within 15 days."
      };

      //Create your invoice! Easy!
      easyinvoice.createInvoice(data,async function (result) {
          //The response will contain a base64 encoded PDF file
          console.log(result.pdf);


          await fs.writeFileSync("invoice.pdf", result.pdf, 'base64');


      });
    });
  });
        }
      });


        }

        Cart.deleteMany({order_id:order_id},function(err){
          if(err){
            console.log(err);
          }else{
            console.log('cart delete');
          }
      });

     OrderOfUsers.deleteMany({order_id:order_id},function(err){
        if(err){
          console.log(err);
        }else{
          console.log('orderOfUser delete');
        }
    });


     });



}


});
});

var Storage = multer.diskStorage({
  destination:"./public/uploads/",
  filename:function (req, file, cb) {
    cb(null,file.filename+ '-' + Date.now()+path.extname(file.originalname));
  }

});
var upload=multer({
  storage:Storage
}).single('filename')

app.post("/product_create/:categoryid",upload,function(req,res){

var id = req.params.categoryid;
var img=req.file.filename;
  const newproduct=new Product({

        Pname:req.body.productname,
        Pimage:img,
        Pprice:req.body.productprice,
        Pminquantity:req.body.productminquantity,
        Pmaxquantity:req.body.productmaxquantity,
        categoryid:id
    });


  newproduct.save(function(err){
    if(err){
      console.log(err);
    }else{
      // window.alert("successfully registered");
      console.log("save product");

      // res.redirect("/product/"+categoryid);
      res.redirect("/manageproduct/"+id);

    }
  });
});


app.listen(5000,function(){
  console.log("server is running at port 5000");
});
