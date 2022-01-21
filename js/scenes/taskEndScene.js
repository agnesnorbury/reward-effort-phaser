// End scene to inform participants they have finished the task, and route them to the post-task questions

// import some js from Pavlovia lib to enable data saving  [Pavlovia deployment only]
import * as data from "../../lib/data-2020.2.js";

// this function extends Phaser.Scene and includes the core logic for the scene
export default class TaskEndScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'TaskEndScene',
            //autoStart: true
        });
    }

    preload() {
        // load cloud sprites to add texture to background
        this.load.image('cloud1', './assets/imgs/cloud1.png');
        // load player sprite
        this.load.spritesheet('player', './assets/spritesheets/player1.png', { 
            frameWidth: 90, 
            frameHeight: 96});
    }
    
    create() {
        // load a few cloud sprites dotted around
        const cloud1 = this.add.sprite(180, 100, 'cloud1');
        const cloud2 = this.add.sprite(320, 540, 'cloud1');
        const cloud3 = this.add.sprite(630, 80, 'cloud1');
        
        // add popup dialogue box with text
        var instr = this.rexUI.add.dialog({
            background: this.rexUI.add.roundRectangle(0, 0, 400, 400, 20, 0x1ea7e1),
            title: this.rexUI.add.label({
                background: this.rexUI.add.roundRectangle(0, 0, 100, 40, 20, 0x000000),
                text: this.add.text(0, 0, "Game Over!", {
                    fontSize: '24px'
                    }),
                align: 'center',
                space: {
                    left: 15,
                    right: 15,
                    top: 10,
                    bottom: 10
                }
            }),
            content: this.add.text(0, 0, 
                                   ("Thank you for playing.\n\n" +
                                   
                                    "  We will now ask you to answer  \n"+
                                    "a few short questions about\n"+
                                    "your experience of the game.\n\n"+
                                   
                                    "Press the button below to see\n"+
                                    "the questions and finish up\n"+
                                    "this part of the study!\n\n"),
                                   
                                   {fontSize: '18px',
                                    align: 'center',
                                    color: '#000000'}),
            actions: [
                createLabel(this, 'finish up')
            ],
            space: {
                title: 25,
                content: 10,
                action: 10,
                left: 10,
                right: 10,
                top: 10,
                bottom: 10,
            },
            align: {
                actions: 'center',
            },
            expand: {
                content: false, 
            }
            });
        
        // control panel position and layout
        var gameHeight = this.sys.game.config.height;
        var gameWidth = this.sys.game.config.width;
        instr
        .setPosition(gameWidth/2, gameHeight/2)
        .layout()
        .popUp(500);
        
        // control action button functionality (click, hover)
        instr
        .on('button.click', function (button) {
            instr.scaleDownDestroy(500);
            this.nextScene();                           
        }, this)
        .on('button.over', function (button) {
            button.getElement('background').setStrokeStyle(2, 0xffffff);
        })
        .on('button.out', function (button) {
            button.getElement('background').setStrokeStyle();
        });
        
        // let's stick an img on too
        const img = this.add.image(0, 0, 'player', 14);  //(x, y, name, frameNo)
        const player = this.tweens.add({ 
            targets: img,
            x: { value: 700, duration: 4000, ease: 'Power2', repeat: 0 },
            y: { value: 400, duration: 6000, ease: 'Linear', repeat: 0 }
            });
    }
    
    update(time, delta) {
    }
    
    nextScene() {
//        console.log(psychoJS);         // check passing PsychoJS object between scenes worked [for Pavlovia debug]
        this.scene.start('PostTaskQuestions');
    } 
}

// generic function to create button labels
var createLabel = function (scene, text) {
    return scene.rexUI.add.label({
        background: scene.rexUI.add.roundRectangle(0, 0, 0, 40, 20, 0x5e81a2),
        text: scene.add.text(0, 0, text, {
            fontSize: '20px',
            fill: '#000000'
        }),
        align: 'center',
        width: 40,
        space: {
            left: 10,
            right: 10,
            top: 10,
            bottom: 10
        }
    });
};