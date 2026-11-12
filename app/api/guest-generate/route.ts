import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
export const maxDuration=60;
const allowedOrigins=new Set(['https://xnovah-main.vercel.app','https://xnovah-main-alien-raven-wares.vercel.app']);
const recent=new Map<string,{count:number;reset:number}>();
function failure(message:string,status:number){return NextResponse.json({error:message},{status,headers:{'Cache-Control':'no-store'}})}
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin');
 const host=req.headers.get('host')||'';
 if(origin){try{const u=new URL(origin);if(u.host!==host&&!allowedOrigins.has(origin))return failure('Origin not allowed.',403)}catch{return failure('Invalid origin.',403)}}
 const length=Number(req.headers.get('content-length')||0);if(length>18000)return failure('Request too large.',413);
 const ip=(req.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim();
 const now=Date.now();if(recent.size>3000){for(const [k,v] of recent)if(v.reset<now)recent.delete(k)}
 const hit=recent.get(ip);if(hit&&hit.reset>now&&hit.count>=12)return failure('Please wait before generating again.',429);
 recent.set(ip,hit&&hit.reset>now?{count:hit.count+1,reset:hit.reset}:{count:1,reset:now+60000});
 let data:Record<string,unknown>;try{data=await req.json()}catch{return failure('Invalid request.',400)}
 const provider=data.provider,studio=data.studio,key=data.key,prompt=data.prompt;const requestedModel=typeof data.model==='string'?data.model:'';const allowedModels=provider==='openai'?['gpt-4.1-mini','gpt-4.1','gpt-4o-mini','gpt-image-1-mini','gpt-image-1','tts-1','tts-1-hd','sora-2']:['gemini-2.5-flash','gemini-2.5-pro'];const model=allowedModels.includes(requestedModel)?requestedModel:studio==='image'?'gpt-image-1-mini':studio==='voice'?'tts-1':studio==='video'?'sora-2':provider==='openai'?'gpt-4.1-mini':'gemini-2.5-flash';const temperature=typeof data.temperature==='number'&&Number.isFinite(data.temperature)?Math.min(1,Math.max(0,data.temperature)):0.7;const size=typeof data.size==='string'&&['1024x1024','1536x1024','1024x1536'].includes(data.size)?data.size:'1024x1024';const voice=typeof data.voice==='string'&&['alloy','echo','fable','onyx','nova','shimmer'].includes(data.voice)?data.voice:'alloy';
 if(!['openai','gemini'].includes(String(provider))||!['writer','chat','code','image','voice','video','research','agents'].includes(String(studio)))return failure('Unsupported provider or studio.',400);
 if(typeof key!=='string'||key.length<12||key.length>400||/[\s\r\n]/.test(key))return failure('Invalid API key.',400);
 if(typeof prompt!=='string'||!prompt.trim()||prompt.length>4000)return failure('Enter a prompt under 4,000 characters.',400);
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);
 try{
  if(studio==='voice'){
   if(provider!=='openai')return failure('Voice requires an OpenAI API key.',400);
   const upstream=await fetch('https://api.openai.com/v1/audio/speech',{method:'POST',signal:controller.signal,headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:['tts-1','tts-1-hd'].includes(model)?model:'tts-1',voice,input:prompt.trim().slice(0,3000),response_format:'mp3'})});
   if(!upstream.ok){const e=await upstream.json().catch(()=>({}));return failure('Voice generation failed: '+String(e.error?.message||upstream.status).slice(0,180),400)}
   const bytes=await upstream.arrayBuffer();if(bytes.byteLength>9000000)return failure('Audio exceeds preview size.',413);
   return NextResponse.json({kind:'audio',audio:'data:audio/mpeg;base64,'+Buffer.from(bytes).toString('base64')},{headers:{'Cache-Control':'no-store'}});
  }
  if(studio==='video'){
   if(provider!=='openai')return failure('Video requires an OpenAI API key with video access.',400);
   const form=new FormData();form.append('model','sora-2');form.append('prompt',prompt.trim());form.append('seconds','4');form.append('size','1280x720');
   const upstream=await fetch('https://api.openai.com/v1/videos',{method:'POST',signal:controller.signal,headers:{Authorization:'Bearer '+key},body:form});
   const result=await upstream.json().catch(()=>({}));if(!upstream.ok)return failure('Video request failed: '+String(result.error?.message||upstream.status).slice(0,200),400);
   if(typeof result.id!=='string')return failure('Video job ID missing.',502);
   return NextResponse.json({kind:'video_job',jobId:result.id,status:result.status||'queued'},{headers:{'Cache-Control':'no-store'}});
  }
  if(studio==='agents'){
   const agentPrompt='Act as a planning and drafting agent. Produce a detailed, actionable workflow with steps, draft deliverables, checks and handoff notes. Do not claim to have executed external actions. Objective: '+prompt.trim();
   data.prompt=agentPrompt;
  }
  if(studio==='research'&&provider==='gemini'){
   const upstream=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${['gemini-2.5-flash','gemini-2.5-pro'].includes(model)?model:'gemini-2.5-flash'}:generateContent`,{method:'POST',signal:controller.signal,headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:'Research this question, verify claims using Google Search, include citations and uncertainty: '+prompt.trim()}]}],tools:[{google_search:{}}]})});
   const result=await upstream.json();if(!upstream.ok)return failure('Research failed: '+String(result.error?.message||upstream.status).slice(0,200),400);
   const text=(result.candidates?.[0]?.content?.parts||[]).map((p:{text?:string})=>p.text||'').join('\n');
   const sources=(result.candidates?.[0]?.groundingMetadata?.groundingChunks||[]).map((c:{web?:{uri?:string;title?:string}})=>c.web).filter((v:{uri?:string}|undefined)=>v&&typeof v.uri==='string').slice(0,8);
   return NextResponse.json({kind:'text',text,sources},{headers:{'Cache-Control':'no-store'}});
  }
  if(provider==='openai'){
   if(studio==='image'){
    const upstream=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',signal:controller.signal,headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:['gpt-image-1','gpt-image-1-mini'].includes(model)?model:'gpt-image-1-mini',prompt:prompt.trim(),size,n:1})});
    const result=await upstream.json();if(!upstream.ok)return failure('OpenAI image request failed: '+String(result.error?.message||upstream.status).slice(0,220),upstream.status===429?429:400);
    const b64=result.data?.[0]?.b64_json;if(typeof b64!=='string')return failure('No image returned.',502);
    return NextResponse.json({kind:'image',image:'data:image/png;base64,'+b64},{headers:{'Cache-Control':'no-store'}});
   }
   const upstream=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal:controller.signal,headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:['gpt-4.1-mini','gpt-4.1','gpt-4o-mini'].includes(model)?model:'gpt-4.1-mini',input:[{role:'system',content:'You are an assistant inside Xnovah Studio. Fulfill the user request clearly. For coding tasks return usable code. Do not claim to have performed external actions.'},{role:'user',content:studio==='research'?'Prepare a research report; clearly distinguish unverified claims and state that live web sources are unavailable: '+prompt.trim():studio==='agents'?String(data.prompt):prompt.trim()}],max_output_tokens:1800})});
   const result=await upstream.json();if(!upstream.ok)return failure('OpenAI request failed: '+String(result.error?.message||upstream.status).slice(0,220),upstream.status===429?429:400);
   const output=(result.output||[]).flatMap((o:{content?:{type?:string;text?:string}[]})=>o.content||[]).filter((c:{type?:string})=>c.type==='output_text').map((c:{text?:string})=>c.text||'').join('\n');
   if(!output)return failure('No text returned by provider.',502);
   return NextResponse.json({kind:'text',text:output},{headers:{'Cache-Control':'no-store'}});
  }
  if(studio==='image')return failure('Image generation currently requires an OpenAI key.',400);
  const upstream=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',{method:'POST',signal:controller.signal,headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:studio==='agents'?String(data.prompt):studio==='research'?'Write a research report and explicitly note that live web search is not enabled: '+prompt.trim():prompt.trim()}]}],generationConfig:{maxOutputTokens:1600,temperature}})});
  const result=await upstream.json();if(!upstream.ok)return failure('Gemini request failed: '+String(result.error?.message||upstream.status).slice(0,220),upstream.status===429?429:400);
  const output=(result.candidates?.[0]?.content?.parts||[]).map((p:{text?:string})=>p.text||'').join('\n');if(!output)return failure('No text returned by provider.',502);
  return NextResponse.json({kind:'text',text:output},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e instanceof Error&&e.name==='AbortError'?'Generation timed out.':'Provider connection failed.',502)}finally{clearTimeout(timer)}
}
