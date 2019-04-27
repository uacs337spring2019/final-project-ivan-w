/** 
 * Ivan Webber
 * CSc 337 - Spring 2019
 * Final Project
 * cyberspace.io
 * 
 * This project interacts with a server to get other sprites and animates them. It also sends the user's sprite to the server and creates a star background animation.
 * 
 */

(function () {
    "use strict";
    let steer = [false, false, false, false]; // tracks user interaction

    // the values of the sprite representing our spaceship. If I do all of this right it will soon just be the first thing in the sprites list
    // connect -> get sprite

    // loop:
    // draw
    // update

    // loop:
    // send user's spaceship, mention laser fire (not the user's job to actually fire)
    // get updated list of sprites

    // else: loop: { get, start:drawExtrapolate } after:get { restart:drawExtrapolate & send }
    // notice we won't need global variables

    // todo: make sure I report the number of people playing on init
    // TODO: make steering part of spaceship, or draw the user's spaceship special

    /** Initialize Web Page */
    window.onload = function () {
        console.log("initializing page");
        // initialize elements ******************
        let stars = initStarscape();
        document.getElementById("takeoff").onclick = function(event) {
            // remove welcome window
            document.getElementById("welcome").style.visibility = "hidden";

            // finish startup code
            initBattleground();
            let sprites = initSprites(); // TODO 
    
            // set handlers *************************
            document.onresize = initStarscape;
            document.onkeydown = function (e) {
                listenControls(e, sprites[0]);
            }
            document.onkeyup = function (e) {
                stopKeys(e, sprites[0]);
            }
    
            // setup animation **********************
            let animation = setInterval(
                function () {
                    drawAndUpdateStars(stars, sprites[0]);
                    //transformRelativeToUser(sprites);
                    drawBattleground(sprites);
                    steerUserSpaceship(sprites[0]);
                    extrapolate(sprites);
                }
                , 30); // TODO: think about this number
    
            // update sprites (from server then transformed) over and over
            let sync = setInterval(
                function () {
                    getSyncedSprites(sprites);
                }
                , 150);
        }
    }

    /** initializes starscape */
    function initStarscape() {
        console.log("initializing stars");
        // init canvas to correct size to avoid stretching
        let space = document.getElementById("starscape");
        space.width = window.innerWidth;
        space.height = window.innerHeight;

        // make a collection of stars
        let numStars = (space.width * space.height) / 512;
        let stars = [];
        while (stars.length < numStars) {
            let star = {};
            star.x = (Math.random() * space.width);
            star.y = (Math.random() * space.height);
            star.z = (Math.random() * 1.5) + 0.5;
            stars.push(star);
        }
        return stars;
    }

    /** initializes battleground */
    function initBattleground() {
        let battleground = document.getElementById("battleground");
        battleground.width = window.innerWidth * 3;
        battleground.height = window.innerHeight * 3;
    }

    /** initializes user's spaceship and connection to the server TODO */
    function initSprites() {
        console.log("initializing sprites");

        // make user spaceship
        let userSpaceship = {
            type: "spaceship",

            x: Number(0), // TODO random? get from server
            y: Number(0),
            rotation: Number(0),

            velocityX: Number(0),
            velocityY: Number(0),
            rotationVelocity: Number(0),

            health: Number(25),
            hue: Number(Math.random() * 360),

            engine: Boolean(false),
            laserGun: Boolean(false)
        }

        // send the user's spaceship to the server
        const fetchOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userSpaceship)
        }
        fetch("https://cyberspace-freeflight.herokuapp.com/", fetchOptions)
            .then(function (response) {
                console.log(response.text());
            })

        let sprites = [];
        sprites.push(userSpaceship);
        return sprites;
    }

    /** draws all stars and concurrently updates their positions. Adds new stars as needed. */
    function drawAndUpdateStars(stars, spaceship) {
        // console.log("drawing and updating stars");
        let space = document.getElementById("starscape");
        let context = space.getContext("2d");

        // space is dark...
        context.fillStyle = "darkblue";
        context.fillRect(0, 0, space.width, space.height);

        // but we have stars
        // draw and update the stars
        context.fillStyle = "rgba(255, 255, 255, 0.9)";
        for (let i = 0; i < stars.length; ++i) {
            let star = stars[i];

            // remove stars leaving the area
            if (star.x < 0 || star.x > space.width || star.y < 0 || star.y > space.height) {
                // we will replace it with a new star
                if (Math.abs(Math.random() * spaceship.velocityX) < Math.abs(Math.random() * spaceship.velocityY)) {
                    // new star in vertical plane
                    star.x = (Math.random() * space.width);
                    star.z = (Math.random() * 1.5) + 0.5;
                    if (spaceship.velocityY < 0) {
                        // add star at top
                        star.y = 0;
                    } else {
                        // add star at bottom
                        star.y = space.height;
                    }
                } else {
                    // new star in horizontal direction
                    star.y = (Math.random() * space.height);
                    star.z = (Math.random() * 1.5) + 0.5;
                    if (spaceship.velocityX < 0) {
                        // add star at left
                        star.x = 0;
                    } else {
                        // add star at right
                        star.x = space.width;
                    }

                }
            }

            // update stars to show movement
            star.x -= spaceship.velocityX * star.z / 100; // moves faster if close
            star.y -= spaceship.velocityY * star.z / 100;

            // draw star
            context.fillRect(star.x - star.z, star.y - star.z, star.z * 2, star.z * 2);
        }
    }

    /** just updates that text */
    function updateStatus(spaceship, numOthers) {
        let status = document.getElementById("status");
        status.innerText = numOthers + " other users\nx: " + spaceship.x + " y: " + spaceship.y;
    }

    /** draws all sprites (tis the goal) */
    function drawBattleground(sprites) {
        let spaceship = sprites[0];

        let battleground = document.getElementById("battleground");
        let context = battleground.getContext("2d");
        let deltaX = (battleground.width / 2) - spaceship.x;
        let deltaY = (battleground.height / 2) - spaceship.y;

        // console.log("drawing spaceship! rotation: " + rotation);
        //let battleground = document.getElementById("battleground");

        // clear
        context.clearRect(0, 0, battleground.width, battleground.height);

        for (let sprite of sprites) { // draw each sprite
            context.save(); // return to normal orientation afterwards

            // orient to the sprite
            context.translate(sprite.x + deltaX, sprite.y + deltaY);
            context.rotate(sprite.rotation);

            switch (sprite.type) {
                case "laser":
                    console.log("a mother laser!!");
                    context.strokeStyle = "red";
                    context.lineWidth = 10;

                    context.moveTo(sprite.x + deltaX, sprite.y + deltaY);
                    context.lineTo(battleground.width, battleground.height);
                    //context.lineTo(sprite.x + 5 * sprite.velocityX, sprite.y + 5 * sprite.velocityY);
                    context.stroke();

                    // remove lasers out of bounds TODO this should be server mediated
                    break;
                case "spaceship":
                    // we use the same base image with alternative saturation
                    let spaceship = document.getElementById("spaceship");
                    context.filter = "hue-rotate(" + sprite.hue + "deg)";
                    if (sprite.engine) { // afterburn underneath if engine is on
                        let afterburn = document.getElementById("afterburn");
                        context.drawImage(afterburn, -(spaceship.width * 6 / 8), -afterburn.height / 2);
                    }

                    if (sprite.laserGun) { // laserburn if laser is fired
                        let laserburn = document.getElementById("laserburn");
                        context.drawImage(laserburn, (spaceship.width / 3) + (laserburn.width), -laserburn.height / 2);
                    }

                    // TODO: add side booster afterburns?

                    // and then the actual image
                    context.drawImage(spaceship, -spaceship.width / 2, -spaceship.height / 2);
                    context.filter = "none";
                    break;
            }
            context.restore(); // go back to normal
        } // end draw each sprite
    }

    function drawRotated(degrees) {
        context.clearRect(0, 0, canvas.width, canvas.height);

        // save the unrotated context of the canvas so we can restore it later
        // the alternative is to untranslate & unrotate after drawing
        context.save();

        // move to the center of the canvas
        context.translate(canvas.width / 2, canvas.height / 2);

        // rotate the canvas to the specified degrees
        context.rotate(degrees * Math.PI / 180);

        // draw the image
        // since the context is rotated, the image will be rotated also
        context.drawImage(image, -image.width / 2, -image.width / 2);

        // we’re done with the rotating so restore the unrotated context
        context.restore();
    }

    function fire() {
        console.log("fire!!");
        let spaceship = sprites[0];

        // make a new sprite, I think I'll end up sending it to the server TODO?
        let laser = {
            type: "laser",
            x: Number(0),
            y: Number(0),
            rotation: Number(spaceship.rotation),
            velocityX: Number(spaceship.velocityX),
            velocityY: Number(spaceship.velocityY),
            rotationVelocity: Number(0)
            //dueDate: Date.now() + 5000 // they had 1 second...
        }

        sprites.push(laser);
    }

    /** listends to keys for movement and user interaction */
    function listenControls(e, spaceship) {

        e = e || window.event;
        // console.log(e.keyCode);
        if (e.keyCode == '38' || e.keyCode == '87') {
            // up arrow
            steer[0] = true;
            spaceship.engine = true;
        }
        else if (e.keyCode == '40' || e.keyCode == '83' || e.keyCode == '32') {
            // down arrow
            steer[1] = true;
            spaceship.laserGun = true;
        }
        else if (e.keyCode == '37' || e.keyCode == '65') {
            // left arrow
            steer[2] = true;
        }
        else if (e.keyCode == '39' || e.keyCode == '68') {
            // right arrow
            steer[3] = true;
        }
    }

    /** releases a key from it's pressed state */
    function stopKeys(e, spaceship) {
        e = e || window.event;
        // console.log(e.keyCode);
        if (e.keyCode == '38' || e.keyCode == '87') {
            // up arrow
            steer[0] = false;
            spaceship.engine = false;
        }
        else if (e.keyCode == '40' || e.keyCode == '83' || e.keyCode == '32') {
            // down arrow
            steer[1] = false;
            spaceship.laserGun = false;
        }
        else if (e.keyCode == '37' || e.keyCode == '65') {
            // left arrow
            steer[2] = false;
        }
        else if (e.keyCode == '39' || e.keyCode == '68') {
            // right arrow
            steer[3] = false;
        }
    }

    /** check what the user is trying to do with the spaceship */
    function steerUserSpaceship(spaceship) {

        if (steer[0]) {
            // forward thrust, bounded
            if (spaceship.velocityX > 0) {
                spaceship.velocityX = Math.min(128, spaceship.velocityX + Math.cos(spaceship.rotation));
            } else {
                spaceship.velocityX = Math.max(-128, spaceship.velocityX + Math.cos(spaceship.rotation));
            }

            if (spaceship.velocityY > 0) {
                spaceship.velocityY = Math.min(128, spaceship.velocityY + Math.sin(spaceship.rotation));
            } else {
                spaceship.velocityY = Math.max(-128, spaceship.velocityY + Math.sin(spaceship.rotation));
            }
        }
        if (steer[1]) {
            // maybe shoot? No brakes yo...
            // Hell yeah! It's time for LASERS
            // if (laserCharged) { // laser ready?
            //     laserCharged = false;
            //     fire();
            //     setTimeout(function () {
            //         laserCharged = true;
            //     }, 800);
            // }
        }
        if (steer[2]) {
            // turn left
            // console.log("left veer");
            spaceship.rotationVelocity = Math.max(-Math.PI / 32, spaceship.rotationVelocity - (Math.PI / 1024));
            spaceship.rotationVelocity = Math.min(Math.PI / 32, spaceship.rotationVelocity);
        }
        if (steer[3]) {
            // turn right
            // console.log("go right!");
            spaceship.rotationVelocity = Math.max(-Math.PI / 32, spaceship.rotationVelocity + (Math.PI / 1024));
            spaceship.rotationVelocity = Math.min(Math.PI / 32, spaceship.rotationVelocity);
        }
    }

    /** adjust the positions of all sprites to show time elapsed.
     *  Precondition: positions are relative to canvas.
     */
    function extrapolate(sprites) {
        // the session might take care of moving the spaceships, but we should fill the holes
        for (let sprite of sprites) {
            // update rotation
            sprite.rotation = (sprite.rotation + sprite.rotationVelocity) % (2 * Math.PI);

            // update positions
            sprite.x += sprite.velocityX;
            sprite.y += sprite.velocityY;

            sprite.x = sprite.x % 2000;
            sprite.y = sprite.y % 2000;
        }
    }

    /** Transforms all vectors such that the origin is the user's spaceship. Returns transformed sprites */
    function transformRelativeToUser(sprites) {
        // Adjusts all sprites's vectors to be relative to our canvas/user
        let spaceship = sprites[0];

        let battleground = document.getElementById("battleground");
        let deltaX = (battleground.width / 2) - spaceship.x;
        let deltaY = (battleground.height / 2) - spaceship.y;

        for (let sprite of sprites) {
            sprite.x += deltaX;
            sprite.y += deltaY;
        }

        return sprites;
    }

    /** replaces all sprites with updated sprites requested from the server */
    function getSyncedSprites(sprites) {
        let userSpaceship = sprites[0];

        const fetchOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(userSpaceship)
        }
        fetch("https://cyberspace-freeflight.herokuapp.com/", fetchOptions)
            .then(checkStatus)
            .then(function (response) {
                console.log(response.sprites);
                // reset list
                sprites.length = 0;
                //sprites.push(response.userSpaceship);
                //sprites = response.sprites;
                for (let i = 0; i < response.sprites.length; ++i) {
                    sprites.push(response.sprites[i]);
                }

                updateStatus(userSpaceship, response.sprites.length); // abs position
                return sprites;
            })
    }

    function checkStatus(response) {
        if (response.status < 300) {
            console.log(response);
            return response.json();
        } else {
            console.log("error: " + response);
        }
    }

})(); // all done
