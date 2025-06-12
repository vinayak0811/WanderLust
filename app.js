if(process.env.NODE_ENV != "production")
{
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./model/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");


// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const DB_URL = process.env.ATLASDB_URL

main()
    .then(() =>{
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });
     
async function main() {
    await mongoose.connect(DB_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
    mongoUrl: DB_URL,
    crypto: {
        secret: process.env.SECRET
    },
    touchAfter: 24 * 3600,
});

store.on("error", () => {
    console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie:{
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

// app.get("/",(req,res) => {
//     res.send("HI,i am root");
// });


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) =>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// app.get("/test",async (req,res) => {
//     let = sample = new Listing({
//         title: "My New Villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Calangute,Goa",
//         country:"India",
//     });
//     await sample.save();
//     console.log("sample was saved");
//     res.send("successful testing");
// });

// //index route
// router.get("/listings",wrapAsync(async (req,res) =>{
//     const allListings = await Listing.find({});
//     res.render("listings/index.ejs",{ allListings });
// }));

// //new route
// router.get("/listings/new", (req,res) =>
// {
//     res.render("listings/new.ejs");
// });

// //show route
// router.get("/listings/:id",wrapAsync(async (req,res) =>
// {
//     let {id} = req.params;
//     const listing = await Listing.findById(id).populate("reviews");
//     res.render("listings/show.ejs",{ listing });
// }));

// //create route
// router.post("/listings", validateListing, wrapAsync(async (req,res,next) =>
//     {
//         //let {title,description,image,price,location,country} = req.body;
//         const newlisting = new Listing(req.body.listing);
//         await newlisting.save();
//         res.redirect("/listings");
//     })
// );

// //edit route
// router.get("/listings/:id/edit",wrapAsync( async(req,res) =>{
//     let {id} = req.params;
//     const listing = await Listing.findById(id);
//     res.render("listings/edit.ejs",{listing});
// }));

// //update route
// router.put("/listings/:id", validateListing, wrapAsync(async (req,res)=>{
//     if(!req.body.listing)
//     {
//         throw(new ExpressError(400,"Send valid data for listing"));
//     }
//     let {id} = req.params;
//     await Listing.findByIdAndUpdate(id,{...req.body.listing});
//     res.redirect(`/listings/${id}`);
// }));

// //delete route
// router.delete("/listings/:id",wrapAsync(async (req,res) =>{
//     let {id} = req.params;
//     let deletedListing = await Listing.findByIdAndDelete(id);
//     console.log(deletedListing);
//     res.redirect("/listings");
// }));

//Reviews
// //Post Review Route
// app.post("/listings/:id/reviews" ,validateReview ,wrapAsync(async (req, res) =>
// {
//     let listing = await Listing.findById(req.params.id);
//     let newReview = new Review(req.body.review);
//     listing.reviews.push(newReview);

//     await newReview.save();
//     await listing.save();

//     console.log("new review saved");
//     res.redirect(`/listings/${listing.id}`);
// }));

// //Delete Review Route
// app.delete("/listings/:id/reviews/:reviewId", wrapAsync( async(req,res) =>
// {
//     let {id, reviewId} = req.params;

//     await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
//     await Review.findByIdAndDelete(reviewId);

//     res.redirect(`/listings/${id}`);
// }));

//page not found
app.all("*",(req,res,next) =>
{
    next(new ExpressError(404,"Page Not Found!"));
});

app.use((err, req, res, next) =>{
    let { statusCode = 500 , message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { err });
    // res.status(statusCode).send(message);
});

app.listen(8080,() => {
    console.log("Server is listening to port 8080..");
})