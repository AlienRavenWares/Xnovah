'use client';
import {useEffect,useRef,useState} from 'react';

export default function VideoPreview(){
 const canvas=useRef<HTMLCanvasElement>(null);
 const [playing,setPlaying]=useState(true);
 const [time,setTime]=useState(0);
 const [exporting,setExporting]=useState(false);
 const [downloadReady,setDownloadReady]=useState(false);
 const recorderRef=useRef<MediaRecorder|null>(null);
 useEffect(()=>{
  const c=canvas.current!;const ctx=c.getContext('2d')!;
  let raf=0,origin=performance.now(),w=0,h=0,dpr=1;
  const stars=Array.from({length:620},(_,i)=>({a:i*2.39996,r:Math.sqrt((i+.5)/620),p:i*17.83,s:.3+(i%7)/7}));
  function resize(){dpr=Math.min(window.devicePixelRatio||1,2);w=c.clientWidth;h=c.clientHeight;c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
  function textLine(label:string,y:number,font:number,alpha:number,spacing:number=0){
   ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,alpha));ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f8f4ff';ctx.font='700 '+font+'px Arial, sans-serif';ctx.shadowBlur=18;ctx.shadowColor='#8c53e7';
   if(spacing){let letters=label.split('');let total=letters.length*spacing;letters.forEach((letter,i)=>ctx.fillText(letter,w/2-total/2+i*spacing,y));}
   else ctx.fillText(label,w/2,y);ctx.restore();
  }
  function frame(now:number){
   const t=((now-origin)/1000)%24;setTime(Math.floor(t));
   ctx.fillStyle='#010103';ctx.fillRect(0,0,w,h);
   const cx=w/2,cy=h/2,u=Math.min(w,h); const ease=(x:number)=>{const v=Math.max(0,Math.min(1,x));return v*v*(3-2*v)}; const pulse=ease((t-5.6)/1.2)*(1-ease((t-7.2)/1.6));
   // Virtual cinema camera: deliberate dolly-in, orbital drift, parallax pan and pull-back.
   // The world moves independently of the typography and playback controls.
   const dolly=1+.23*ease((t-1)/7)-.17*ease((t-13)/8);
   const panX=u*(.075*Math.sin(t*.28)+.028*Math.sin(t*.73));
   const panY=u*(.035*Math.cos(t*.24)-.024*Math.sin(t*.53));
   const roll=.026*Math.sin(t*.19);
   ctx.save();ctx.translate(cx+panX,cy+panY);ctx.rotate(roll);ctx.scale(dolly,dolly);ctx.translate(-cx,-cy);
   const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,u*.64);
   glow.addColorStop(0,'rgba(62,22,100,0.30)');glow.addColorStop(.45,'rgba(20,7,38,0.09)');glow.addColorStop(1,'rgba(0,0,0,0)');
   ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
   stars.forEach((s,i)=>{
    const zoom=1+1.9*ease((t-3)/4)+.55*ease((t-16)/4); const angle=s.a+t*.018,dist=s.r*u*(.15+.68*((t*.035+s.p)%1))*zoom;
    const x=cx+Math.cos(angle)*dist*1.6,y=cy+Math.sin(angle)*dist*.84;
    const alpha=.14+.55*Math.abs(Math.sin(t*.45+s.p));
    ctx.beginPath();ctx.arc(x,y,Math.max(.35,s.s*1.3),0,Math.PI*2);ctx.fillStyle='rgba(195,154,255,'+alpha+')';ctx.fill();if(i%19===0){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-Math.cos(angle)*Math.min(35,zoom*13),y-Math.sin(angle)*Math.min(35,zoom*13));ctx.strokeStyle='rgba(170,105,255,'+(alpha*.32)+')';ctx.lineWidth=.7;ctx.stroke();}
   });
   // Architectural orbital curves, drawn with restrained light and depth.
   const orbitAlpha=t<3?Math.max(0,(t-1)/3):t>20?Math.max(0,(24-t)/3):.48;
   for(let j=0;j<5;j++){
    ctx.save();ctx.translate(cx,cy);ctx.rotate(t*.065+j*Math.PI/5);
    ctx.scale(1,.43+j*.06);ctx.beginPath();
    ctx.ellipse(0,0,u*(.23+j*.047),u*(.23+j*.047),0,0,Math.PI*2);
    ctx.strokeStyle='rgba(158,89,236,'+(orbitAlpha*(.16+j*.06))+')';
    ctx.lineWidth=.7+j*.13;ctx.stroke();ctx.restore();
   }
   // Animated light arcs sweep through the brand emblem.
   const reveal=Math.min(1,Math.max(0,(t-1.5)/2));
   const outro=Math.min(1,Math.max(0,(24-t)/2));
   const emblemAlpha=reveal*outro*(t>9&&t<15?.18:1);
   const radius=u*(.085+.005*Math.sin(t*1.4))*(1+.45*pulse);
   ctx.save();ctx.translate(cx,cy-(t>13?u*.055:0));ctx.globalAlpha=emblemAlpha;
   ctx.shadowBlur=50;ctx.shadowColor='#9348f0';
   ctx.strokeStyle='#a16bfb';ctx.lineWidth=Math.max(2,u*.006);
   ctx.beginPath();ctx.arc(0,0,radius*1.36,-Math.PI*.5,-Math.PI*.5+Math.PI*2*Math.min(1,t/4));ctx.stroke();
   ctx.shadowBlur=22+80*pulse;ctx.lineWidth=u*.017;ctx.lineCap='square';ctx.strokeStyle='#eee2ff';
   ctx.beginPath();ctx.moveTo(-radius*.46,-radius*.57);ctx.lineTo(radius*.46,radius*.57);ctx.moveTo(radius*.46,-radius*.57);ctx.lineTo(-radius*.46,radius*.57);ctx.stroke();ctx.restore();
   // Cinematic shockwave and anamorphic horizontal flare at the reveal.
   if(t>5.4&&t<9.1){const k=ease((t-5.4)/2.8),rad=u*(.08+1.1*k);ctx.save();ctx.globalAlpha=(1-k)*.68;ctx.strokeStyle='#bb8aff';ctx.shadowBlur=32;ctx.shadowColor='#a462ff';ctx.lineWidth=3*(1-k)+.5;ctx.beginPath();ctx.arc(cx,cy,rad,0,Math.PI*2);ctx.stroke();ctx.restore();}
   const flare=pulse*.8+.1*Math.max(0,Math.sin(t*1.1));
   if(flare>.1){const beam=ctx.createLinearGradient(0,cy,w,cy);beam.addColorStop(0,'rgba(80,20,140,0)');beam.addColorStop(.5,'rgba(192,133,255,'+(flare*.42)+')');beam.addColorStop(1,'rgba(80,20,140,0)');ctx.fillStyle=beam;ctx.fillRect(0,cy-1.3,w,2.6);}
   ctx.restore(); // Lock titles and frame to the screen after the camera moves through the galaxy.
   // Thin cinematic framing lines and kinetic typography.
   ctx.save();ctx.strokeStyle='rgba(171,123,234,.25)';ctx.lineWidth=1;
   const margin=w*.07;ctx.beginPath();ctx.moveTo(margin,h*.12);ctx.lineTo(margin+Math.min(85,w*.12),h*.12);ctx.moveTo(w-margin-Math.min(85,w*.12),h*.88);ctx.lineTo(w-margin,h*.88);ctx.stroke();ctx.restore();
   const a=(start:number,end:number)=>Math.min(1,Math.max(0,(t-start)/.7))*Math.min(1,Math.max(0,(end-t)/.7));
   if(t>=3.5&&t<9.8){textLine('X N O V A H',h*.76,Math.max(20,Math.min(52,w*.058)),a(3.5,9.8));textLine('IMAGINE  /  CREATE  /  BUILD',h*.84,Math.max(9,Math.min(15,w*.016)),a(4.4,9.8)*.7);}
   if(t>=9.4&&t<16.8){textLine('ONE UNIVERSE',h*.47,Math.max(22,Math.min(70,w*.075)),a(9.4,16.8));textLine('INFINITE POSSIBILITIES',h*.57,Math.max(12,Math.min(30,w*.034)),a(10.1,16.8)*.8);}
   if(t>=16.2){textLine('X N O V A H',h*.73,Math.max(22,Math.min(56,w*.061)),a(16.2,24));textLine('THE FUTURE OF CREATION',h*.82,Math.max(10,Math.min(18,w*.019)),a(17,24)*.78);}
   raf=requestAnimationFrame(frame);
  }
  resize();window.addEventListener('resize',resize);
  if(playing)raf=requestAnimationFrame(frame);
  return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);};
 },[playing]);
 async function downloadAnimation(){
  const el=canvas.current;
  if(!el||exporting||typeof MediaRecorder==='undefined'||!el.captureStream){alert('Video recording is not supported in this browser. Try Chrome or Edge.');return;}
  const mime=['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
  if(!mime){alert('This browser does not support recording this animation.');return;}
  const stream=el.captureStream(30);
  const parts:BlobPart[]=[];
  const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:5000000});
  recorderRef.current=recorder;
  recorder.ondataavailable=(e:BlobEvent)=>{if(e.data.size)parts.push(e.data)};
  recorder.onstop=()=>{
   const blob=new Blob(parts,{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='Xnovah_Cinematic_V4.'+(mime.includes('mp4')?'mp4':'webm');document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),15000);stream.getTracks().forEach(track=>track.stop());setExporting(false);setDownloadReady(true);
  };
  setPlaying(false);
  await new Promise(resolve=>setTimeout(resolve,100));
  setPlaying(true);setExporting(true);setDownloadReady(false);
  recorder.start();
  setTimeout(()=>{if(recorder.state==='recording')recorder.stop()},24000);
 }
 return <main style={{minHeight:'100vh',background:'#000',color:'#fff',fontFamily:'Arial,Helvetica,sans-serif',padding:'clamp(18px,4vw,48px)'}}>
 <div style={{maxWidth:1200,margin:'auto'}}>
 <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:40}}>
 <a href="/" style={{color:'#fff',fontWeight:800,fontSize:22,letterSpacing:5,textDecoration:'none'}}>XNOVAH</a>
 <a href="/" style={{color:'#bba6d6',textDecoration:'none',fontSize:13}}>← Back to website</a></header>
 <div style={{fontSize:11,letterSpacing:4,color:'#a16bfb',fontWeight:700}}>BRAND MOTION STUDY / 001</div>
 <h1 style={{fontSize:'clamp(30px,5vw,58px)',letterSpacing:-2,margin:'12px 0 26px',fontWeight:700}}>Beyond the imaginable.</h1>
 <div style={{position:'relative',aspectRatio:'16 / 9',background:'#000',overflow:'hidden',borderRadius:14,border:'1px solid #27202f',boxShadow:'0 30px 100px rgba(55,20,91,.18)'}}>
 <canvas ref={canvas} style={{width:'100%',height:'100%',display:'block'}}/>
 <div style={{position:'absolute',left:20,right:20,bottom:17,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
 <button onClick={()=>setPlaying(!playing)} style={{border:'1px solid #a16bfb',background:'rgba(10,5,18,.85)',color:'#fff',borderRadius:30,padding:'10px 20px',fontWeight:700,cursor:'pointer'}}>{playing?'Ⅱ Pause':'▶ Play'}</button>
 <button disabled={exporting} onClick={downloadAnimation} style={{border:'1px solid #a16bfb',background:'#6c36ad',color:'#fff',borderRadius:30,padding:'10px 16px',fontWeight:700,cursor:exporting?'wait':'pointer'}}>{exporting?'Recording 24s…':'↓ Download video'}</button><span style={{fontSize:12,letterSpacing:1,color:'#c7b4df'}}>MOTION GRAPHICS · {String(time).padStart(2,'0')} / 24s</span></div></div>
 <p style={{color:'#a99bb8',lineHeight:1.7,fontSize:14,maxWidth:750,marginTop:24}}>A cinematic Xnovah identity film with a moving virtual camera: dolly-in, orbital drift, parallax panning and pull-back, plus dimensional star travel, luminous shockwaves, orbital geometry, anamorphic light sweeps, kinetic typography and a dramatic logo reveal. Use Download video to record the 24-second animation in your browser. The format is MP4 when supported, otherwise WebM. The download starts when recording finishes.</p>
 </div></main>;
}
