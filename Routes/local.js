const express = require('express');
const path = require('path');
const fs = require('fs');
const rsa = require('node-rsa');

const sayHi = require('./communicate').sayHi;
const sendTransation = require('./communicate').sendTransation;
const sendData = require('./communicate').sendData;

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
        if (body == "OK") {
            res.redirect('/login');
        } else {
            var node = JSON.parse(body);
            fs.readFile(path.join(__dirname, '..', 'data', 'users.json'), (err, result) => {
                var jsonData = JSON.parse(result);
                if (jsonData.indexOf(node) >= 0) {
                    console.log("Already added the user " + node['email'] + " to users list")
                } else {
                    jsonData.push(node);
                }
                fs.writeFile(path.join(__dirname, '..', 'data', 'users.json'), JSON.stringify(jsonData), (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
                res.redirect('/login');
            });
        }
    }).catch((err) => {
        console.log(err);
        res.redirect('/login');
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
    var recivedData = req.body;
    fs.readFile(path.join(__dirname, '..', 'data', 'userdata.json'), (err, data) => {
        var userData = JSON.parse(data);
        if (userData['email'] == recivedData['email']) {
            if (userData['password'] == recivedData['pass']) {
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
    profile['email'] = data['email'];
    profile['public'] = data['public'];
    fs.writeFile(path.join(__dirname, '..', 'data', 'userdata.json'), JSON.stringify(data),
        (err) => {
            if (err) {
                console.log(err);
            }
        });
    fs.writeFile(path.join(__dirname, '..', 'data', 'profile.json'), JSON.stringify(profile),
        (err) => {
            if (err) {
                console.log(err);
            }
        })
    res.redirect('/login');
});

localRouter.get('/main', (req, res) => {
    if (req.session.loggedin == true) {
        res.sendFile(path.join(__dirname, '..', 'views', 'home.html'));
    } else {
        res.redirect('/login');
    }
});

localRouter.get('/request', (req, res) => {
    if (req.session.loggedin == true) {
        fs.readFile(path.join(__dirname,'..','data','users.json'),(err,data)=>{
            var usersData = JSON.parse(data);
            var users = [];
            for(var i=0;i<(usersData.length);i++){
                users.push(usersData[i]['email']);
            }
            console.log(users);
            res.render('req',{usersList:users});
        });
        // res.sendFile(path.join(__dirname, '..', 'views', 'req.html'));
    } else {
        res.redirect('/login')
    }
});

localRouter.post('/request', (req, res) => {
    fs.readFile(path.join(__dirname, '..', 'data', 'users.json'), (err, data) => {
        var transationData = {};
        data = JSON.parse(data);

        function selectuser(user, index, users) {
            if (req.body['user'] == user['email']) {
                transationData['to'] = user;
            }
        }
        data.forEach(selectuser);
        fs.readFile(path.join(__dirname, '..', 'data', 'userdata.json'), (err, self) => {
            self = JSON.parse(self);
            transationData['from'] = {
                email: self['email'],
                public: self['public']
            };
            var publicKey = new rsa(transationData['to']['public']);
            transationData['data'] = JSON.stringify(publicKey.encrypt(req.body['data']));
            sendTransation(transationData).then((data) => {
                console.log("Send Transation to fixed Host");
                res.send("Sent Transation to Fixed Host");
            }).catch((err) => {
                console.log(err);
                console.log("Can't Send Transation to fixed Host");
                res.send("Can't send the transation to fixed host");
            })
        });

    });
});

localRouter.get('/notification', (req, res) => {
    if (req.session.loggedin == true) {
        fs.readFile(path.join(__dirname,'..','data','request.json'),(err,data)=>{
            requestData = JSON.parse(data);
            res.render('notif',{req:requestData});
        });
        // res.sendFile(path.join(__dirname,'..','views','notif.html'));
    } else {
        res.redirect('/login');
    }
});

localRouter.post('/notification', (req, res) => {
    console.log(req.body.data);
    sendData(req.body.data).then((result)=>{
        console.log("Successfully send data to corresponding user");
        res.redirect('/notification');
    }).catch((err)=>{
        console.log("Error at sending final data"+err);
        res.send("Error at sending the data");
    });
});

localRouter.get('/received', (req, res) => {
    if (req.session.loggedin == true) {
        fs.readFile(path.join(__dirname,'..','data','result.json'),(err,result)=>{
            result = JSON.parse(result);
            result = JSON.parse(result);
            res.render('result',{req:result});
        });
    } else {
        res.redirect('/login');
    }
});


function getHost() {
    return host;
}
module.exports = {
    localRouter,
    getHost
};