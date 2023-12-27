import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import mysql from "mysql";
import csv from "fast-csv";
import { error } from "console";
import ejs from "ejs";
import fs from "fs";




const app = express();
const port = 8080;
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
//fetch data from api
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: 'suhaas@02',
    port: 3306
    
})
db.connect(function(err) {

    if (err) throw err;
    console.log('Database is connected successfully !');
    db.query('create database if not exists tensorgo', (err) => {
        if(err)
            throw err;
        db.query('use tensorgo');
         db.query('drop table if exists UserMaster', (error, result, fields) => {
            if (error)
                throw error;
                
        })
        db.query(`create table if not exists UserMaster(
            id int primary key not null,
            name varchar(255) not null,
            email varchar(255) not null,
            gender enum('male','female') not null,
            status varchar(255) not null
            )
            `)
    })
  });
app.get('/', async(req,res) => {

    try{
        const response = await axios.get('https://gorest.co.in/public-api/users');
        const userData = response.data;
        // console.log(userData);
        // res.render('index.ejs', {users : userData});
        storeData(userData.data);

        //now fetching data from db
        fetchDataFromDB().then(data =>{
            return res.render('index.ejs', {users: data}); 
        });
        // console.log(fetchData);
        // res.render('index.ejs', {users: fetchData}); 
        

    }
    catch
    {
        console.log(error);
    }
});

app.get('/exportCSV', async (req, res) => {
    try {
        const userData = await fetchDataFromDB();

        // Create a CSV stream
        const csvStream = csv.format({ headers: true });

        // Pipe the CSV stream to the response (download)
        res.setHeader('Content-disposition', 'attachment; filename=user_data.csv');
        res.set('Content-Type', 'text/csv');
        csvStream.pipe(res);

        // Write the user data to the CSV stream
        userData.forEach(user => {
            csvStream.write(user);
        });

        // End the CSV stream
        csvStream.end();
    } catch (error) {
        console.error('Error exporting user data to CSV:', error.message);
        res.status(500).send('Internal Server Error');
    }
});



function storeData(userData){
    try{
       
        for(const user of userData)
            {
                const {id, name, email, gender, status} = user;
                db.query('INSERT INTO UserMaster (id, name, email, gender, status) VALUES (?, ?, ?, ?, ?)', [id, name, email, gender, status], (err, res, fields) =>{
                    if(err)
                        throw err;
                    
                });
            }
        
    }
    catch(error)
    {
        res.send('duplicate entry')
        console.log(error);
    }
}

function fetchDataFromDB(){
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM UserMaster', (error, results, fields) => {
            if(error)
                reject(error);
            const users = results.map(dummy => {
                return {id : dummy.id, name : dummy.name, email : dummy.email, status: dummy.status, gender : dummy.gender}
            // console.log(fields)
            })
            console.log(results)
            resolve(results)
        })
    })
}

app.listen(port, () => {
    console.log(`Server running at port ${port}`);
});