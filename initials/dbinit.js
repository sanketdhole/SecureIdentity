var sql = require('mysql');

var conn = sql.createConnection({
    host:'localhost',
    user:'admin',
    password:'abcd'
})

conn.connect();

conn.query('create database if not exists blocksystem',(error,result,fields)=>{
    if (error){
        console.log(error);
        console.log("Some error in the creating database");
    }
    else{
        conn.end();
    }
});

