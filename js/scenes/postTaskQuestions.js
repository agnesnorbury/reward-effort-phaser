// Scene to hold post-task questions, routes participants to the Game End scene

// import js game element modules (sprites, ui, outcome animations)
import QuestionPanel from "../elements/questionPanel.js";

// import some js from Pavlovia lib to enable data saving [for Pavlovia deployment]
import * as data from "../../lib/data-2020.2.js";
import { saveTrialData } from '../util.js';

// initialize vars
var img;

// this function extends Phaser.Scene and includes the core logic for the scene
export default class PostTaskQuestions extends Phaser.Scene {
    constructor() {
        super({
            key: 'PostTaskQuestions'
        });
    }

    preload() {
        // load animated coin sprite
        this.load.spritesheet('coin', './assets/spritesheets/coin.png', { 
            frameWidth: 15.8, 
            frameHeight: 16 });
    }
    
    create() {
        // initialize sizing var
        var gameHeight = this.sys.game.config.height;
        var gameWidth = this.sys.game.config.width;
        
        // let's do this a long-winded way for easiness...[should be a function]
        var gamePhase = 'postTask';
        ///////////////////QUESTION ONE////////////////////
        var mainTxt = '   How much did you want to collect coins?   \n\n\n\n\n'+
                      'Please rate from 0 to 100\n'+ 
                      'on the scale below, where\n\n'+
                      '  0 =             and           100 = \n'+  
                      '"not at all"                     "a lot"  '
        var questionNo = 1;
        
        this.questionPanel = new QuestionPanel(this, gameWidth/2, gameHeight/2, 
                                               gamePhase, questionNo, mainTxt);
        img = this.add.image(gameWidth/2, gameHeight/2-75, 'coin');
        img.setScale(2);
        
        ///////////////////QUESTION TWO////////////////////
        this.events.once(gamePhase+'question1complete', function () {
            img.destroy();
            saveTrialData(this.registry.get(`${gamePhase}question${questionNo}`));
            mainTxt = 'How happy were you when you collected a coin?\n\n\n\n\n\n'+
                      'Please rate from 0 to 100\n'+ 
                      'on the scale below, where\n\n'+
                      ' 0 =              and           100 = \n'+  
                      '"not at all"                     "a lot"  '
            questionNo = 2;
            
            this.questionPanel = new QuestionPanel(this, gameWidth/2, gameHeight/2, 
                                                   gamePhase, questionNo, mainTxt);
            img = this.add.image(gameWidth/2, gameHeight/2-75, 'coin');
            img.setScale(2);
        }, this);        
        
        // end scene
        this.events.once(gamePhase+'question2complete', function () {
            img.destroy();
            saveTrialData(this.registry.get(`${gamePhase}question${questionNo}`));
            this.nextScene();
        }, this);
        
    }
        
    update(time, delta) {
    }
    
    nextScene() {
        //console.log(psychoJS);         // check passing PsychoJS exp object between scenes worked
        psychoJS.experiment.save();    // saves all experiment data and signals exp end to Pavlovia
        this.scene.start('TheEnd');
    } 
}
