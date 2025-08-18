Vue.component('pm-animation-viewer', {
    template: `
        <div id="main3d">
            <transition name="fade">
                <div v-if="!loading">
                    <section :class="playerParams.controls?'':'no-controls'" id="scene" :style="{'transform': 'scale('+scale+')', 'will-change':'transform'}" :key="currentStep">
                        <div style="width: 700px; height: 1100px;"></div>
                        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 100px; z-index: 9999998"></div>
						
						<img v-once id="scene_layer_base" src="https://static.bright-plans.com/3d-player/base.png" style="position: absolute; left: 0px; top: 0px;">
						<img v-once id="scene_layer_base_mask" src="https://static.bright-plans.com/3d-player/base-mask.png" style="position: absolute; left: 0px; top: 0px; z-index: 6000;">
						
                        <img v-for="(sceneObj, i) in scene" v-if="sceneObj.group_id != 1" :key="sceneObj.unique_key" :id="'scene_layer_'+sceneObj.unique_key"  :style="getSceneObjectStyle(sceneObj)" :src="'https://static.bright-plans.com/3d-player/'+sceneObj.src+'.png'">
						<div id="group-1" style="opacity: 0; position: absolute; left: 0; top: 0; right: 0; bottom: 0; z-index: 9999;">
							<img v-for="(sceneObj, i) in scene" v-if="sceneObj.group_id == 1" :key="sceneObj.unique_key" :id="'scene_layer_'+sceneObj.unique_key"  :style="getSceneObjectStyle(sceneObj)" :src="'https://static.bright-plans.com/3d-player/'+sceneObj.src+'.png'">
						</div>
                        <div :style="{visibility: playerState === 'playing' ? 'visible': 'hidden'}" style="will-change: transform, opacity; margin-top: 0" class="info-box" id="info-box-prev" v-html="prevTitle" />
						<div :style="autoplay ? 'opacity:0':'opacity:1'" style="will-change: transform, opacity; margin-top: 0" id="info-box" v-html="title" />
						<div id="step-end"></div>
                    </section>
                    <div id="scene-mask"></div>
                    <div v-if="playerParams.controls" id="navigation" style="z-index: 9999999">
                        <button id="pagerLeft" @click="prevStep()" type="button">
                            <svg viewBox="0 0 24 24"><path fill="#ffffff" d="M6,18V6H8V18H6M9.5,12L18,6V18L9.5,12Z" /></svg>
                        </button>
                        <button v-if="playerState==='playing'" id="pausePlay" @click="pausePlay()" type="button" class="button-big">
                            <svg viewBox="0 0 24 24"><path fill="#ffffff" d="M14,19H18V5H14M6,19H10V5H6V19Z" /></svg>
                        </button>
                        <button v-else-if="playerState==='finished'" id="restart" @click="restart()" type="button" class="button-big">
                            <svg viewBox="0 0 24 24" style="margin-left: 4px;"><path fill="#fff" d="M11,4C13.05,4 15.09,4.77 16.65,6.33C19.78,9.46 19.77,14.5 16.64,17.64C14.81,19.5 12.3,20.24 9.91,19.92L10.44,17.96C12.15,18.12 13.93,17.54 15.24,16.23C17.58,13.89 17.58,10.09 15.24,7.75C14.06,6.57 12.53,6 11,6V10.58L6.04,5.63L11,0.68V4M5.34,17.65C2.7,15 2.3,11 4.11,7.94L5.59,9.41C4.5,11.64 4.91,14.39 6.75,16.23C7.27,16.75 7.87,17.16 8.5,17.45L8,19.4C7,19 6.12,18.43 5.34,17.65Z" /></svg>
                        </button>
                        <button v-else id="startPlay" @click="startPlay()" type="button" class="button-big" style="display: inline-block;">
                            <svg viewBox="0 0 24 24"><path fill="#ffffff" d="M8,5.14V19.14L19,12.14L8,5.14Z" /></svg>
                        </button>
                        <button id="pagerRight" @click="nextStep()" type="button">
                            <svg viewBox="0 0 24 24"><path fill="#ffffff" d="M16,18H18V6H16M6,18L14.5,12L6,6V18Z" /></svg>
                        </button>
                    </div>
					<div style="font-size: 10px; line-height: 1.2; position: fixed; top: 20px; right: 20px; opacity: .3;">Powered by<br/><b>BrightPlans</b></div>
                </div>
            </transition>
            <transition name="fade">
                <section v-if="loading" id="animation-loader">
                    <div id="animation-loader-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="none" stroke="#2b57ad" stroke-width="32" d="M521.6 186.4S235.6 78 245.3 323.8c3.3 84.8 54.3 143.2 69.7 197 15.4 53.5 7.7 172.4 18 211.4 9.4 35.2 29 94 51 99.8 63 17 30.3-64.6 54.2-186.6 37.2-189 144-129.3 172.5-5.4 11.5 49.8-5 150.2 18.6 185 22.8 33.8 75 1 83.4-152.5 6-110.4 12-158.4 51.8-227.6 24.8-43 51-142.4 26.4-200-35.4-82-147-106.5-269.5-58.7z" stroke-linejoin="round"/></svg>
                    </div>
                    <div id="animation-loader-info">{{ loadingText }} ({{loaded}}%)</div>
                </section>
            </transition>
        </div>
    `,
    props: {
        // The base status
        status: {
            type: Array,
            default: function () {
                return [];
            }
        },
        // The treatment steps
        steps: {
            type: Array,
            default: function () {
                return [];
            }
        },
        // The player parameters
        playerParams: {
            type: Object,
            default: function () {
                return {
                    controls: true, // Show control (play, pause, next, prev, restart) buttons, boolean
                    language: 'en',
                    // autoplay
                    // disablekeyboard
                    // enablejsapi
                    // branding
                };
            }
        },
    },
    data: function () {
        return {
            loading: true,
            loaded: 0,
            filesTotal: 0,
            filesLoaded: 0,
            playerState: null,
            autoplay: true,
            queue: [],
            scene: [],
            scale: 1,
            currentStep: 0,
            prevTitle: '',
            title: '',
            animationSequences: 0,
            animationItems: {},
            state: {},
            stepStarted: null,
			maxFPS: 30,
			maxMoveFPS: 30,
			maxFadeFPS: 15,
			debug: false,
        }
    },
    computed: {
		loadingText: function() {
			try {
				const lang = this.playerParams.language.toLowerCase();
				if (this.playerParams.language === 'en') return "Loading";
				if (this.playerParams.language === 'de') return "Laden";
				if (this.playerParams.language === 'hu') return "Betöltés";
				return "Loading";
			} catch(e) {
				return "Loading";
			}
		},
        // Turn on devMode to show detailed runtime information
        devMode: function () {
            return (true);
        },

        toothIds: function () {
            var i = 0;
            var ids = [];
            while (i < 4) {
                i++;
                var j = 0;
                while (j < 8) {
                    j++;
                    ids.push(i * 10 + j);
                }
            }
            return (ids);
        },

        // @todo: Add to drill item params
        drillPositions: function () {
            return({
                '11': { 'x':259,'y':212 },
                '12': { 'x':173,'y':226 },
                '13': { 'x':117,'y':254 },
                '14': { 'x':91,'y':299 },
                '15': { 'x':69,'y':335 },
                '16': { 'x':59,'y':378 },
                '17': { 'x':52,'y':425 },
                '18': { 'x':52,'y':468 },
                '21': { 'x':-248,'y':212 },
                '22': { 'x':-166,'y':226 },
                '23': { 'x':-105,'y':254 },
                '24': { 'x':-88,'y':299 },
                '25': { 'x':-67,'y':335 },
                '26': { 'x':-53,'y':378 },
                '27': { 'x':-43,'y':425 },
                '28': { 'x':-43,'y':468 },
                '31': { 'x':-275,'y':741 },
                '32': { 'x':-217,'y':730 },
                '33': { 'x':-167,'y':706 },
                '34': { 'x':-136,'y':670 },
                '35': { 'x':-107,'y':638 },
                '36': { 'x':-87,'y':592 },
                '37': { 'x':-66,'y':547 },
                '38': { 'x':-56,'y':505 },
                '41': { 'x':283,'y':741 },
                '42': { 'x':221,'y':730 },
                '43': { 'x':171,'y':706 },
                '44': { 'x':142,'y':670 },
                '45': { 'x':108,'y':638 },
                '46': { 'x':89,'y':592 },
                '47': { 'x':67,'y':547 },
                '48': { 'x':59,'y':505 }
            });
        },

        // @todo: Used only by impaced wisdom tooth
        stateConfig: function () {
            return({
                '31': [
                    { display: '1', z: 6000, part: 'main', offsetY: -60 }
                ],
            });
        },

    },
    created: function () {
		// this.getCpuSpeed();
        this.calculateScale();
		
		try {
			window.addEventListener("orientationchange", () => {
				//console.log("the orientation of the device is now " + screen.orientation.angle);
				//location.reload();
				window.setTimeout(() => {
					this.calculateScale();
					this.$forceUpdate();		
				}, 250);
			});
		} catch(e) {
			
		}
		try {
			if ('orientation' in screen) screen.orientation.lock("portrait-primary")
		} catch(e) {
			
		}
		
		
		try {
			window.addEventListener("message", (event) => {
				if (event.origin === 'https://bright-plans.com' || event.origin === 'https://offer.bright-plans.com') {
					if (event.data === "pausePlay") this.pausePlay();
					if (event.data === "startPlay") this.startPlay();
					if (event.data === "stopPlay") this.stopPlay();
					if (event.data === "restart") this.restart();
				} else {
					return;
				}
			});
		} catch(e) {
			
		}
    },
    mounted: function () {
        this.queue = [];
        decodedQueueData = JSON.parse(atob(queueData));
		console.log('--------->',decodedQueueData);
        for(var i in decodedQueueData) {
            //if(!queueData[i].animations || queueData[i].animations.length === 0) continue;
            this.queue.push(decodedQueueData[i]);
        }
        this.preloadImages();
        this.buildScene(0);
        this.updateTitle();      
		var self = this;
		/*window.onresize = function(event) {
			self.calculateScale();
			self.buildScene(self.currentStep);
		};*/
    },
    watch: {

        playerState: function () {
            var event = new CustomEvent('playerStateChanged', {
                detail: {
                    state: this.playerState,
                },
                bubbles: true,
            });
            document.dispatchEvent(event);
			if (this.playerState === 'loaded' && this.autoplay) {
                this.$nextTick(function () {
                    this.startPlay();
                });
            }
        },

        currentStep: function () {
            this.clearScene();
            this.sceneReady = false;
            this.sceneFilesLoaded = 0;
            this.updateTitle();
            this.buildScene(this.currentStep);
            if (this.autoplay) this.runSceneAnimations(this.currentStep);
			
			try {
				var event = new CustomEvent('playerStepChanged', {
					detail: {
						step: this.currentStep,
						idx: this.queue[this.currentStep].procedureIdx
					},
					bubbles: true,
				});
				document.dispatchEvent(event);
			} catch(e) {
				
			}
        },

        filesLoaded: function () {
            this.loaded = Math.ceil((this.filesLoaded / this.filesTotal) * 100);
            this.$nextTick(function () {
                if (this.filesLoaded === this.filesTotal) {
                    this.playerState = 'loaded';
                    this.loading = false;
                } else {
                    if (this.playerState !== 'loading') this.playerState = 'loading';
                }
            });
        },

    },
    methods: {
		seekAnimation: function(idx) {
			const i = this.queue.findIndex((el) => {
				if (typeof el.procedureIdx === "undefined" || el.procedureIdx.length === 0) return false;
				return el.procedureIdx.includes(idx);
			});
			if (i >= 0) {
				this.autoplay = true;
				this.currentStep = i;
			}
		},
		getCpuSpeed: function() {
			if (typeof this.cpuSpeed !== 'undefined') return this.cpuSpeed;
			var t0 = performance.now();
			for(var i=0; i<100000; i++){
				Math.random();
			}
			var t1 = performance.now();
			var t = t1 - t0;
			if (t > 15) {
				this.cpuSpeed = 15;
			} else {
				this.cpuSpeed = 30;
			}
		},
        preloadImages: function () {
            var self = this;
            // Build the preload queue
            var files = [];
            this.filesTotal = 0;
            this.filesLoaded = 0;
            files.push('base');
            files.push('base-mask');
            files.push('drill');
            files.push('shadow');
            for (i in this.toothIds) {
                files.push('2/' + this.toothIds[i].toString());
            }
            for (i in this.queue) {
                for (j in this.queue[i].base) {
                    if (files.indexOf(this.queue[i].base[j].src) === -1) files.push(this.queue[i].base[j].src);
                }
            }
            this.filesTotal = files.length;

            for (f in files) {
                var img = new Image();
                img.src = 'https://static.bright-plans.com/3d-player/' + files[f] + '.png';
                img.onload = function () {
                    self.filesLoaded++;
                };
                img.onerror = function () {
                    self.filesLoaded++;
                    // @ todo
                };
            }
        },

        /**
         *  Handle the press of play button
         *  If there are paused animations resume playing
         *  Else run the animations for the current scene
         */
        startPlay: function () {
            // Set player state
            this.playerState = 'playing';

            // If paused resume animation(s)
            if (this.animationSequences > 0) {
                var els = document.getElementsByTagName('img');
                for (i in els) {
                    Velocity(els[i], 'resume');
                }
                Velocity(document.getElementById('info-box'), 'resume');
                Velocity(document.getElementById('step-end'), 'resume');
				try {
					Velocity(document.getElementById('group-1'), 'resume');
				} catch(e) {
				
				}
            }
            // Or start scene animations
            else {
                this.autoplay = true;
                if (this.currentStep === 0) this.currentStep++;
                else this.runSceneAnimations(this.currentStep);
            }
			
			try {
				var event = new CustomEvent('playerStepChanged', {
					detail: {
						step: this.currentStep,
						idx: this.queue[this.currentStep].procedureIdx
					},
					bubbles: true,
				});
				document.dispatchEvent(event);
			} catch(e) {
				
			}
        },

        /**
         *  Handle the press of pause button
         *  Pause all running animations
         */
        pausePlay: function () {
            var els = document.getElementsByTagName('img');
            for (i in els) {
                Velocity(els[i], 'pause');
            }
            Velocity(document.getElementById('info-box'), 'pause');
            Velocity(document.getElementById('step-end'), 'pause');
			try {
				Velocity(document.getElementById('group-1'), 'pause');
			} catch(e) {
				
			}
            this.playerState = 'paused';
        },

        stopPlay: function () {
            this.autoplay = false;
            this.playerState = 'stopped';
            this.clearScene();
            this.updateTitle();
            this.buildScene(this.currentStep);
        },

        /**
         *  Handle the press of restart button
         */
        restart: function () {
            this.autoplay = true;
            this.currentStep = 0;
        },

        /**
         *  Handle the press of rewind button
         */
        prevStep: function () {
            this.autoplay = false;
            this.playerState = 'stopped';
            if (this.currentStep === 0) return false;
            this.currentStep--;
        },

        /**
         *  Handle the press of forward button
         */
        nextStep: function (withDelay) {
            if (this.currentStep + 1 === this.queue.length) return false;
            this.currentStep++;
        },


        updateTitle: function () {
            //@todo: move to backend
            try {
                this.prevTitle = this.title;
				if (this.currentStep <= -1) this.title = 'Kiindulási állapot';
                else if (typeof this.queue[this.currentStep].title !== 'undefined') this.title = this.queue[this.currentStep].title;
                else this.title = this.prevTitle;
            } catch(e) {
                this.title = this.prevTitle;
                console.error(e);
            }
        },

        onAnimationFinished: function () {
            var stepFinished = new Date();
            var res = Math.abs(this.stepStarted - stepFinished) / 1000;

            // console.log('Finished in ' + res + ' seconds');
            if (this.autoplay === true && this.queue.length > this.currentStep + 1) {
                this.playerState = 'playing';
                this.nextStep();
            } else if (this.queue.length === this.currentStep + 1) {
                this.autoplay = false;
                this.playerState = 'finished';
            } else if (!this.autoplay) {
                this.playerState = 'paused';
            }
        },

        /**
         * Modifies the canvas scale based on the viewport width
         * Called on the component's created event and on window resize
         */
        calculateScale: function () {
            var xScale = (window.innerWidth - 40) / 700;
            if (this.playerParams.controls) var yScale = (window.innerHeight - 90) / 1100;
            else var yScale = (window.innerHeight - 100) / 1100;
            if (xScale < yScale) this.scale = xScale;
            else this.scale = yScale;
			
			if (yScale < 0) {
				window.setTimeout(()=> {
					this.calculateScale();
				}, 100);
			}
        },

        addSceneStaticObject: function (params) {
            this.scene.push(params);
        },

        clearScene: function () {
            Velocity(document.getElementById('step-end'), 'stop');
            document.getElementById('step-end').style.opacity = 0;

            // Stop all running animations
            var els = document.getElementsByTagName('img');
            for (i in els) {
                Velocity(els[i], 'finish');
            }
            Velocity(document.getElementById('scene_layer_drill'), 'stop');
            Velocity(document.getElementById('scene_layer_laser'), 'stop');
            Velocity(document.getElementById('info-box'), 'stop');
            this.scene = [];
            this.animationSequences = 0;
        },

        buildScene: function (stepIndex) {
            this.stepStarted = new Date();
            //this.addSceneStaticObject({src: 'base'});
            //this.addSceneStaticObject({src: 'base-mask', position: {z: 6000}});
            this.addSceneStaticObject({src: 'drill', hidden: "1", position: {z: 9999}, unique_key: 'drill'});
            this.addSceneStaticObject({src: 'laser', hidden: "1", position: {z: 9999}, unique_key: 'laser'});
            this.scene = this.scene.concat(this.queue[stepIndex].base);
            for (i in this.scene) {
                this.scene[i].loaded = false;
            }
        },

        runSceneAnimations: function (stepIndex) {
            var step = this.queue[stepIndex];
            this.animationItems = {};
            this.$nextTick(function () {
                if (typeof (step.animations) !== 'undefined' && step.animations.length > 0) {
                    // console.log('Running ' + step.animations.length + ' animations for step ' + this.currentStep);
                    this.playerState = 'playing';
                    this.animationSequences = step.animations.length;
                    for (i in step.animations) {
                        this[step.animations[i].callback](step.animations[i]);
                    }
                    for (j in this.animationItems) {
                        if (this.animationItems.hasOwnProperty(j)) {
                            Velocity.RunSequence(this.animationItems[j]);
                        }
                    }
                } else {
                    //console.log('No animations for step ' + this.currentStep);
                    this.animationSequences = 0;
                    if (this.autoplay) this.nextStep();
                }
            });
        },

        getSceneObjectStyle: function (sceneObj) {
            var styles = [];
            styles.push('position: absolute');
            if (typeof (sceneObj.position) !== 'undefined' && typeof (sceneObj.position.x) !== 'undefined') styles.push('left: ' + sceneObj.position.x + 'px');
            else styles.push('left: 0');
            if (typeof (sceneObj.position) !== 'undefined' && typeof (sceneObj.position.y) !== 'undefined') styles.push('top: ' + sceneObj.position.y + 'px');
            else styles.push('top: 0');
            if (typeof (sceneObj.position) !== 'undefined' && typeof (sceneObj.position.z) !== 'undefined') styles.push('z-index: ' + sceneObj.position.z);
            if (typeof (sceneObj.hidden) !== 'undefined' && (sceneObj.hidden === '1' || sceneObj.hidden === 1 || sceneObj.hidden === 'true' || sceneObj.hidden === true)) styles.push('opacity: 0');
            if (typeof (sceneObj.animation) === 'object') {
                styles.push('animation-name: ' + sceneObj.animation.animation + '-' + sceneObj.part);
                styles.push('animation-duration: ' + sceneObj.animation.duration);
                styles.push('animation-delay: ' + sceneObj.animation.delay + 's');
                styles.push('animation-fill-mode: both');
            }
			styles.push('will-change: opacity, top, left, tansform');
            return styles.join('; ');
        },


        getDrillPosition: function (toothId) {
            try {
                var position = {};
                if (typeof (toothId) === 'undefined') {
                    this.showDevInfo('error', new Error('[Fatal error] ToothId param missing for function getDrillPosition'));
                    return;
                }
                if (typeof (this.drillPositions[toothId]) === 'undefined') {
                    this.showDevInfo('error', new Error('[Incomplete config] Drillposition missing for tooth: ' + toothId));
                    return;
                }
                position.x = this.drillPositions[toothId].x;
                position.y = this.drillPositions[toothId].y;
                return position;
            } catch (e) {
                this.showDevInfo('error', e);
            }
        },

        showDevInfo: function (level, err) {
            switch (level) {
                case 'fatal':
                case 'error':
                    console.error(err.message, err.trace);
                    break;
                case 'notice':
                case 'info':
                    if (this.devMode) console.log('NOTICE: ' + err);
            }
        },

        getToothRegion: function (id) {
            return (Math.floor(id / 10));
        },

        getElementForAnimation: function(params = null) {
            var el = null;
            var key = '';
            if(params === null) {
                el = document.getElementById('info-box');
                key = 'info-box';
            } else if(params === 'prev-title') {
                el = document.getElementById('info-box-prev');
                key = 'info-box-prev';
            } else if(params.tool) {
                el = document.getElementById('scene_layer_' + params.tool);
                key = params.tool;
            } else {
                el = document.getElementById('scene_layer_' + params.unique_key);
                key ='scene_layer_' + params.unique_key;
            }
            if (typeof (this.animationItems[key]) === 'undefined') this.animationItems[key] = [];
            return el;
        },

        runTitleFadeInAnimation: function (params) {
			params.fadeDuration = 900; // 1500
			var elPrev = this.getElementForAnimation('prev-title');
			var el = this.getElementForAnimation();
			
			if (elPrev.innerHTML === el.innerHTML) {
				this.animationItems['info-box-prev'].push({
					e: elPrev,
					p: {opacity: 0, translateY: 0},
					o: {duration: 1, delay: 0}
				});
				
				this.animationItems['info-box'].push({
					e: el,
					p: {opacity: 1, translateY: 0},
					o: {duration: 1, delay: 0}
				});
				return;
			}
			
			
			this.animationItems['info-box-prev'].push({
                e: elPrev,
                p: {opacity: 0, translateY: 90},
                o: {
					duration: params.fadeDuration,
					delay: params.start,
					queue: false,
					sequenceQueue: false,
					easing: this.getFPSLimitedSteps(params.fadeDuration, this.maxFPS),
				}
            });
			
            
            if (this.debug) console.log('runTitleFadeInAnimation', params, el);
            
			this.animationItems['info-box'].push({
                e: el,
                p: {opacity: 0, translateY: -90},
                o: {duration: 1, delay: 0}
            });
            this.animationItems['info-box'].push({
                e: el,
                p: {opacity: 1, translateY: 0},
                o: {
					duration: params.fadeDuration,
					delay: params.start + 10,
					queue: false,
					sequenceQueue: false,
					easing: this.getFPSLimitedSteps(params.fadeDuration, this.maxFPS),
				}
            });
        },

        runTitleFadeOutAnimation: function (params) {
			return;
            var self = this;
			params.fadeDuration = 0;
			
			var elPrev = this.getElementForAnimation('prev-title');
			this.animationItems['info-box-prev'].push({
                e: elPrev,
                p: {opacity: 1, translateY: 0},
                o: {
					begin: function(elements) { self.prevTitle = self.title; },
					duration: params.fadeDuration,
					delay: params.start,
					queue: false,
					sequenceQueue: false,
					easing: this.getFPSLimitedSteps(params.fadeDuration, this.maxFPS),
				}
            });
			
			
            var el = this.getElementForAnimation();
            
			if (this.debug) console.log('runTitleFadeOutAnimation', params);
            
			this.animationItems['info-box'].push({
                e: el,
                p: {opacity: 0},
                o: {
					duration: params.fadeDuration,
					delay: params.start,
					queue: false,
					sequenceQueue: false,
					easing: this.getFPSLimitedSteps(params.fadeDuration, this.maxFPS),
				}
            });
        },

        runStepEndAnimation: function (params) {
            var self = this;
            var el = document.getElementById("step-end");
            this.animationItems['step-end'] = [];
            this.animationItems['step-end'].push({
                e: el,
                p: {opacity: 0},
                o: {
					duration: 0,
					delay: params.start + 500,
					queue: false,
					complete: function () {
						self.onAnimationFinished();
					},
				}
            });
        },

        runFadeInAnimation: function (params) {
            var el = this.getElementForAnimation(params);
            if (typeof (params.effect) !== 'undefined') params.effect.opacity = 1;
            else params.effect = {opacity: 1};
            var fadeDuration = typeof(params.fadeDuration !== 'undefined') ? parseInt(params.fadeDuration) : 1500;
            this.animationItems['scene_layer_' + params.unique_key].push({
                e: el,
                p: {opacity: 0},
                o: {
					duration: 0,
					delay: 0,
					queue: false,
					sequenceQueue: false
				}
            });
            this.animationItems['scene_layer_' + params.unique_key].push({
                e: el,
                p: params.effect,
                o: {
					duration: fadeDuration,
					delay: params.start,
					easing: this.getFPSLimitedSteps(fadeDuration, this.maxFadeFPS),
				}
            });
			
			if (this.debug) console.log('runFadeInAnimation', params);
        },

        runFadeOutAnimation: function (params) {
            var el = this.getElementForAnimation(params);
            if (typeof (params.effect) !== 'undefined')params.effect.opacity = 0;
            else params.effect = {opacity: 0};
            var fadeDuration = typeof(params.fadeDuration !== 'undefined') ? parseInt(params.fadeDuration) : 1500;
            this.animationItems['scene_layer_' + params.unique_key].push({
                e: el,
                p: params.effect,
                o: {
					duration: fadeDuration,
					delay: params.start,
					queue: false,
					sequenceQueue: false,
					easing: this.getFPSLimitedSteps(fadeDuration, this.maxFadeFPS),
				}
            });
			
			if (this.debug) console.log('runFadeOutAnimation', params);
        },
		
		runDummyAnimation: function (params) {
            // var el = this.getElementForAnimation(params);
        },

        runInsertAnimation: function (params) {
			var el = null;
			// console.log(params);
			if (params.groupId && params.groupId > 0) {
				el = document.getElementById('group-1');
                var key ='scene_layer_group_1';
				if (typeof (this.animationItems[key]) === 'undefined') this.animationItems[key] = [];
				params.unique_key = 'group_1';
			} else {
				var el = this.getElementForAnimation(params);
			}
			
            var offsets = this.getAngleOffsets(params);
            var fadeDuration = typeof(params.fadeDuration !== 'undefined') ? parseInt(params.fadeDuration) : 500;
            var moveDelay = typeof(params.moveDelay !== 'undefined') ? parseInt(params.moveDelay) : 500;
            // console.log('moveDelay', moveDelay);
            var moveDuration = typeof(params.moveDuration !== 'undefined') ? parseInt(params.moveDuration) : 1500;
            this.animationItems['scene_layer_' + params.unique_key].push({
                e: el,
                p: { opacity: 0, translateY: offsets.yOffset, translateX: offsets.xOffset},
                o: {duration: 0, delay: 0}
            });
            this.animationItems['scene_layer_' + params.unique_key].push({
                e: el,
                p: {opacity: 1},
                o: {
					queue: false,
					sequenceQueue: false,
					duration: fadeDuration,
					delay: params.start, 
					easing: this.getFPSLimitedSteps(fadeDuration, this.maxFadeFPS),
				}
            });
            this.animationItems['scene_layer_' + params.unique_key].push({
                e: el,
                p: {translateY: 0, translateX: 0},
                o: {
					duration: moveDuration,
					delay: moveDelay,
					easing: this.getFPSLimitedSteps(moveDuration, this.maxMoveFPS),
				}
            });
			
			if (this.debug) console.log('runInsertAnimation', params);
        },

        runRemoveAnimation: function (params) {
            var el = this.getElementForAnimation(params);
            var offsets = this.getAngleOffsets(params);
            var fadeDuration = typeof(params.fadeDuration !== 'undefined') ? parseInt(params.fadeDuration) : 500;
            var moveDelay = typeof(params.moveDelay !== 'undefined') ? parseInt(params.moveDelay) : 500;
            var moveDuration = typeof(params.moveDuration !== 'undefined') ? parseInt(params.moveDuration) : 1500;
            this.animationItems['scene_layer_' + params.unique_key].push({
                e: el,
                p: {translateY: offsets.yOffset, translateX: offsets.xOffset},
                o: {
					duration: moveDuration,
					delay: params.start,
					easing: this.getFPSLimitedSteps(moveDuration, this.maxMoveFPS),
				}
            });
            this.animationItems['scene_layer_' + params.unique_key].push({
                e: el,
                p: {opacity: 0},
                o: {
					duration: fadeDuration,
					delay: moveDelay,
					queue: false,
					easing: this.getFPSLimitedSteps(fadeDuration, this.maxFadeFPS),
				}
            });
			
			if (this.debug) console.log('runRemoveAnimation', params);
        },

        runRemoveFadeAnimation: function (params) {
            var el = this.getElementForAnimation(params);
            var offsets = this.getAngleOffsets(params);
            var fadeDuration = typeof(params.fadeDuration !== 'undefined') ? parseInt(params.fadeDuration) : 500;
            var moveDelay = typeof(params.moveDelay !== 'undefined') ? parseInt(params.moveDelay) : 500;
            var moveDuration = typeof(params.moveDuration !== 'undefined') ? parseInt(params.moveDuration) : 1500;
            this.animationItems['scene_layer_' + params.unique_key].push({
                e: el,
                p: {translateY: offsets.yOffset, translateX: offsets.xOffset},
                o: {
					duration: moveDuration,
					delay: params.start,
					queue: false,
					easing: this.getFPSLimitedSteps(moveDuration, this.maxMoveFPS),
				}
            });
            this.animationItems['scene_layer_' + params.unique_key].push({
                e: el,
                p: {opacity: 0},
                o: {
					duration: fadeDuration,
					delay: moveDelay,
					queue: false,
					sequenceQueue: false,
					easing: this.getFPSLimitedSteps(fadeDuration, this.maxFadeFPS),
				}
            });
			
			if (this.debug) console.log('runRemoveFadeAnimation', params);
        },

        runShowToolAnimation: function (params) {
            var tool = params.tool;
            var start = params.start;
            var pos = this.getDrillPosition(params.tooth_id);
            var el = this.getElementForAnimation(params);
            var region = this.getToothRegion(params.tooth_id);
            var jaw = parseInt(region) < 3 ? 'upper' : 'lower';

            // console.log('runShowToolAnimation', params);

            transform = this.getToolTransformations(region);
            this.state[tool + 'FirstRegion'] = region;
            this.state[tool + 'LastJaw'] = jaw;
            this.animationItems[tool].push({
                e: el,
                p: {opacity: 0, translateX: pos.x, translateY: region > 2 ? pos.y - 100 : pos.y + 100, rotateZ: transform.rotateZ, scaleX: transform.scaleX, scaleY: transform.scaleY},
                o: {queue: false, sequenceQueue: false, duration: 100, delay: 0}
            });
            this.animationItems[tool].push({
                e: el,
				p: {opacity: 1},
                o: {
					duration: params.fadeDuration,
					delay: start,
					easing: this.getFPSLimitedSteps(params.fadeDuration, this.maxFadeFPS),
				}
            });
        },

        runChangeToolJawAnimation: function (params) {
            // console.log('CHANGE JAW');
            var tool = params.tool;
            var el = this.getElementForAnimation(params);
            var pos = this.getDrillPosition(params.tooth_id);
            var region = this.getToothRegion(params.tooth_id);
            var jaw = parseInt(region) < 3 ? 'upper' : 'lower';
            this.state[tool + 'FirstRegion'] = region;
            transform = this.getToolTransformations(region);
            jawChanged = true;


            this.animationItems[params.tool].push({
                e: el,
                p: {translateY: '+=100', opacity: 0},
                o: {
					duration: 500,
					queue: false,
					easing: this.getFPSLimitedSteps(500, this.maxMoveFPS),
				}
            });
            this.animationItems[tool].push({
                e: el,
                p: {rotateZ: transform.rotateZ, scaleX: transform.scaleX, scaleY: transform.scaleY, translateY: pos.y - 100, translateX: pos.x},
                o: {duration: 0}
            });
            this.animationItems[params.tool].push({
                e: el,
                p: {opacity: 1},
                o: {
					duration: 500,
					delay: 0,
					easing: this.getFPSLimitedSteps(500, this.maxFadeFPS),
				}
            });
            this.animationItems[params.tool].push({
                e: el,
                p: {translateY: '+=100'},
                o: {
					duration: 500,
					easing: this.getFPSLimitedSteps(500, this.maxMoveFPS),
				}
            });
        },

        runToolAnimation: function (params) {
            // console.log('runToolAnimation', params);
            var tool = params.tool;
            var start = params.start;
            var pos = this.getDrillPosition(params.tooth_id);
            var el = this.getElementForAnimation(params);
            var region = this.getToothRegion(params.tooth_id);

            if(parseInt(region) === 2 && parseInt(this.state[tool + 'FirstRegion']) === 1) pos.x += 600;
            if(parseInt(region) === 3 && parseInt(this.state[tool + 'FirstRegion']) === 4) pos.x += 600;

            // Move drill to the tooth
            this.animationItems[tool].push({
                e: el,
                p: {translateY: pos.y, translateX: pos.x},
                o: {
					duration: params.moveDuration,
					easing: this.getFPSLimitedSteps(params.moveDuration, this.maxMoveFPS),
				}
            });
            // Pause for drilling time
            this.animationItems[tool].push({
                e: el,
                p: { rotateZ: transform.rotateZ, scaleX: transform.scaleX, scaleY: transform.scaleY, translateY: pos.y, translateX: pos.x },
                o: {easing: 'ease-in-out', duration: params.moveDelay}
            });
        },

        runHideToolAnimation: function (params) {
            var el = this.getElementForAnimation(params);
            var translateY = (this.state[params.tool + 'FirstRegion'] > 2) ? '-=100' : '+=100';
            this.animationItems[params.tool].push({
                e: el,
                p: {translateY: translateY, opacity: 0},
                o: {
					duration: 500,
					queue: false,
					easing: this.getFPSLimitedSteps(params.moveDuration, this.maxFadeFPS),
				}
            });
        },

        getAngleOffsets: function(params) {
            var region = this.getToothRegion(params.tooth_id);
            var xOffset = 0;
            if (typeof (params.correct_angle) !== 'undefined' && params.correct_angle) {
                if (params.tooth_id % 10 > 2 && (region === 1 || region === 4)) xOffset = -20;
                if (params.tooth_id % 10 > 2 && (region === 2 || region === 3)) xOffset = 20;
            }
            var yOffset = 100;
            if (typeof (params.yOffset) !== 'undefined' && parseInt(params.yOffset) !== 0) yOffset = params.yOffset;
            if (region > 2) yOffset = 0 - yOffset;

            if (typeof (params.current_state) !== 'undefined') {
                if (typeof (this.stateConfig[params.current_state.state_pid]) !== 'undefined') {
                    var sc = this.stateConfig[params.current_state.state_pid];
                    for (var i in sc) {
                        if (params.current_state.part === sc[i].part) {
                            if (typeof (sc[i].offsetY) !== 'undefined') {
                                if (parseInt(params.tooth_id) > 30) yOffset += sc[i].offsetY;
                                else yOffset -= sc[i].offsetY;
                            }
                        }
                    }
                }
            }
            if (typeof (params.angle) === 'undefined') params.angle = 'vertical';
            if(params.angle === 'circular') {
                switch (params.tooth_id % 10) {
                    case 1:
                        var xOffset = 10;
                        var yOffset = 100;
                        break;
                    case 2:
                        var xOffset = 40;
                        var yOffset = 100;
                        break;
                    case 3:
                        var xOffset = 80;
                        var yOffset = 100;
                        break;
                    case 4:
                        var xOffset = 100;
                        var yOffset = 40;
                        break;
                    case 5:
                        var xOffset = 100;
                        var yOffset = 30;
                        break;
                    case 6:
                        var xOffset = 100;
                        var yOffset = 20;
                        break;
                    case 7:
                        var xOffset = 100;
                        var yOffset = 10;
                        break;
                    case 8:
                        var xOffset = 100;
                        var yOffset = 0;
                        break;
                }
                if (region == 2) {
                    xOffset = 0 - xOffset;
                }
                if (region == 3) {
                    xOffset = 0 - xOffset;
                    yOffset = 0 - yOffset;
                }
                if (region == 4) {
                    yOffset = 0 - yOffset;
                }
            }
            return ({xOffset: xOffset, yOffset: yOffset});
        },

        getToolTransformations: function(region) {
            if(region === 1) return { rotateZ: 0, scaleX: 1.001, scaleY: 1.001 };
            if(region === 2) return { rotateZ: 0, scaleX: -1, scaleY: 1.001 };
            if(region === 3) return { rotateZ: 180, scaleX: 1, scaleY: 1 };
            if(region === 4) return { rotateZ: 0, scaleX: 1.001, scaleY: -1 };
        },
		
		getFPSLimitedSteps: function(duration, maxFPS) {
			return [Math.floor((duration/1000) * maxFPS)];
		}
    }
})
;




