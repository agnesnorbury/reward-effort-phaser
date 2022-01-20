// Scene to hold multi-page instructions text

// import js game element modules (sprites, ui, outcome animations)
import InstructionsPanel from "../elements/instructionsPanel.js";

// import our custom events centre for passsing info between scenes
import eventsCenter from '../eventsCenter.js';

// import some js from Pavlovia lib to enable data saving [Pavlovia deployment only]
import * as data from "../../lib/data-2020.2.js";
import { PsychoJS } from '../../lib/core-2020.2.js';

// some initial things that need to be in the first scene for Pavlovia deployment to work
// skip built-in error intercept
PsychoJS.prototype._captureErrors = () => {};
// initialise PsychoJS object for saving task data
window.psychoJS = new PsychoJS({ debug: true });  // attached to window object so as to be globally available (across scenes)

// this function extends Phaser.Scene and includes the core logic for the scene
export default class InstructionsScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'InstructionsScene',
            autoStart: true
        });
        
        (async function startPsychoJS() {
        // The experiment handler needed to save our data would
        // be inaccessible before this call resolves. Because of
        // a bug in PsychoJS, please make `expInfo` an empty object
        // instead of skipping if not required
        await psychoJS.start({ expName: 'Reward-effort game demo', expInfo: {} })
        })(); // [Pavlovia deployment only]
    }

    preload() {
        // load cloud sprites to add texture to background
        this.load.image('cloud1', './assets/imgs/cloud1.png');
        // load button and coin sprites
        this.load.image('button', './assets/imgs/button.png');
        this.load.spritesheet('coin', './assets/spritesheets/coin.png', { 
            frameWidth: 15.8, 
            frameHeight: 16 
        });
    }
    
    create() {
        // load a few cloud sprites dotted around
        const cloud1 = this.add.sprite(180, 100, 'cloud1');
        const cloud2 = this.add.sprite(320, 540, 'cloud1');
        const cloud3 = this.add.sprite(630, 80, 'cloud1');
        
        var gameHeight = this.sys.game.config.height;
        var gameWidth = this.sys.game.config.width;
        
        // let's do this a long-winded way for easiness...[should be a function]
        ///////////////////PAGE ONE////////////////////
        var mainTxt = ("  You are travelling through a strange land,  \n"+
                        "covered in rivers and streams.\n\n" +

                        "At regular points along your journey,\n"+
                        "you will have to [color=#d0f4f7]make a choice[/color] between\n" +
                        "[color=#d0f4f7]different routes[/color] across the water.\n\n");
        var buttonTxt = "next page";
        var pageNo = 1;
        this.instructionsPanel = new InstructionsPanel(this, 
                                                       gameWidth/2, gameHeight/2,
                                                       pageNo, mainTxt, buttonTxt);
        
        ///////////////////PAGE TWO////////////////////
        eventsCenter.once('page1complete', function () {
            mainTxt = ("    Different routes give you the chance to    \n"+
                       "collect different numbers of [img=coin] [color=#FFD700]coins[/color] [img=coin],\n" +
                       "which will be converted to bonus reward\n"+
                       "at the end of the game!\n\n" +  

                       "However, different routes also require\n"+
                       "different amounts of [img=button] [color=#e45404]power[/color] [img=button]\n"+
                       "to your magic umbrella,\n"+
                       "in order to get across...\n\n");
            pageNo = 2;
            this.instructionsPanel = new InstructionsPanel(this, 
                                                           gameWidth/2, gameHeight/2,
                                                           pageNo, mainTxt, buttonTxt);
            }, this);
        
        ///////////////////PAGE THREE////////////////////
        eventsCenter.once('page2complete', function () {
            mainTxt = ("  It is therefore up to you to decide  \n"+
                       "  at each crossing whether you think  \n" +
                       "it is worth trying the [color=#d0f4f7]high route[/color],\n"+
                       "  or if you prefer to take the [color=#d0f4f7]low route[/color].  \n\n" +  

                       "Remember, you will earn a\n" +
                       "[color=#FFD700]real bonus payment[/color], depending on \n"+
                       "how many coins you collect!\n\n" +                             

                       " When you are ready,\n" +
                       "press [u]start[/u] to begin.\n\n");
            buttonTxt = "start game"
            pageNo = 3;
            this.instructionsPanel = new InstructionsPanel(this, 
                                                           gameWidth/2, gameHeight/2,
                                                           pageNo, mainTxt, buttonTxt);
            }, this);
        
        // end scene
        eventsCenter.once('page3complete', function () {
            this.nextScene();
            }, this);
    }
        
    update(time, delta) {
    }
    
    nextScene() {
        this.scene.start('MainTask');
    } 
}
