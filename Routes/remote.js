const express = require('express');
const path = require('path');
const fs = require('fs');

const profile = require("../data/profile");

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
                iptable.append(ip);
                fs.writeFile(path.join(__dirname, '..', 'data', 'iptable.json'), JSON.stringify(iptable), (err) => {
                    console.log(err)
                });
            }
        });
        res.send(JSON.stringify(profile));
    }

});

remoteRoute.post('/request', (req, res) => {
    var data = JSON.parse(req.body);
    var transation = new Transation(data['from'], data['fromEmail'], data['to'], data['toEmail'], data['requestData'], req.ip);
    var block = blockchain.getNextBlock(transation);
    blockchain.addBlock(block);
    sendBlock(block).then((result) => {
        console.log("Success in serving the blocks :" + result);
        res.send('Success');
    }).catch((err) => {
        console.log(err);
    })
});

remoteRoute.post('/block', (req, res) => {
    var block = JSON.parse(req.body);
    console.log(block);
    blockchain.addBlock(block);
});

function getBlockChain() {
    return blockchain;
}

module.exports = {
    remoteRoute,
    getBlockChain
};