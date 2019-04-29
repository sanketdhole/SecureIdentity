const express = require('express');
const path = require('path');
const fs = require('fs');
const rsa = require('node-rsa');

const sayHi = require('./communicate').sayHi;

var localRouter = express.Router();
let host = ''
localRouter.get('/', (req, res) => {
    res.redirect('/signup');
});

localRouter.get('/ip', (req, res, next) => {
    if (req.session.loggedin == true) {
        res.redirect('/main');
    } else {
        res.sendFile(path.join(__dirname, '..', 'views', 'host.html'));
    }
});

localRouter.post('/ip', (req, res, next) => {
    host = req.body['ip'];
    sayHi(host).then((body) => {
        if(body=="OK"){
            res.redirect('/login');
        }
        else
        {var node = JSON.parse(body);
        fs.readFile(path.join(__dirname, '..', 'data', 'users.json'), (err, result) => {
            var jsonData = JSON.parse(result);
            jsonData.push(node);
            fs.writeFile(path.join(__dirname, '..', 'data', 'users.json'), JSON.stringify(jsonData), (err) => {
                if(err){console.log(err);}
            });
            res.redirect('/login');
        });}
    }).catch((err) => {
        console.log(err);
    });
});

localRouter.get('/login', (req, res) => {
    if (host) {
        res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
    } else {
        res.redirect('/ip');
    }
});

localRouter.post('/login', (req, res) => {
    fs.readFile(path.join(__dirname, '..', 'data', 'userdata.json'), (err, data) => {
        var userData = JSON.parse(data);
        if (userData['email'] == req.body['email']) {
            if (userData['password'] == req.body['pass']) {
                req.session.loggedin = true;
                res.redirect('/main')
            } else {
                res.send("Password is incorrect");
            }
        } else {
            res.send("Email not found");
        }

    });
});

localRouter.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'signup.html'));
});

localRouter.post('/signup', (req, res) => {
    var data = req.body;
    var key = new rsa({
        b: 512
    });
    data['private'] = key.exportKey('private');
    data['public'] = key.exportKey('public');
    console.log(data);
    var profile = {}
    profile['email']=data['email'];
    profile['public']=data['public'];
    fs.writeFile(path.join(__dirname, '..', 'data', 'userdata.json'), JSON.stringify(data),
        (err) => {
            if(err){
            console.log(err);}
        });
    fs.writeFile(path.join(__dirname,'..','data','profile.json'),JSON.stringify(profile),
    (err)=>{
        if(err){
            console.log(err);
        }
    })
    res.redirect('/login');
});

localRouter.get('/main', (req, res) => {
    if (req.session.loggedin == true) {
        res.sendFile(path.join(__dirname, '..', 'views', 'cong.html'));
    } else {
        res.redirect('/login');
    }
});

localRouter.get('/requestdata',(req, res)=>{
    if(req.session.loggedin == true){
        // logic for getting data
        var data = {}//this is the dummy data
        data['ip']=req.ip;
    }else{
        res.redirect('/login')
    }
});

function getHost(){
    return host;
}
module.exports = {
    localRouter,
    getHost
};