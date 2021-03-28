"use strict";

// some globalz:
let THREEVIDEOTEXTURE = null;
let THREECAMERA = null;
let ISDETECTED = false;

let WOLFOBJ3D = null, MASKOBJ3D = null;
let WOLFMESH = null, FACEMESH = null;
let COLORFILTERCOEF = null;
let VIDEOMESH = null;

let MOONSPRITE = null, MOONHALO = null;

let isTransformed = false;
let ROTATIONX = 0;

let MIXER = null;

let PARTICLEGROUP = null, GROUP = null;

let isLoaded = false;



"use strict";

// some globalz:
let THREECAMERA = null;
let ISDETECTED = false;
let TONGUEMESH = null, NOSEMESH = null, EARMESH = null;
let DOGOBJ3D = null, FRAMEOBJ3D = null;


let ISOVERTHRESHOLD = false, ISUNDERTRESHOLD = true;

let ISLOADED = false;

let MIXER = null;
let ACTION = null;

let ISANIMATING = false;
let ISOPAQUE = false;
let ISTONGUEOUT = false;
let ISANIMATIONOVER = false;

let _flexParts = [];
let _videoGeometry = null;


"use strict";

//some globalz :
var THREECAMERA;
var MOUTHOPENINGMATERIALS = [];
var TIGERMOUTHHIDEMESH = null;
var PARTICLESOBJ3D, PARTICLES = [], PARTICLESHOTINDEX = 0, PARTICLEDIR;
var ISDETECTED = false;

// callback: launched if a face is detected or lost
function werewolf_detect_callback(isDetected) {
  if (isDetected) {
    console.log('INFO in detect_callback(): DETECTED');
  } else {
    console.log('INFO in detect_callback(): LOST');
  }
}

// build the 3D. called once when Jeeliz Face Filter is OK
function werewolf_init_threeScene(spec) {
  //addFrame();

  const threeStuffs = JeelizThreeHelper.init(spec, werewolf_detect_callback);
            
  // Add our wolf head model:
  const loadingManager = new THREE.LoadingManager();
  const headLoader = new THREE.JSONLoader(loadingManager);

  headLoader.load(
    '/face_filter/werewolf/models/werewolf/werewolf_not_animated.json',
    // './models/werewolf/Werewolf.fbx',
    (geometryHead) => {
      // GROUP = group;

      const matHead = new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('/face_filter/werewolf/models/werewolf/head_diffuse.png'),
        normalMap: new THREE.TextureLoader().load('/face_filter/werewolf/models/werewolf/head_normal.jpg'),
        alphaMap: new THREE.TextureLoader().load('/face_filter/werewolf/models/werewolf/head_alpha.jpg'),
        side: THREE.FrontSide,
        shininess: 10,
        transparent: true,
        morphTargets: true
      });

      const matFur = new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('/face_filter/werewolf/models/werewolf/fur_diffuse.jpg'),
        normalMap: new THREE.TextureLoader().load('/face_filter/werewolf/models/werewolf/fur_normal.png'),
        alphaMap: new THREE.TextureLoader().load('/face_filter/werewolf/models/werewolf/fur_alpha.jpg'),
        transparent: true,
        shininess: 20,
        opacity: 1,
        normalScale: new THREE.Vector2(2, 2),
        depthWrite: false
      });
      const matTeeth = new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('/face_filter/werewolf/models/werewolf/teeth_diffuse.jpg'),
        transparent: true,
        emissive: 0x070505,
        emissiveIntensity: 0,
        shininess: 0,
        reflectivity: 0,
        morphTargets: true
      });

      WOLFMESH = new THREE.Mesh(geometryHead, [matHead, matFur, matTeeth]);
      WOLFMESH.frustumCulled = false;
      WOLFMESH.renderOrder = 1000000;

      WOLFMESH.material[0].opacity = 0;
      WOLFMESH.material[1].opacity = 0;
      WOLFMESH.material[2].opacity = 0;

      WOLFOBJ3D.add(WOLFMESH);
      WOLFOBJ3D.scale.multiplyScalar(7);
      WOLFOBJ3D.position.y -= 1.2;
      WOLFOBJ3D.position.z -= 0.5;

      addDragEventListener(WOLFOBJ3D);

      threeStuffs.faceObject.add(WOLFOBJ3D);
      isLoaded = true;
    }
  );

  
  // CREATE THE MOON
  const moonGeometry = new THREE.PlaneGeometry(10, 10, 10);
  const moonMaterial = new THREE.SpriteMaterial({ //MT219: sprites are textured with specific material
    map: new THREE.TextureLoader().load('./images/moon.png'),
    transparent: true,
    depthTest: false
  });

  MOONSPRITE = new THREE.Sprite(moonMaterial); //MT219: the geometry of a sprite is always a 2D plane, so u don't need to specify it
  MOONSPRITE.position.set(1.5, 1.5, -5); //MT219: even if it is a sprite you should position it in 3D: a sprite is a 2D object in a 3D scene
  MOONSPRITE.scale.multiplyScalar(1.2);
  MOONSPRITE.renderOrder = -10000000;
  threeStuffs.scene.add(MOONSPRITE);

  // CREATE THE LIGHT COMING FROM THE MOON
  const pointlightMoon = new THREE.PointLight(0XFFD090, 0.5);
  pointlightMoon.position.set(1.5, 2.5, -2);
  threeStuffs.scene.add(pointlightMoon);

  // CREATE THE MOON GLOW EFFECT
  const moonGlowGeometry = new THREE.SphereGeometry(0.8,32, 32);
  THREEx.dilateGeometry(moonGlowGeometry, 0.15);


  const material = THREEx.createAtmosphereMaterial();
  material.opacity = 0.1;

  MOONHALO = new THREE.Mesh(moonGlowGeometry, material);
  MOONHALO.position.set(1.5, 1.5, -5);
  MOONHALO.scale.y = 0.7;
  MOONHALO.scale.x = 0.7;

  threeStuffs.scene.add(MOONHALO);
  // possible customisation of AtmosphereMaterial
  material.uniforms.glowColor.value = new THREE.Color(0XFFFFE0);
  material.uniforms.coeficient.value = 0.1;
  material.uniforms.power.value = 2;
  

  // CREATE AN AMBIENT LIGHT
  const ambient = new THREE.AmbientLight(0x888899, 1);
  threeStuffs.scene.add(ambient);


  // CREATE A SPOTLIGHT
  const dirLight = new THREE.DirectionalLight(0x998899, 1);
  dirLight.position.set(100, 100, 100);
  threeStuffs.scene.add(dirLight);

  // White directional light at half intensity shining from the top.
  const directionalLight = new THREE.DirectionalLight(new THREE.Color(0, 0.1, 0.2), 1);
  threeStuffs.scene.add(directionalLight);


  // init video texture with red
  THREEVIDEOTEXTURE = JeelizThreeHelper.get_threeVideoTexture();
  THREEVIDEOTEXTURE.needsUpdate = true;

  const videoColorFilter = new THREE.Vector3(0.05, 0.1, 0.15);
  COLORFILTERCOEF = 0.7;


  //CREATE THE VIDEO BACKGROUND
  const videoMaterial = new THREE.RawShaderMaterial({
    depthWrite: false,
    depthTest: false,
    vertexShader: "uniform mat2 videoTransformMat2;\n\
      attribute vec2 position;\n\
      varying vec2 vUV;\n\
      void main(void){\n\
        gl_Position=vec4(position, 0., 1.);\n\
        vUV = 0.5 + videoTransformMat2*position;\n\
      }",
    fragmentShader: "precision lowp float;\n\
      uniform sampler2D samplerVideo;\n\
      varying vec2 vUV;\n\
      void main(void){\n\
        gl_FragColor = texture2D(samplerVideo, vUV);\n\
      }",
     uniforms: {
      samplerVideo: { value: THREEVIDEOTEXTURE },
      colorFilter: { value: videoColorFilter },
      colorFilterCoef: { value: COLORFILTERCOEF },
      videoTransformMat2: {value: spec.videoTransformMat2}
     }
  });

  threeStuffs.videoMesh.material = videoMaterial;
  threeStuffs.videoMesh.material.needsUpdate = true;

  // CREATE THE CAMERA
  THREECAMERA = JeelizThreeHelper.create_camera();
} // end init_threeScene()

function animateWolf (object3D) {
  object3D.visible = true
  new TWEEN.Tween(object3D.material[1])
    .to({ opacity: 1 }, 1000)
    .start();
  new TWEEN.Tween(object3D.material[2])
    .to({ opacity: 1 }, 1000)
    .start();
  new TWEEN.Tween(object3D.material[0])
    .to({ opacity: 1 }, 1000)
    .start();
}

function addFrame() {
  const frame = document.getElementById('frame');
  const ctx = frame.getContext('2d');
  const img = new Image(600, 600);
  img.onload = () => {
    ctx.drawImage(img, 0, 0, 600, 600)
  }
  img.src = '/face_filter/werewolf/images/frame.png'
}

// entry point - launched by body.onload():
function werewolf_faceFilter(){
  WOLFOBJ3D = new THREE.Object3D();
  MASKOBJ3D = new THREE.Object3D();

  JeelizResizer.size_canvas({
    canvasId: 'localCanvas',
    callback: function(isError, bestVideoSettings){
      werewolf_init_faceFilter(bestVideoSettings);
    }
  })
}

function werewolf_init_faceFilter(videoSettings){
  JEEFACEFILTERAPI.init({
    canvasId: 'localCanvas',
    NNCPath: '/face_filter/neuralNets/', // root of NN_DEFAULT.json file
    videoSettings: videoSettings,
    callbackReady: function (errCode, spec) {
      if (errCode) {
        console.log('AN ERROR HAPPENS. SORRY BRO :( . ERR =', errCode);
        return;
      }

      console.log('INFO: JEEFACEFILTERAPI IS READY');
      werewolf_init_threeScene(spec);
    },

    // called at each render iteration (drawing loop)
    callbackTrack: function (detectState) {
      ISDETECTED = JeelizThreeHelper.get_isDetected();

      if (ISDETECTED && detectState.expressions[0] >= 0.9 && !isTransformed && isLoaded) {

        isTransformed = true;
        animateWolf(WOLFMESH);
      }
      
      TWEEN.update();
      if (MIXER) {
        MIXER.update(0.08);
      }

      JeelizThreeHelper.render(detectState, THREECAMERA);
    }
  }); // end JEEFACEFILTERAPI.init call
}













//callback : launched if a face is detected or lost
function tiger_detect_callback(isDetected){
  if (isDetected){
    console.log('INFO in detect_callback(): DETECTED');
  } else {
    console.log('INFO in detect_callback(): LOST');
  }
}

function generateSprite() { // generate a canvas2D used as texture for particle sprite material:
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,0.5)');
  gradient.addColorStop(0.2, 'rgba(0,255,255,0.5)');
  gradient.addColorStop(0.4, 'rgba(0,0,64,0.5)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

function initParticle( particle, delay, direction) { // init 1 particle position and movement
  if (particle.visible) return; // particle is already in move

  // tween position:
  particle.position.set(0.5*(Math.random()-0.5),-0.35+0.5*(Math.random()-0.5),0.5);
  particle.visible = true;
  
  new TWEEN.Tween( particle.position )
    .to( {x: direction.x*10,
        y: direction.y*10,
        z: direction.z*10 }, delay)
    .start().onComplete(function(){
      particle.visible = false;
    });

  // tween scale:
  particle.scale.x = particle.scale.y = Math.random() * 0.6
  new TWEEN.Tween( particle.scale )
    .to( {x: 0.8, y: 0.8}, delay)
    .start();
}

function build_customMaskMaterial(textureURL){
  let vertexShaderSource = THREE.ShaderLib.lambert.vertexShader;
  vertexShaderSource = vertexShaderSource.replace('void main() {', 'varying vec3 vPos; uniform float mouthOpening; void main(){ vPos=position;');
  let glslSource = [
    'float isLowerJaw = step(position.y+position.z*0.2, 0.0);',
    //'transformed+=vec3(0., -0.1, 0.)*isLowerJaw*mouthOpening;'
    'float theta = isLowerJaw * mouthOpening * 3.14/12.0;',
    'transformed.yz = mat2(cos(theta), sin(theta),-sin(theta), cos(theta))*transformed.yz;'

  ].join('\n');
  vertexShaderSource = vertexShaderSource.replace('#include <begin_vertex>', '#include <begin_vertex>\n'+glslSource);

  let fragmentShaderSource = THREE.ShaderLib.lambert.fragmentShader;
  glslSource = [
    'float alphaMask = 1.0;', // initialize the opacity coefficient (1.0->fully opaque)
    'vec2 pointToEyeL = vPos.xy - vec2(0.25,0.15);',  // position of left eye
    'vec2 pointToEyeR = vPos.xy - vec2(-0.25,0.15);', // position of right eye
    'alphaMask *= smoothstep(0.05, 0.2, length(vec2(0.6,1.)*pointToEyeL));', // left eye fading
    'alphaMask *= smoothstep(0.05, 0.2, length(vec2(0.6,1.)*pointToEyeR));', // left eye fading
    'alphaMask = max(alphaMask, smoothstep(0.65, 0.75, vPos.z));', // force the nose opaque
    'float isDark = step(dot(texelColor.rgb, vec3(1.,1.,1.)), 1.0);',
    'alphaMask = mix(alphaMask, 1., isDark);',// only make transparent light parts'
    'vec2 uvVp = gl_FragCoord.xy/resolution;', // 2D position in the viewport (between 0 and 1)
    'float scale = 0.03 / vPos.z;', // scale of the distorsion in 2D
    'vec2 uvMove = vec2(-sign(vPos.x), -1.5)*scale;', // video distorsion. the sign() distinguish between left and right face side
    'vec4 videoColor = texture2D(samplerVideo, uvVp+uvMove);',
    'float videoColorGS = dot(vec3(0.299, 0.587, 0.114),videoColor.rgb);', // grayscale value of the video pixel
    'videoColor.rgb = videoColorGS*vec3(1.5,0.6,0.0);', // color video with orange
    'gl_FragColor = mix(videoColor, gl_FragColor, alphaMask);' // mix video background with mask color
  ].join('\n');
  fragmentShaderSource = fragmentShaderSource.replace('void main() {', 'varying vec3 vPos; uniform sampler2D samplerVideo; uniform vec2 resolution; void main(){');
  fragmentShaderSource = fragmentShaderSource.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n'+glslSource);
    
  const mat = new THREE.ShaderMaterial({
    vertexShader: vertexShaderSource,
    fragmentShader: fragmentShaderSource,
    uniforms: Object.assign({
      samplerVideo: {value: JeelizThreeHelper.get_threeVideoTexture()},
      resolution: {value: new THREE.Vector2(THREESTUFF.renderer.getSize().width, THREESTUFF.renderer.getSize().height)},
      mouthOpening: {value: 0}
    }, THREE.ShaderLib.lambert.uniforms),
    lights: true,
    transparent: true
  });
  const texture = new THREE.TextureLoader().load(textureURL);
  mat.uniforms.map = {value: texture};
  mat.map = texture;

  MOUTHOPENINGMATERIALS.push(mat);
  return mat;
}


// build the 3D. called once when Jeeliz Face Filter is OK:
function tiger_init_threeScene(spec){
  // INIT THE THREE.JS context
  const threeStuffs = JeelizThreeHelper.init(spec, tiger_detect_callback);
  window.THREESTUFF = threeStuffs; // to debug in the console

  // LOAD THE TIGGER MESH
  const tigerMaskLoader = new THREE.BufferGeometryLoader();
  tigerMaskLoader.load('/face_filter/tiger/TigerHead.json', function(tigerMaskGeom){
    const tigerFaceSkinMat = build_customMaskMaterial('/face_filter/tiger/headTexture2.png');
    const tigerEyesMat = build_customMaskMaterial('/face_filter/tiger/white.png');

    const whiskersMat = new THREE.MeshLambertMaterial({
      color: 0xffffff
    });
    const insideEarsMat = new THREE.MeshBasicMaterial({
      color: 0x331100
    });
    const tigerMaskMesh = new THREE.Mesh(tigerMaskGeom, [
      whiskersMat, tigerEyesMat, tigerFaceSkinMat, insideEarsMat
      ]);
    tigerMaskMesh.scale.set(2,3,2);
    tigerMaskMesh.position.set(0., 0.2, -0.48);

    // small black quad to hide inside the mouth
    // (visible only if the user opens the mouth)
    TIGERMOUTHHIDEMESH = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(0.5,0.6),
      new THREE.MeshBasicMaterial({color: 0x000000})
    );
    TIGERMOUTHHIDEMESH.position.set(0,-0.35,0.5);
    threeStuffs.faceObject.add(tigerMaskMesh, TIGERMOUTHHIDEMESH);
  });

  //BUILD PARTICLES :
  PARTICLESOBJ3D = new THREE.Object3D();
  const particleMaterial = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(generateSprite()),
    blending: THREE.AdditiveBlending
  });
  for ( let i = 0; i <= 200; ++i ) { // we work with a fixed number of particle to avoir memory dynamic allowation
    const particle = new THREE.Sprite(particleMaterial);
    particle.scale.multiplyScalar(0);
    particle.visible = false;
    PARTICLES.push(particle);
    PARTICLESOBJ3D.add(particle);
  }
  threeStuffs.faceObject.add(PARTICLESOBJ3D);
  PARTICLEDIR = new THREE.Vector3();

  //AND THERE WAS LIGHT
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  const dirLight = new THREE.DirectionalLight(0xff8833, 2);
  dirLight.position.set(0,0.5,1);

  threeStuffs.scene.add(ambientLight, dirLight);

  //CREATE THE CAMERA
  THREECAMERA = JeelizThreeHelper.create_camera();
} //end init_threeScene()

// Entry point, launched by body.onload():
function tiger_faceFilter(){
  JEEFACEFILTERAPI.init({
    canvasId: 'localCanvas',
    NNCPath: 'face_filter/neuralNets/', // path of NN_DEFAULT.json file
    callbackReady: function(errCode, spec){
      if (errCode){
        console.log('AN ERROR HAPPENS. SORRY BRO :( . ERR =', errCode);
        return;
      }

      console.log('INFO: JEEFACEFILTERAPI IS READY');
      tiger_init_threeScene(spec);
    }, //end callbackReady()

    // called at each render iteration (drawing loop):
    callbackTrack: function(detectState){
      ISDETECTED = JeelizThreeHelper.get_isDetected();

      if (ISDETECTED) {
        // update mouth opening:
        let mouthOpening = (detectState.expressions[0]-0.2) * 5.0;
        mouthOpening = Math.min(Math.max(mouthOpening, 0), 1);
        if (mouthOpening > 0.5){
          const theta = Math.random() * 6.28;
          PARTICLEDIR.set(0.5*Math.cos(theta),0.5*Math.sin(theta),1).applyEuler(THREESTUFF.faceObject.rotation);
          initParticle(PARTICLES[PARTICLESHOTINDEX], 2000+40*Math.random(), PARTICLEDIR);
          PARTICLESHOTINDEX = (PARTICLESHOTINDEX+1) % PARTICLES.length;
        }

        MOUTHOPENINGMATERIALS.forEach(function(mat){
          mat.uniforms.mouthOpening.value=mouthOpening;
        });
        if(TIGERMOUTHHIDEMESH){
          TIGERMOUTHHIDEMESH.scale.setY(1. + mouthOpening * 0.4);
        }
      }

      TWEEN.update();

      JeelizThreeHelper.render(detectState, THREECAMERA);
    } //end callbackTrack()
  }); //end JEEFACEFILTERAPI.init call
} //end main()

















// callback: launched if a face is detected or lost
function dog_detect_callback(isDetected) {
  if (isDetected) {
    console.log('INFO in detect_callback(): DETECTED');
  } else {
    console.log('INFO in detect_callback(): LOST');
  }
}

function create_mat2d(threeTexture, isTransparent){ // MT216: we put the creation of the video material in a func because we will also use it for the frame
  return new THREE.RawShaderMaterial({
    depthWrite: false,
    depthTest: false,
    transparent: isTransparent,
    vertexShader: "attribute vec2 position;\n\
      varying vec2 vUV;\n\
      void main(void){\n\
        gl_Position = vec4(position, 0., 1.);\n\
        vUV = 0.5 + 0.5 * position;\n\
      }",
    fragmentShader: "precision lowp float;\n\
      uniform sampler2D samplerVideo;\n\
      varying vec2 vUV;\n\
      void main(void){\n\
        gl_FragColor = texture2D(samplerVideo, vUV);\n\
      }",
     uniforms:{
      samplerVideo: { value: threeTexture }
     }
  });
}

function applyFilter() {
  let canvas;
  try {
    canvas = fx.canvas();
  } catch (e) {
    alert('Ow no! WebGL isn\'t supported...')
    return
  }
}

// build the 3D. called once when Jeeliz Face Filter is OK
function dog_init_threeScene(spec) {
  // INIT THE THREE.JS context
  const threeStuffs = JeelizThreeHelper.init(spec, dog_detect_callback);
  _videoGeometry =  threeStuffs.videoMesh.geometry;

  // CREATE OUR DOG EARS:

  // let's begin by creating a loading manager that will allow us to
  // have more control over the three parts of our dog model
  const loadingManager = new THREE.LoadingManager();

  const loaderEars = new THREE.BufferGeometryLoader(loadingManager);

  loaderEars.load(
    '/face_filter/dog_face/models/dog/dog_ears.json',
    function (geometry) {
      const mat = new THREE.FlexMaterial({
        map: new THREE.TextureLoader().load('/face_filter/dog_face/models/dog/texture_ears.jpg'),
        flexMap: new THREE.TextureLoader().load('/face_filter/dog_face/models/dog/flex_ears_256.jpg'),
        alphaMap: new THREE.TextureLoader().load('/face_filter/dog_face/models/dog/alpha_ears_256.jpg'),
        transparent: true,
        opacity: 1,
        bumpMap: new THREE.TextureLoader().load('/face_filter/dog_face/models/dog/normal_ears.jpg'),
        bumpScale: 0.0075,
        shininess: 1.5,
        specular: 0xffffff,
      });

      EARMESH = new THREE.Mesh(geometry, mat);
      EARMESH.scale.multiplyScalar(0.025);
      EARMESH.position.setY(-0.3);
      EARMESH.frustumCulled = false;
      EARMESH.renderOrder = 10000;
      EARMESH.material.opacity.value = 1;
    }
  );
  // CREATE OUR DOG NOSE
  const loaderNose = new THREE.BufferGeometryLoader(loadingManager);

  loaderNose.load(
    '/face_filter/dog_face/models/dog/dog_nose.json',
    function (geometry) {
      const mat = new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('/face_filter/dog_face/models/dog/texture_nose.jpg'),
        shininess: 1.5,
        specular: 0xffffff,
        bumpMap: new THREE.TextureLoader().load('/face_filter/dog_face/models/dog/normal_nose.jpg'),
        bumpScale: 0.005
      });

      NOSEMESH = new THREE.Mesh(geometry, mat);
      NOSEMESH.scale.multiplyScalar(0.018);
      NOSEMESH.position.setY(-0.05);
      NOSEMESH.position.setZ(0.15);
      NOSEMESH.frustumCulled = false;
      NOSEMESH.renderOrder = 10000;
    }
  );

  // CREATE OUR DOG TONGUE
  const loaderTongue = new THREE.JSONLoader(loadingManager);

  loaderTongue.load(
    '/face_filter/dog_face/models/dog/dog_tongue.json',
    function (geometry) {
      geometry.computeMorphNormals();
      const mat = new THREE.FlexMaterial({
        map: new THREE.TextureLoader().load('/face_filter/dog_face/models/dog/dog_tongue.jpg'),
        flexMap: new THREE.TextureLoader().load('/face_filter/dog_face/models/dog/flex_tongue_256.png'),
        alphaMap: new THREE.TextureLoader().load('/face_filter/dog_face/models/dog/tongue_alpha_256.jpg'),
        transparent: true,
        morphTargets: true,
        opacity: 1
      });

      TONGUEMESH = new THREE.Mesh(geometry, mat);
      TONGUEMESH.material.opacity.value = 0;

      TONGUEMESH.scale.multiplyScalar(2);
      TONGUEMESH.position.setY(-0.28);

      TONGUEMESH.frustumCulled = false;
      TONGUEMESH.visible = false;

      if (!MIXER) {
        // the mixer is declared globally so we can use it in the THREE renderer
        MIXER = new THREE.AnimationMixer(TONGUEMESH);
        const clips = TONGUEMESH.geometry.animations;

        const clip = clips[0];

        ACTION = MIXER.clipAction(clip);
        ACTION.noLoop = true;

        ACTION.play();
      }
    }
  );

  loadingManager.onLoad = () => {
    DOGOBJ3D.add(EARMESH);
    DOGOBJ3D.add(NOSEMESH);
    DOGOBJ3D.add(TONGUEMESH);

    addDragEventListener(DOGOBJ3D);

    threeStuffs.faceObject.add(DOGOBJ3D);

    ISLOADED = true;
  }

  // CREATE AN AMBIENT LIGHT
  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  threeStuffs.scene.add(ambient);

  // CREAT A DIRECTIONALLIGHT
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight.position.set(100, 1000, 1000);
  threeStuffs.scene.add(dirLight);

  // CREATE THE CAMERA
  THREECAMERA = JeelizThreeHelper.create_camera();
 
  threeStuffs.scene.add(FRAMEOBJ3D);

  // Add filter
  applyFilter();
} // end init_threeScene()

function animateTongue (mesh, isReverse) {
  mesh.visible = true;

  if (isReverse) {
    ACTION.timescale = -1;
    ACTION.paused = false;

    setTimeout(() => {
      ACTION.paused = true;

      ISOPAQUE = false;
      ISTONGUEOUT = false;
      ISANIMATING = false;
      ISANIMATIONOVER = true;


      new TWEEN.Tween(mesh.material.opacity)
        .to({ value: 0 }, 150)
        .start();
    }, 150);
  } else {
    ACTION.timescale = 1;
    ACTION.reset();
    ACTION.paused = false;

    new TWEEN.Tween(mesh.material.opacity)
      .to({ value: 1 }, 100)
      .onComplete(() => {
        ISOPAQUE = true;
        setTimeout(() => {
          ACTION.paused = true;
          ISANIMATING = false;
          ISTONGUEOUT = true;
          ISANIMATIONOVER = true;
        }, 150);
      })
      .start();
  }
}

// Entry point: launched by body.onload()
function dog_faceFilter(){
  DOGOBJ3D = new THREE.Object3D();
  FRAMEOBJ3D = new THREE.Object3D();

  JeelizResizer.size_canvas({
    canvasId: 'localCanvas',
    callback: function(isError, bestVideoSettings){
      dog_init_faceFilter(bestVideoSettings);
    }
  });
}

function dog_init_faceFilter(videoSettings){
  JEEFACEFILTERAPI.init({
    canvasId: 'localCanvas',
    NNCPath: '/face_filter/neuralNets/', // root of NN_DEFAULT.json file
    videoSettings: videoSettings,
    callbackReady: function (errCode, spec) {
      if (errCode) {
        console.log('AN ERROR HAPPENS. SORRY BRO :( . ERR =', errCode);
        return;
      }

      console.log('INFO: JEEFACEFILTERAPI IS READY');
      dog_init_threeScene(spec);
    }, // end callbackReady()

    // called at each render iteration (drawing loop)
    callbackTrack: function (detectState) {
      ISDETECTED = JeelizThreeHelper.get_isDetected();

      if (ISDETECTED) {
        const _quat = new THREE.Quaternion();
        const _eul = new THREE.Euler();
        _eul.setFromQuaternion(_quat);

        // flex ears material:
        if (EARMESH && EARMESH.material.set_amortized){
          EARMESH.material.set_amortized(
            EARMESH.getWorldPosition(new THREE.Vector3(0,0,0)),
            EARMESH.getWorldScale(new THREE.Vector3(0,0,0)),
            EARMESH.getWorldQuaternion(_eul),
            false,
            0.1
          );
        }

        if (TONGUEMESH && TONGUEMESH.material.set_amortized){
          TONGUEMESH.material.set_amortized(
            TONGUEMESH.getWorldPosition(new THREE.Vector3(0,0,0)),
            TONGUEMESH.getWorldScale(new THREE.Vector3(0,0,0)),
            TONGUEMESH.getWorldQuaternion(_eul),
            false,
            0.3
          );
        }

        if (detectState.expressions[0] >= 0.85 && !ISOVERTHRESHOLD) {
          ISOVERTHRESHOLD = true;
          ISUNDERTRESHOLD = false;
          ISANIMATIONOVER = false;
        }
        if (detectState.expressions[0] <= 0.1 && !ISUNDERTRESHOLD) {
          ISOVERTHRESHOLD = false;
          ISUNDERTRESHOLD = true;
          ISANIMATIONOVER = false;
        }

        if (ISLOADED && ISOVERTHRESHOLD && !ISANIMATING && !ISANIMATIONOVER) {
          if (!ISTONGUEOUT) {
            ISANIMATING = true;
            animateTongue(TONGUEMESH);
          } else {
            ISANIMATING = true;
            animateTongue(TONGUEMESH, true);
          }
        }
      }

      TWEEN.update();

      // Update the mixer on each frame:
      if (ISOPAQUE) {
        MIXER.update(0.16);
      }

      JeelizThreeHelper.render(detectState, THREECAMERA);
    } // end callbackTrack()
  }); // end JEEFACEFILTERAPI.init call
}


