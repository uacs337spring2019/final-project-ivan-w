// Ivan Webber
// 4/23/2019
// Ivan is the origonal space pirate. Cross him and die!!!

// This code fights college debt
console.log("let's start an epic space-war yo!");

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
    // secure: true,
    // ephemeral: true
}));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", 
               "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

// helper code for running space
let sprites = new Map();
userNum = 0;

function printSprites() {
    console.log("we have " + sprites.length + " sprites");
    console.log(sprites);
}

function cleanSprites() {
    for (let [key, value] of sprites) {
        if (value.dueDate < Date.now()) {
            sprites.delete(key);
        }
    }
}

function updatePlayer(spaceship) {

}

// handle requests
// app.get('/', function(req, res) {
//     console.log("today we have " + sprites.size + " visitors");
//     //res.header("Access-Control-Allow-Origin", "*");
    
//     if(req.cookies.spriteKey) {
// 		res.send("You made the jump to GET " + req.cookies.spriteKey);
// 	} else {
// 		res.cookie('spriteKey', userNum++, {maxAge: 60*60, httpOnly: false});
// 		console.log("cookie set at GET ");
//     }

//     let send = {};
//     send.sprites = [];
//     for (let sprite of sprites.values()) {
//         send.sprites.push(sprite);
//     }

//     res.send(JSON.stringify(send));
//     console.log(JSON.stringify(send));

//     if (req.session) {
//         console.log("GET: I knew that guy...");
//     } else {
//         console.log("Who are you?");
//     }
// })

/** Add/Update Sprite: the user may send us sprites that we will store to our database. Each user is only allowed one spaceship, but we allow them to send lasers and explosions (accusations of collisions) */
app.post('/', jsonParser, function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    console.log("today we have " + sprites.size + " visitors");
    console.log("someone is sending us a spaceship!!!");

    // if (req.body.spriteKey) {
    //     // don't give someone their own spaceship
    //     console.log("A return customer!");
    //     console.log("it must be: " + req.session.spriteKey);
    //     sprites.remove(req.body.spriteKey);
    // } else {
    //     // send this new person a greeting card
        
    // }
    
    
    // if(req.cookies.spriteKey) {
	// 	res.send("THE COOKIE MADE IT " + req.cookies.spriteKey);
	// } else {
	// 	res.cookie('spriteKey', userNum++, {maxAge: 60*60, httpOnly: false});
	// 	console.log("cookie set at POST ");
	// }

    if (!req.session.spriteKey) {
        console.log("A new vessel has arrived!!!");
        req.session.spriteKey = userNum++;
        console.log("We'll store it under the name: " + req.session.spriteKey);
    } else {
        console.log("it's a MIRACLE ");
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

    // add their sprite to our database
    userSpaceship.dueDate = Date.now() + 5000;
    sprites.set(req.session.spriteKey, userSpaceship);
    
    // send comprehensive list of spaceships
    send.userSpaceship = userSpaceship;
    send.spriteKey = req.session.spriteKey;
    res.send(send);

    if (req.body.type == "spaceship" ) {
        // // store this to our database, replacing if already sent
        // console.log(req.body);
        // sprite.dueDate = Date.now() + 5000;
        // sprites.set(req.session.spriteKey, sprite);

        // console.log("We've updated the vessel under captain: " + req.session.spriteKey);
    } else if (req.body.type == "laser") {
        // we currently don't support lasers
    } else if (req.body.type == "explosion") {
        // we currently don't take explosions
    }
})

setInterval(function(){
    console.log("I love cleaning!!!");
        // remove old sprites
        for (let [key, value] of sprites.entries()) {
            if (!value.dueDate) {
                console.log("Gotta get rid of this one...");
                sprites.delete(key);
            } else if(value.dueDate > Date.now()) {
                console.log("You should've gone by now...");
                sprites.delete(key);
            }
        }
}, 5000)

// start listening
app.listen(3000);
