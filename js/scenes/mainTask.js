// Scene to hold the task. Routes to Task End Scene

// import js game element modules (sprites, ui, outcome animations, etc.)
import Player from "../elements/player.js";
import Coins from "../elements/coins.js";
import ChoicePanel from "../elements/choicePanel.js";       
import TimerPanel from "../elements/timerPanelClicks.js";
import BreakPanel from "../elements/takeABreak.js";

// import our custom events center for passsing info between scenes
import eventsCenter from '../eventsCenter.js'

// import some js from Pavlovia lib to enable data saving [for Pavlovia deployment]
import * as data from "../../lib/data-2020.2.js";
import { saveTrialData } from '../util.js';

// initialize some global game vars
var gameHeight;
var gameWidth;
var mapWidth;
var platforms;
var bridge;
const decisionPointX = 370;    // where the choice panel will be triggered (x coord in px)
const midbridgeX = 735;        // where trial reward coins will be displayed (x coord in px)
const endbridgeX = 960;        // where the player must jump up to cross bridge (x coord in px)
const playerVelocity = 1000;   // baseline player velocity (rightward)
// initialize task vars
var nTrials;
var trial=0;
var trialReward1;
var trialEffort1;
var trialReward2;
var trialEffort2;
var nCoins=0;
var coinsText;
var feedback;
var feedbackTime = 1000;
const blockLength = 3;         // 10 trials per block
// initialize timing and response vars
var trialStartTime;
var choicePopupTime;
var choice;
var choiceCompleteTime;
var choiceRT;
var pressCount;
var pressTimes;
var trialSuccess;
var trialEndTime;
const effortTime = 5000;       // time participant will have to try and exert effort (ms)
const practiceOrReal = 1;

// this function extends Phaser.Scene and includes the core logic for the game
export default class MainTask extends Phaser.Scene {
    constructor() {
        super({
            key: 'MainTask'
        });
    }

    preload() {
        ////////////////////PRELOAD GAME ASSETS///////////////////////////////////
        // load tilemap and tileset created using Tiled (see below)
        this.load.tilemapTiledJSON('map', './assets/tilemaps/tilemap1.json'); 
        this.load.image('tiles', './assets/tilesets/tiles_spritesheet_70px.png');

        // load player sprite
        this.load.spritesheet('player', './assets/spritesheets/player1.png', { 
            frameWidth: 90, 
            frameHeight: 96
        });
        
        // load cloud and bush sprites to add some texture to background
        this.load.image('cloud1', './assets/imgs/cloud1.png');
        this.load.image('bush', './assets/imgs/bush.png');
        this.load.image('button', './assets/imgs/button.png');

        // load animated coin sprite (these will represent offered reward level)
        this.load.spritesheet('coin', './assets/spritesheets/coin.png', { 
            frameWidth: 15.8, 
            frameHeight: 16 
        });
        
        // load trial type info from json array
        this.load.json('trialTypes', './assets/trialTypesTest.json');  // for testing
        //this.load.json('trialTypes', './assets/trialTypes.json');    // for deployment
    }
    
    create() {
        ////////////////////////CREATE WORLD//////////////////////////////////////
        // game world created in Tiled (https://www.mapeditor.org/)
        // import tilemap
        var map = this.make.tilemap({ key: "map" });
        var tileset = map.addTilesetImage("tiles_spritesheet", "tiles"); // first arg must be name used for the tileset in Tiled

        // grab some size variables that will be helpful later
        gameHeight = this.sys.game.config.height;
        gameWidth = this.sys.game.config.width;
        mapWidth = map.widthInPixels;

        // import scene layers (using names set up in Tiled)
        platforms = map.createStaticLayer("platforms", tileset, 0, 0);
        bridge = map.createStaticLayer("bridge", tileset, 0, 0);
        const decs = map.createStaticLayer("decs", tileset, 0, 0);
        
        // set up collision property for tiles that can be walked on (set in Tiled)
        platforms.setCollisionByProperty({ collide: true });
        bridge.setCollisionByProperty({ collide: true });

        // add cloud and bush sprites for texture (randomly positioned on each trial)
        this.clouds = this.physics.add.staticGroup();
        for (var i = 0; i < 4; i++) {
            var x = Phaser.Math.RND.between(0, mapWidth);
            var y = Phaser.Math.RND.between(0, gameHeight/3);  // only in top third
            this.clouds.create(x, y, 'cloud1');
        }
        this.bushes = this.physics.add.staticGroup();
        for (var i = 0; i < 5; i++) {
            var x = Phaser.Math.RND.between(0, mapWidth);
            var y = gameHeight/2 + 40;        // only at ground height
            if ( x <  280 || x > 990) {       // only place on grass tiles
                this.bushes.create(x, y, 'bush').setScale(0.5).refreshBody();
            }
        }
        
        // set the boundaries of the world
        this.physics.world.bounds.width = mapWidth;
        this.physics.world.bounds.height = gameHeight;

        //////////////ADD PLAYER SPRITE////////////////////
        this.player = new Player(this, 0, 200); // (this, spawnPoint.x, spawnPoint.y);
        this.physics.add.collider(this.player.sprite, platforms); 
        this.physics.add.collider(this.player.sprite, bridge);       // player walks on platforms and bridge

        //////////////CONTROL CAMERA///////////////////////
        this.cameras.main.startFollow(this.player.sprite);           // camera follows player
        this.cameras.main.setBounds(0, 0, mapWidth, gameHeight);
        
        ///////////INSTRUCTIONS & SCORE TEXT///////////////
//        // add instructions text in a fixed position on the screen
//        this.add
//            .text(16, 16, "choose the high route to earn bonus coins!", {
//                font: "18px monospace",
//                fill: "#ffffff",
//                padding: { x: 20, y: 10 },
//                backgroundColor: "#1ea7e1"
//            })
//            .setScrollFactor(0);
        // add coin count text in a fixed position on the screen
        coinsText = this.add
            .text(gameWidth-160, 16, "coins: "+nCoins, {
                font: "18px monospace",
                fill: "#FFD700",
                padding: { x: 20, y: 10 },
                backgroundColor: "#000000"
            })
            .setScrollFactor(0);
        
        /////////////UI: CHOICES AND RATINGS///////////////
        // UI functionality built using Rex UI plugins for phaser3 
        // (see https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ui-overview/). 
        // These plugins are globally loaded from the min.js src in index.html
        
        //////////////////////////GET TRIAL INFO//////////////////////////////////  
        // load trial info (must be done within create())
        let trialTypes = this.cache.json.get('trialTypes');
        nTrials = trialTypes.reward1.length;
        
        // set the two trial options info from trial number
        trialReward1 = trialTypes.reward1[trial];
        trialEffort1 = trialTypes.effort1[trial];
        trialReward2 = trialTypes.reward2[trial];
        trialEffort2 = trialTypes.effort2[trial];
        
        // log trial start time
        trialStartTime = Math.round(this.time.now);
        
        //////////////////////////TRIAL CONTROL POINTS///////////////////////////
        // 0. First, let's add some invisible to sprites regions of space that key trial 
        // events depend on, so that our player can collide (interact) with them
        // 0.1 point where the choice panel is triggered:
        this.decisionPoint = this.physics.add.sprite(decisionPointX, gameHeight/2);   
        this.decisionPoint.displayHeight = gameHeight;  
        this.decisionPoint.immovable = true;
        this.decisionPoint.body.moves = false;
        this.decisionPoint.allowGravity = false;
        // 0.2 end of bridge where our little man requires a gravity boost (reject & unsuccessful trials):
        this.bridgeEndPoint = this.physics.add.sprite(endbridgeX, gameHeight/2);
        this.bridgeEndPoint.displayHeight = gameHeight;  
        this.bridgeEndPoint.immovable = true;
        this.bridgeEndPoint.body.moves = false;
        this.bridgeEndPoint.allowGravity = false; 
        // 0.3 point where a new trial is triggered:
        this.trialEndPoint = this.physics.add.sprite(mapWidth-20, gameHeight/2);
        this.trialEndPoint.displayHeight = gameHeight;  
        this.trialEndPoint.immovable = true;
        this.trialEndPoint.body.moves = false;
        this.trialEndPoint.allowGravity = false;   
        
        // 1. Upon entering scene, player moves right until they encounter the decisionPoint
        this.player.sprite.setVelocityX(playerVelocity*2.5);  // positive X velocity -> move R
        this.player.sprite.anims.play('run', true);
        this.physics.add.collider(this.player.sprite, this.decisionPoint, 
                          function(){eventsCenter.emit('choicePanelOn');}, null, this); // once the player has collided with invisible decision point, emit event
        // once this event is detected, perform the function displayChoicePanel (only once)
        eventsCenter.once('choicePanelOn', displayChoicePanel, this);  
        
        // 2. After trial outcome (reject, accept+successful, accept+unsuccessful), 
        // player moves right again until they encounter the trial end point
        this.physics.add.collider(this.player.sprite, this.trialEndPoint, 
                          function(){eventsCenter.emit('trialEndHit');}, null, this); // once the player has collided with invisible trial end point, emit event
        // once this event us detected, perform the function trialEnd (only once)
        eventsCenter.once('trialEndHit', trialEnd, this);
        
        // 3. if desired, add listener functions to pause game when focus taken away
        // from game browser tab/window [necessary for mobile devices]
        window.addEventListener('blur', () => { 
            //console.log('pausing game content...');      // useful for debugging pause/resume
            this.scene.pause();
        }, false);
        // and resume when focus returns
        window.addEventListener('focus', () => { 
            setTimeout( () => { 
                //console.log('resuming game content...'); 
                this.scene.resume();
            }, 250); 
        }, false);
    }
    
    update(time, delta) {
        ///////////SPRITES THAT REQUIRE TIME-STEP UPDATING FOR ANIMATION//////////
        // allow player to move
        this.player.update(); 
        
        ////////////MOVE ON TO NEXT SCENE WHEN ALL TRIALS HAVE RUN////////////////
        if (trial == nTrials) {
            this.nextScene();
        }
    }
    
    nextScene() {
        //this.registry.set('coinsTotal', nCoins);   // log total coins (to pass between scenes)
        this.scene.start('TaskEndScene');
    }
}

///////////////////////////////FUNCTIONS FOR CONTROLLING TRIAL SEQUENCE/////////////////////////////////////
// 1. Once player has hit the decision point, pop up the choice panel with info for that trial
var displayChoicePanel = function () {
    // record time
    choicePopupTime = this.time.now; 
    // update some stuff (stop player moving and remove decisionPoint sprite)
    this.player.sprite.setVelocityX(0);
    this.player.sprite.anims.play('wait', true); 
    this.decisionPoint.destroy();
    
    // display reward coins for each option
    this.coins1 = new Coins(this, midbridgeX-(trialReward1*30)/2, 115, trialReward1); // coins in sky
    this.coins2 = new Coins(this, midbridgeX-(trialReward2*30)/2, 285, trialReward2); // coins on bridge
    
    // popup choice panel with relevant trial info
    this.choicePanel = new ChoicePanel(this, decisionPointX+40, gameHeight/2-100, 
                                       trialReward1, trialEffort1, trialReward2, trialEffort2); 
    
    // once choice is entered, get choice info and route to relevant next step
    eventsCenter.once('choiceComplete', doChoice, this);       
};

// 2. Once choice (to accept or reject proposed option) has been made, route to relevant components 
var doChoice = function () {
    // calculate decision RT
    choiceCompleteTime = this.time.now; 
    choiceRT = Math.round(choiceCompleteTime - choicePopupTime); 
    // and get info on chosen option
    choice = this.registry.get('choice');  
    
    // if participant chooses the high effort option
    if (choice == 'high route') {      
        // timer panel pops up  
        this.timerPanel = new TimerPanel(this, decisionPointX+20, gameHeight/2-160, effortTime, trialEffort1) 
        // and play player 'power-up' animation
        this.player.sprite.anims.play('powerup', true);
        // until time limit reached:
        eventsCenter.once('timesup', effortOutcome, this)
        }
    else {  // if participant chooses the low effort option
        // timer panel pops up  
        this.timerPanel = new TimerPanel(this, decisionPointX+20, gameHeight/2-160, effortTime, trialEffort2) 
        // and play player 'power-up' animation
        this.player.sprite.anims.play('powerup', true);
        // until time limit reached:
        eventsCenter.once('timesup', effortOutcome, this)
    }
};

// 3. If participant accepts effort proposal, record button presses and see if they meet threshold
var effortOutcome = function() {
    // get number of achieved button presses 
    pressCount = this.registry.get('pressCount');
    pressTimes = this.registry.get('pressTimes');  // [?we want this - might make code run slow...]
    
    // if ppt chooses high effort and clears trial effort threshold, fly across sky and collect coins!
    if (choice == 'high route' && pressCount >= trialEffort1) {
        trialSuccess = 1;
        // add overlap colliders so coins  on either route disappear when overlap with player body
        this.physics.add.overlap(this.player.sprite, this.coins1.sprite, collectCoins, null, this); 
        this.physics.add.overlap(this.player.sprite, this.coins2.sprite, collectCoins, null, this); 
        // display success message for a couple of seconds,
        feedback = this.add.text(decisionPointX+20, gameHeight/2-160,  
                                 "Woohoo! You did it!", {
                                    font: "20px monospace",
                                    fill: "#ffffff",
                                    align: 'center',
                                    padding: { x: 20, y: 10 },
                                    backgroundColor: "#1ea7e1"
                                 })
            .setOrigin(0.5, 1);
        this.tweens.add({        
            targets: feedback,
            scaleX: { start: 0, to: 1 },
            scaleY: { start: 0, to: 1 },
            ease: 'Back',    
            duration: feedbackTime,
            repeat: 0,      
            yoyo: true
        });
        // then player floats across 'high route' and collects coins
        this.time.addEvent({delay: feedbackTime+250, 
                            callback: function(){
                                feedback.destroy();
                                this.player.sprite.anims.play('float', true);    
                                this.player.sprite.setVelocityX(playerVelocity/3);
                                this.time.addEvent({ delay: 150, 
                                                     callback: function(){this.player.sprite.setVelocityY(-230);},
                                                     callbackScope: this, 
                                                     repeat: 5 });
                            },
                            callbackScope: this});
    }
    // if ppt chooses low effect and clears trial effort threshold, fly across mid-sky and collect coins!
    else if (choice == 'low route' && pressCount >= trialEffort2)  {
        trialSuccess = 1;
        // add overlap colliders so coins  on either route disappear when overlap with player body
        this.physics.add.overlap(this.player.sprite, this.coins1.sprite, collectCoins, null, this); 
        this.physics.add.overlap(this.player.sprite, this.coins2.sprite, collectCoins, null, this); 
        // display success message for a couple of seconds,
        feedback = this.add.text(decisionPointX+20, gameHeight/2-160,  
                                 "Woohoo! You did it!", {
                                    font: "20px monospace",
                                    fill: "#ffffff",
                                    align: 'center',
                                    padding: { x: 20, y: 10 },
                                    backgroundColor: "#1ea7e1"
                                 })
            .setOrigin(0.5, 1);
        this.tweens.add({        
            targets: feedback,
            scaleX: { start: 0, to: 1 },
            scaleY: { start: 0, to: 1 },
            ease: 'Back',    
            duration: feedbackTime,
            repeat: 0,      
            yoyo: true
        });
        // then player floats across 'low route' and collects coins
        this.time.addEvent({delay: feedbackTime+250, 
                            callback: function(){
                                feedback.destroy();
                                this.player.sprite.anims.play('float', true);    
                                this.player.sprite.setVelocityX(playerVelocity/3);
                                this.time.addEvent({ delay: 150, 
                                                     callback: function(){this.player.sprite.setVelocityY(-100);},
                                                     callbackScope: this, 
                                                     repeat: 8 });
                            },
                            callbackScope: this});
    }
    else {  // else if fail to reach trial effort threshold
        trialSuccess = 0;
        // display failure message for a couple of seconds
        feedback = this.add.text(decisionPointX, gameHeight/2-160,  
                                 "Sorry, not quite enough\npower this time!", {
                                    font: "20px monospace",
                                    fill: "#ffffff",
                                    align: 'center',
                                    padding: { x: 20, y: 10 },
                                    backgroundColor: "#000000"
                                 })
            .setOrigin(0.5, 1);
        this.tweens.add({        
            targets: feedback,
            scaleX: { start: 0, to: 1 },
            scaleY: { start: 0, to: 1 },
            ease: 'Back',    
            duration: feedbackTime,
            repeat: 0,      
            yoyo: true
        });
        // then play powerup fail anim and progress via slow route
        this.time.addEvent({delay: feedbackTime+250, 
                            callback: function(){
                                feedback.destroy();
                                // then play short 'powerup fail' anim:
                                this.player.sprite.anims.play('powerupfail', true);
                                // and progress via bridge route (with sad face)
                                this.player.sprite.once(Phaser.Animations.Events.SPRITE_ANIMATION_COMPLETE, () => {
                                    // player progresses via bridge and earns no extra reward
                                    this.player.sprite.setVelocityX(playerVelocity/5);   // 5,6
                                    this.player.sprite.anims.play('sadrun', true);
                                    this.physics.add.collider(this.player.sprite, this.bridgeEndPoint, 
                                                              function(){eventsCenter.emit('bumpme');}, null, this); 
                                    eventsCenter.once('bumpme', onejump, this);
                                    });
                            },                         
                            callbackScope: this});
    }
};

// 4. When player hits end of scene, save trial data and move on to the next trial (reload the scene)
var trialEnd = function () {
    // get trial end time
    trialEndTime = Math.round(this.time.now);
    // set data to be saved into registry
    this.registry.set("trial"+trial, {trialNo: trial, 
                                      trialStartTime: trialStartTime,
                                      trialReward1: trialReward1,
                                      trialEffort1: trialEffort1,
                                      trialReward2: trialReward2,
                                      trialEffort2: trialEffort2,
                                      choice: choice,
                                      choiceRT: choiceRT,
                                      pressCount: pressCount,
                                      pressTimes: pressTimes,
                                      trialSuccess: trialSuccess,
                                      nCoins: nCoins,
                                      trialEndTime: trialEndTime
                                     });
    console.log(this.registry.getAll());   // for debugging only
    
    // For the sake of simplicity, save data for each trial separately
    saveTrialData(this.registry.get(`trial${trial}`));    // [for Pavlovia deployment]
    
    // if end of block, display end of block screen
    if (((trial+1) % blockLength == 0)) {
        this.player.sprite.setVelocityX(0);
        this.player.sprite.anims.play('wait', true);
        this.breakPanel = new BreakPanel(this, mapWidth-gameWidth/2, 300, nCoins);
        this.events.once('breakover', function () {
            //  restart coin total from 0 after each block
            nCoins=0;
            // iterate trial number
            trial++;
            // move to next trial
            this.scene.restart();    // [?wrap in delay function to ensure saving works]
        }, this);      
    } 
    else {
        // iterate trial number
        trial++;                
        // move to next trial
        this.scene.restart();        // [?wrap in delay function to ensure saving works]
    }  
};

//////////////////////MISC FUNCTIONS/////////////////////
// function to get player up other side of bridge by performing single jump
// used on reject and unsucessful accept trials
var onejump = function () {
    this.bridgeEndPoint.destroy();
    this.player.sprite.setVelocityY(-350);
    this.time.addEvent(750,  // also make a bit faster once over bridge [DOESN'T SEEM TO WORK]
                       function(){this.player.sprite.setVelocityX(playerVelocity*2);},
                       null, this);
};

// function to make coin sprites disappear upon contact with player
// (so player appears to 'collect' them)
var collectCoins = function(player, coin){
    coin.disableBody(true, true);   // individual coins from group become invisible upon overlap
    nCoins++; 
    coinsText.setText('coins: '+nCoins);  // and coins total and text updates
};