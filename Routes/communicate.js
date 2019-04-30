const request = require('request');
const fs = require('fs');
const path = require('path');



var sayHi = function (host){
    return new Promise((resolve,reject)=>{
        var url = 'http://'+host+':3001/hi';
        request(url,(err, response, body)=>{
            if (err){
                reject(err);
            }
            else{
                resolve(body);
            }
        });
    });
}

sendBlock = function (block){
    return new Promise((resolve,reject)=>{
        iparray = JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','iptable.json')));
        block = JSON.stringify(block);
        function sendB (host,index,iptable){
        var url = 'http://'+host +':3001/block';
        request.post(url,{form:{block:block}},(err,response,body)=>{
            if(err){
                console.log("Error to serve block to :"+host);
            }
        });}
        iparray.forEach(sendB);
        resolve("OK");
    })
}

sendTransation = function(data){
    return new Promise((resolve,reject)=>{
        var getHost = require('./local').getHost;
        var host = getHost();
        stringData = JSON.stringify(data);
        var url = 'http://'+host+':3001/request';
        request.post(url,{form:{data:stringData}},(err,response,body)=>{
            if(err){
                console.log("Error at sending the transation data to fixed host.");
                reject("Sorry got error",err);
            }
            else{
                resolve("OK");
            }
        });
    });
}


module.exports = {sayHi, sendBlock, sendTransation}