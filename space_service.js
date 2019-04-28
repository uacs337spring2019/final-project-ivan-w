// Ivan Webber
// 4/23/2019
// Ivan is the origonal space pirate. Cross him and die!!!

/* stores and distributes spaceships to enable users to see one another duing cyberspace freeflight! */

// This code fights college debt
console.log("starting cyberspace freeflight service");

// make sure everything is in order
const express = require("express");
const cookieParser = require('cookie-parser');
const session = require('client-sessions');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

// basic access rules
const app = express();
app.use(express.static('public'));

// bring cookies into the game
app.use(cookieParser());

// base rules for sessions
app.use(session({
    cookieName: 'session',
    secret: 'adjfaosjvzpxocjvlawejfsdnfz.xcvox',
    duration: 1 * 60 * 1000, // connect 1 minute
    activeDuration: 5 * 1000, // extend 5 seconds
    httpOnly: true,
}));

// prevent cors preflight errors
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", 
               "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

/* Instead of setting up a database I just use a Map for matching cookies to users */
let sprites = new Map();
userNum = 1; // used to give unique ids

/** Add/Update Sprite: the user may send us sprites that we will store to our database. Each user is only allowed one spaceship, but we allow them to send lasers and explosions (accusations of collisions) */
app.post('/', jsonParser, function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
	if ((sprites.size % 100) == 1) {
		console.log("we now have " + sprites.size + " visitor(s)");
	}
	
    if (!req.session.spriteKey) {
	// new user, issue a spriteKey
	req.session.spriteKey = userNum++;
    } else {
	// user has returned
	sprites.delete(req.session.spriteKey);
    }

    // prepare a list of all other sprites
    let send = {};
    send.sprites = [];

    // first add the user's sprite
    let userSpaceship = req.body;
    send.sprites.push(userSpaceship);

    // then the rest
    for (let sprite of sprites.values()) {
        send.sprites.push(sprite);
    }

    // add their updated sprite to our database
    userSpaceship.dueDate = Date.now() + 5000;
    sprites.set(req.session.spriteKey, userSpaceship);
    
    // send comprehensive list of spaceships
    send.userSpaceship = userSpaceship;
    send.spriteKey = req.session.spriteKey;
    res.send(send);
})

// keep the server from getting glugged with old sprites
setInterval(function(){
    // remove old sprites
    for (let [key, value] of sprites.entries()) {
        if (!value.dueDate || value.dueDate < Date.now()) {
           // get rid of expired or illigitimate sprites
           sprites.delete(key);
       }
   }
}, 5000) // once every 5 seconds

// start listening
app.listen(process.env.PORT);
