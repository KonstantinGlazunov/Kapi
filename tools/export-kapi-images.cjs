// Render all shipped whole-body images from the same rig as the live character.
// Start dist/ on KAPI_BASE_URL (default http://127.0.0.1:8765/) before running.
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
(async () => {
 const browser = await chromium.launch({headless:true,...(process.env.KAPI_CHROME?{executablePath:process.env.KAPI_CHROME}:{}),args:['--no-sandbox']});
 try {
  const page = await browser.newPage({serviceWorkers:'block'});
  await page.goto(process.env.KAPI_BASE_URL || 'http://127.0.0.1:8765/');
  const images = await page.evaluate(async () => {
   const animator = new window.CanvasKapiAnimator({});
   await Promise.all([...animator.images.values()].map(entry => entry.promise));
   animator.reducedMotion = false;
   const render = (canvas,state,elapsed) => {
    const context=canvas.getContext('2d');
    animator.drawRigPose({canvas,context},animator.pose(state,elapsed,'hop'),animator.limbPose(state,elapsed,'hop'),1,{state,elapsed,headAsset:animator.headAsset(state,'hop')});
   };
   const result=[];
   for (const [file,state,time] of [['assets/capybara.webp','idle',0],['assets/kapi-flag.webp','flag',600],['assets/kapi-party.webp','horn',700],['assets/kapi-dance.webp','dance',300],['assets/kapi-handshake.webp','levelUp',650]]) {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=700;render(canvas,state,time);
    result.push([file,canvas.toDataURL('image/webp',.95)]);
   }
   const sheet=document.createElement('canvas');sheet.width=2800;sheet.height=700;
   for (const [i,state] of ['idle','idleBlink','hey','idleLookRight'].entries()) {
    const frame=document.createElement('canvas');frame.width=frame.height=700;render(frame,state,450);
    sheet.getContext('2d').drawImage(frame,i*700,0);
   }
   result.push(['assets/kapi-welcome-sprite.webp',sheet.toDataURL('image/webp',.95)]);
   for (const size of [192,512]) {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
    const context=canvas.getContext('2d');context.fillStyle='#0f766e';context.fillRect(0,0,size,size);render(canvas,'idle',0);
    result.push([`icon-${size}.png`,canvas.toDataURL('image/png')]);
   }
   return result;
  });
  for (const [file,data] of images) {
   await fs.writeFile(path.join(__dirname,'../dist',file),Buffer.from(data.split(',')[1],'base64'));
   console.log('Rendered continuous-leg rig:',file);
  }
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
