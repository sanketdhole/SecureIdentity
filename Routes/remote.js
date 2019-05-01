const express = require('express');
const path = require('path');
const fs = require('fs');


const Transation = require('../blochchain/transaction');
const block = require('../blochchain/block');
const BlockChain = require('../blochchain/blockchain');
const getHost = require('./local').getHost;
const sendBlock = require('./communicate').sendBlock;

let fixedNode = false;
let genesisBlock = new block();
let blockchain = new BlockChain(genesisBlock);

var remoteRoute = express.Router();

remoteRoute.get('/hi', (req, res) => {
    if (req.ip == getHost()) {
        fixedNode = true;
        res.send("OK")
    } else {
        var ip = req.ip;
        fs.readFile(path.join(__dirname, '..', 'data', 'iptable.json'), (err, data) => {
            if (err) {
                console.log(err);
            } else {
                var iptable = JSON.parse(data);
                if(iptable.indexOf(ip)>=0){
                    console.log("Already added "+ip+" to IP Table");
                }else{
                iptable.append(ip);
                }
                fs.writeFile(path.join(__dirname, '..', 'data', 'iptable.json'), JSON.stringify(iptable), (err) => {
                    console.log(err)
                });
            }
        });
        fs.readFile(path.join(__dirname,'..','data','profile.json'),(err,data)=>{
            res.send(JSON.parse(data));
        });
    }

});

remoteRoute.post('/request', (req, res) => {
    var data = req.body['data'];
    data = JSON.parse(data);
    var transation = new Transation(data['from'], data['to'], data['data'], req.ip);
    var block = blockchain.getNextBlock([transation]);
    blockchain.addBlock(block);
    fs.readFile(path.join(__dirname,'..','data','profile.json'),(err,data)=>{
        if(block['transactions'][0]['to']['email']==data['email']){
            //do some thing to resond to request
            console.log(block['transactions'][0]['data']);
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
            console.log(block['transactions'][0]['data']);
        }
    });
    blockchain.addBlock(block);
});

function getBlockChain() {
    return blockchain;
}

module.exports = {
    remoteRoute,
    getBlockChain
};