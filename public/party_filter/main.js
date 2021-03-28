function birthdayParty(){
  let CVD = null; // return of Canvas2DDisplay
  let hat_img = new Image()
  hat_img.src = "./party_filter/images/partyhat.png"
  let cake_img = new Image()
  cake_img.src = "./party_filter/images/birthdaycake.png"

  JEELIZFACEFILTER2D.init({
    canvasId: 'partyCanvas',
    NNCPath: '/face_filter/neuralNets/', // root of NN_DEFAULT.json file
    callbackReady: function(errCode, spec){
      if (errCode){
        console.log('AN ERROR HAPPENS. SORRY BRO :( . ERR =', errCode);
        return;
      }

      console.log('INFO: JEEFACEFILTERAPI IS READY');
      CVD = JeelizCanvas2DHelper(spec);
    },

    // called at each render iteration (drawing loop):
    callbackTrack: function(detectState){
      if (detectState.detected > 0.8){
        // draw a border around the face:
        const faceCoo = CVD.getCoordinates(detectState);
        CVD.ctx.clearRect(0, 0, CVD.canvas.width, CVD.canvas.height);
        CVD.ctx.drawImage(hat_img, faceCoo.x, faceCoo.y, faceCoo.w*0.8, faceCoo.h);
        CVD.ctx.drawImage(cake_img, canvas.width*0.5-75, canvas.height*0.001, 150, 150);
        CVD.update_canvasTexture();
      }
      
      CVD.draw();
      
    }
  }); //end JEEFACEFILTERAPI.init call
} //end main()