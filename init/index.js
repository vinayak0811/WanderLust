const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../model/listing.js");

main()
    .then(() =>{
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });
     
async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}

const  initDB = async () =>
{
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({ ...obj, owner: '682e253878b2c6638701d313'}));
    await Listing.insertMany(initData.data);
    console.log("Data was initialized");
};

initDB();