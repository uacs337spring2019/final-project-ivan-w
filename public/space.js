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
    // monitors the user's controls over the animation cycle
    let steer = [false, false, false, false];

    /** Initialize Web Page */
    window.onload = function () {
        console.log("initializing page");

        let stars = initStarscape();
        
        // most of what we will do happens when the user continues to freeflight
        document.getElementById("takeoff").onclick = function(event) {
            console.log("taking off!!!");
                        
            // remove welcome window
            let welcome = document.getElementById("welcome");
            welcome.style.visibility = "hidden";
            welcome.innerHTML = ""; // prevents addition of scrollbar
            
            // finish startup code
            initBattleground();
            let sprites = initSprites();
    
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
                    drawBattleground(sprites);
                    steerUserSpaceship(sprites[0]);
                    extrapolate(sprites);
                }
                , 30);
    
            // sync user's spaceship & other sprites with the server
            let sync = setInterval(
                function () {
                    getSyncedSprites(sprites);
                }
                , 300);
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

            x: Number(0),
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

        // until we get other sprites this will be all we have
        let sprites = [];
        sprites.push(userSpaceship);
        getSyncedSprites(sprites);
        
        return sprites;
    }

    /** draws all stars and concurrently updates their positions. Adds new stars as needed. */
    function drawAndUpdateStars(stars, spaceship) {
        let space = document.getElementById("starscape");
        let context = space.getContext("2d");

        // clear canvas
        context.fillStyle = "darkblue"; // TODO make lower opacity to show motion blur
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

    /** updates the status text in the topleft. This is useful for testing if the user is connected to the server */
    function updateStatus(spaceship, numOthers) {
        let status = document.getElementById("status");
        status.innerText = numOthers + " active users\nx: " + spaceship.x + " y: " + spaceship.y;
    }

    /** draws all sprites relative to the user's spaceship */
    function drawBattleground(sprites) {
        let userSpaceship = sprites[0];
        
        let battleground = document.getElementById("battleground");
        let context = battleground.getContext("2d");
        
        // determine the offsets needed
        let deltaX = (battleground.width / 2) - userSpaceship.x;
        let deltaY = (battleground.height / 2) - userSpaceship.y;

        // clear battleground
        context.clearRect(0, 0, battleground.width, battleground.height);

        for (let sprite of sprites) { // draw each sprite
            context.save(); // return to normal orientation afterwards

            // orient to the sprite
            context.translate(sprite.x + deltaX, sprite.y + deltaY);
            context.rotate(sprite.rotation);

            // we use the same base images with alternative hue
            context.filter = "hue-rotate(" + sprite.hue + "deg)";
            
            let spaceship = document.getElementById("spaceship");

            if (sprite.engine) { // afterburn underneath if engine is on
                let afterburn = document.getElementById("afterburn");
                context.drawImage(afterburn, -(spaceship.width * 6 / 8), -afterburn.height / 2);
             }

             if (sprite.laserGun) { // laserburn if laser is fired
                 let laserburn = document.getElementById("laserburn");
                 context.drawImage(laserburn, (spaceship.width / 3) + (laserburn.width), -laserburn.height / 2);
             }

              // and always the spaceship itself
              context.drawImage(spaceship, -spaceship.width / 2, -spaceship.height / 2);
            
            context.restore(); // go back to normal
        } // end draw each sprite
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

    /** releases a key from pressed state */
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

    /** adjusts spaceship's vectors based on the users steering during an animation cycle  */
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
        if (steer[2]) {
            // turn left
            spaceship.rotationVelocity = Math.max(-Math.PI / 32, spaceship.rotationVelocity - (Math.PI / 1024));
            spaceship.rotationVelocity = Math.min(Math.PI / 32, spaceship.rotationVelocity);
        }
        if (steer[3]) {
            // turn right
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

            sprite.x = sprite.x % 10000;
            sprite.y = sprite.y % 10000;
        }
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
                // sync (keeping the user spaceship because we have the authority on our location)
                sprites.length = 1;
                for (let i = 1; i < response.sprites.length; ++i) {
                    sprites.push(response.sprites[i]);
                }

                // update our coordinates and the number of users
                updateStatus(userSpaceship, response.sprites.length);
                
                return sprites; // we already updated them, but send them anyways
            })
    }

    function checkStatus(response) {
        if (response.status < 300) {
            //console.log(response); // for error cases
            return response.json();
        } else {
            console.log("error: " + response);
        }
    }

})(); // all done
