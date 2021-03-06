// End scene to thank participants for their time

// This function extends Phaser.Scene and includes the core logic for the scene
export default class TheEnd extends Phaser.Scene {
    constructor() {
        super({
            key: 'TheEnd'
        });
    }

    preload() {
        // load cloud sprites to add texture to background
        this.load.image('cloud1', './assets/imgs/cloud1.png');
    }
    
    create() {
        // load a few cloud sprites dotted around
        const cloud1 = this.add.sprite(180, 100, 'cloud1');
        const cloud2 = this.add.sprite(320, 540, 'cloud1');
        const cloud3 = this.add.sprite(630, 80, 'cloud1');
        
        // add popup dialogue box with text
        var byebye = this.rexUI.add.dialog({
            background: this.rexUI.add.roundRectangle(0, 0, 400, 400, 20, 0x1ea7e1),
            title: this.rexUI.add.label({
                background: this.rexUI.add.roundRectangle(0, 0, 100, 40, 20, 0x000000),
                text: this.add.text(0, 0, "Thank you for your time!", {
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
                                   ("\n" +
                                    
                                    "  This part of the study is now over.  \n\n" +
                                   
                                    "You may close the browser window.\n\n"),
                                   
                                   {fontSize: '18px',
                                    align: 'center',
                                    color: '#000000'}),
            actions: [
                //createLabel(this, 'finish up')
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
        
        //control panel position and layout
        var gameHeight = this.sys.game.config.height;
        var gameWidth = this.sys.game.config.width;
        byebye
        .setPosition(gameWidth/2, gameHeight/2)
        .layout()
        .popUp(500);
    }
    
    update(time, delta) {
    }
    
    nextScene() {
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