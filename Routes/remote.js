const express = require('express');
const path = require('path');
const fs = require('fs');
const rsa = require('node-rsa');


const Transation = require('../blochchain/transaction');
const block = require('../blochchain/block');
const BlockChain = require('../blochchain/blockchain');
const getHost = require('./local').getHost;
const sendBlock = require('./communicate').sendBlock;

let fixedNode = false;
let genesisBlock = new block();
let blockchain = new BlockChain(genesisBlock);

var remoteRoute = express.Router();


remoteRoute.post('/hi',(req,res)=>{
    if(req.ip==getHost()){
        fixedNode = true;
        res.send("OK");
    }
    else{
        var ip = req.ip;
        var user = req.body['user'];
        fs.readFile(path.join(__dirname,'..','data','iptable.json'),(err,data)=>{
            if(err){
                console.log("Error while reading file iptable.json");
            }
            else{
                var iptable = JSON.parse(data);
                if(iptable.indexOf(ip)>=0){
                    console.log("Already added "+ip+" to IP table");
                }
                else{
                    iptable.push(ip);
                }
                fs.writeFile(path.join(__dirname,'..','data','iptable.json'),JSON.stringify(iptable),(err)=>{
                    if(err){
                        console.log(err);
                    }
                    fs.readFile(path.join(__dirname,'..','data','users.json'),(err,result)=>{
                        var userslist = JSON.parse(result);
                        if(userslist.indexOf(user)>=0){
                            console.log('Already added the user to userslist '+user['email']);
                        }else{
                            userslist.push(user);
                            fs.writeFile(path.join(__dirname,'..','data','users.json'),JSON.stringify(userslist),(err=>{
                                if(err){
                                    console.log(err);
                                }
                                fs.readFile(path.join(__dirname,'..','data','profile.json'),(err,data)=>{
                                    res.send(JSON.parse(data));
                                });
                            }));
                        }
                    });
                })
            }
        });
    }
})

remoteRoute.post('/request', (req, res) => {
    var data = req.body['data'];
    data = JSON.parse(data);
    var transation = new Transation(data['from'], data['to'], data['data'], req.ip);
    var block = blockchain.getNextBlock([transation]);
    blockchain.addBlock(block);
    console.log(block);
    var email = block['transactions'][0]['to']['email'];
    fs.readFile(path.join(__dirname,'..','data','profile.json'),(err,data)=>{
        data = JSON.parse(data);
        if(email==data['email']){
            //do some thing to resond to request
            var bufferedData = Buffer.from(JSON.parse(block['transactions'][0]['data']).data);
            console.log(bufferedData);
            fs.readFile(path.join(__dirname,'..','data','userdata.json'),(err,result)=>{
                result = JSON.parse(result);
                var privateKey = rsa(result['private']);
                var decryptedData = privateKey.decrypt(bufferedData);
                decryptedData = decryptedData.toString('utf-8');
                var requestObj = {};
                requestObj['data']=decryptedData;
                requestObj['from']=block['transactions'][0]['from']['email'];
                requestObj['ip']=block['transactions'][0]['ip'];
                fs.writeFile(path.join(__dirname,'..','data','request.json'),JSON.stringify(requestObj),(err)=>{
                    if(err){
                        console.log("Error at writing data to file request.json");
                    }
                });
            });
        }
    });
    sendBlock(block).then((result) => {
        console.log("Success in serving the blocks :" + result);
        res.send('Success');
    }).catch((err) => {
        console.log(err);
    })
});

remoteRoute.post('/block', (req, res) => {
    var block = req.body['block'];
    block = JSON.parse(block);
    console.log(block);
    fs.readFile(path.join(__dirname,'..','data','profile.json'),(err,data)=>{
        data = JSON.parse(data);
        if(block['transactions'][0]['to']['email']==data['email']){
            var bufferedData = Buffer.from(JSON.parse(block['transations'][0]['data']).data);
            fs.readFile(path.join(__dirname,'..','data','userdata.json'),(err,result)=>{
                result = JSON.parse(result);
                var privateKey = rsa(result['private']);
                var decryptedData = privateKey.decrypt(bufferedData);
                decryptedData = decryptedData.toString('utf-8');
                var requestObj = {};
                requestObj['data']=decryptedData;
                requestObj['from']=block['transations'][0]['from']['email'];
                requestObj['ip']=block['transations'][0]['ip'];
                fs.writeFile(path.join(__dirname,'..','data','request.json'),JSON.stringify(requestObj),(err)=>{
                    if(err){
                        console.log(err);
                    }
                });
            });
        }
    });
    blockchain.addBlock(block);
    res.send("Success");
});

remoteRoute.post('/last',(req,res)=>{
    var result = req.body['result'];
    fs.writeFile(path.join(__dirname,'..','data','result.json'),JSON.stringify(result),(err)=>{
        if(err){
            console.log("error in writing the data to file result.json");
        }
    })
});

function getBlockChain() {
    return blockchain;
}

module.exports = {
    remoteRoute,
    getBlockChain
};