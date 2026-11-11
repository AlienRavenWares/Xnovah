import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
export const maxDuration=60;
const reply=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin');const host=req.headers.get('host')||'';
 if(origin){try{if(new URL(origin).host!==host)return reply('Origin not allowed.',403)}catch{return reply('Invalid origin.',403)}}
 let body:{key?:string;jobId?:string};try{body=await req.json()}catch{return reply('Invalid JSON.',400)}
 const {key,jobId}=body;
 if(typeof key!=='string'||key.length<12||key.length>400||/[\s]/.test(key)||typeof jobId!=='string'||!/^[a-zA-Z0-9_-]{5,120}$/.test(jobId))return reply('Invalid credentials or job ID.',400);
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),35000);
 try{
  const headers={Authorization:'Bearer '+key};
  const upstream=await fetch('https://api.openai.com/v1/videos/'+encodeURIComponent(jobId),{headers,signal:controller.signal,cache:'no-store'});
  const data=await upstream.json().catch(()=>({}));if(!upstream.ok)return reply('Video status failed: '+String(data.error?.message||upstream.status).slice(0,180),400);
  const status=String(data.status||'unknown');
  if(status!=='completed')return NextResponse.json({kind:'video_job',status,progress:data.progress||0},{headers:{'Cache-Control':'no-store'}});
  const video=await fetch('https://api.openai.com/v1/videos/'+encodeURIComponent(jobId)+'/content',{headers,signal:controller.signal,cache:'no-store'});
  if(!video.ok)return reply('Video completed but download failed.',502);
  const bytes=await video.arrayBuffer();if(bytes.byteLength>14000000)return reply('Video is ready but too large for inline preview.',413);
  return NextResponse.json({kind:'video',video:'data:video/mp4;base64,'+Buffer.from(bytes).toString('base64')},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return reply(e instanceof Error&&e.name==='AbortError'?'Video check timed out.':'Video provider connection failed.',502)}finally{clearTimeout(timer)}
}
