const express = require('express');
const app = express();
const mysql = require('mysql');
const geocoder = require('geocoder');
const dotenv = require('dotenv');
const cors = require('cors');

//referencing the index.html file
app.use(express.static(__dirname + '/views'));
app.use(cors());
//referencing the style
app.use(express.static(__dirname + '/public'));
dotenv.config();


var db = mysql.createPool({host: "swprodb.mysql.database.azure.com", user: "swprodb@swprodb",
 connectionLimit:10,
 password:'cts5-2019', 
 database: 'iexplore', 
 port: 3306, 
});


app.get("/coordinates", (req,res) =>{
    let sql = "SELECT * FROM location";
    db.query(sql, (err,result) =>{
        if(err){
            console.log(err.message);
        }

        res.status(200).json({
            data: result
        })
    })
})


app.get("/:id", (req,res) =>{
    let sql = `SELECT * FROM EVENT WHERE Id = ${req.params.id}`;
    db.query(sql, (err,result) =>{
        if(err){
            console.log(err.message);
        }

        res.status(200).json({
            data: result
        })
    })
})
//get filtered options from the database
app.get("/coordinates/:city", (req,res) =>{

    //transform in string
     const string = JSON.stringify(req.params.city);
    let sql = `SELECT * FROM LOCATION WHERE City = ${string}`;
    db.query(sql, (err,result) =>{
        if(err){
            console.log(err.message);
        }

        res.status(200).json({
            data: result
        })
    })
})

app.get("/coordinates/company/:company", (req,res) =>{
    //transform in string
     const string = JSON.stringify(req.params.company);
    let sql = `SELECT * FROM EVENT WHERE Company = ${string}`;
    db.query(sql, (err,result) =>{
        if(err){
            console.log(err.message);
        }
        res.status(200).json({
            data: result
        })
    })
})

app.get("/coordinates/company/location/:id", (req,res) =>{
    //transform in string
     console.log(req.params.id);
    let sql = `SELECT * FROM LOCATION WHERE EventID = ${req.params.id}`;
    db.query(sql, (err,result) =>{
        if(err){
            console.log(err.message);
        }

        res.status(200).json({
            data: result
        })
    })
})

app.get("/coordinates/company/location/latlng/:id", (req,res) =>{
    //transform in string
    console.log(req.params.id);
    let sql = `SELECT Latitude, Longitude, EventID FROM event`
    + ` JOIN location ON location.EventID = event.Id` + ` WHERE event.Id = ${req.params.id}`;
    db.query(sql, (err,result) =>{
        if(err){
            console.log(err.message);
        }
        console.log(result)
        res.status(200).json({
            data: result
        })
    })
})




app.get("/", (req,res)=>{
    res.render("index.html");
})

var PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log('App listening on port 4000!');
});