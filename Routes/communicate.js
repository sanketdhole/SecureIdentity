const request = require('request');
const fs = require('fs');
const path = require('path');

const getHost = request('./local').getHost;


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
        iparray = JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','iptable.json')))
        for (host in iparray){
        var url = 'http://'+host +':3001/block';
        request.post(url,{form:block},(err,response,body)=>{
            if(err){
                console.log("Error to serve block to :"+host);
            }
        });}
        resolve("OK");
    })
}

sendTransation = function ()


module.exports = {sayHi, sendBlock}