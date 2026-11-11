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
 const provider=data.provider,studio=data.studio,key=data.key,prompt=data.prompt;
 if(!['openai','gemini'].includes(String(provider))||!['writer','chat','code','image'].includes(String(studio)))return failure('Unsupported provider or studio.',400);
 if(typeof key!=='string'||key.length<12||key.length>400||/[\s\r\n]/.test(key))return failure('Invalid API key.',400);
 if(typeof prompt!=='string'||!prompt.trim()||prompt.length>4000)return failure('Enter a prompt under 4,000 characters.',400);
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);
 try{
  if(provider==='openai'){
   if(studio==='image'){
    const upstream=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',signal:controller.signal,headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-image-1-mini',prompt:prompt.trim(),size:'1024x1024',n:1})});
    const result=await upstream.json();if(!upstream.ok)return failure('OpenAI image request failed: '+String(result.error?.message||upstream.status).slice(0,220),upstream.status===429?429:400);
    const b64=result.data?.[0]?.b64_json;if(typeof b64!=='string')return failure('No image returned.',502);
    return NextResponse.json({kind:'image',image:'data:image/png;base64,'+b64},{headers:{'Cache-Control':'no-store'}});
   }
   const upstream=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal:controller.signal,headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4.1-mini',input:[{role:'system',content:'You are an assistant inside Xnovah Studio. Fulfill the user request clearly. For coding tasks return usable code. Do not claim to have performed external actions.'},{role:'user',content:prompt.trim()}],max_output_tokens:1100})});
   const result=await upstream.json();if(!upstream.ok)return failure('OpenAI request failed: '+String(result.error?.message||upstream.status).slice(0,220),upstream.status===429?429:400);
   const output=(result.output||[]).flatMap((o:{content?:{type?:string;text?:string}[]})=>o.content||[]).filter((c:{type?:string})=>c.type==='output_text').map((c:{text?:string})=>c.text||'').join('\n');
   if(!output)return failure('No text returned by provider.',502);
   return NextResponse.json({kind:'text',text:output},{headers:{'Cache-Control':'no-store'}});
  }
  if(studio==='image')return failure('Image generation currently requires an OpenAI key.',400);
  const upstream=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',{method:'POST',signal:controller.signal,headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt.trim()}]}],generationConfig:{maxOutputTokens:1600}})});
  const result=await upstream.json();if(!upstream.ok)return failure('Gemini request failed: '+String(result.error?.message||upstream.status).slice(0,220),upstream.status===429?429:400);
  const output=(result.candidates?.[0]?.content?.parts||[]).map((p:{text?:string})=>p.text||'').join('\n');if(!output)return failure('No text returned by provider.',502);
  return NextResponse.json({kind:'text',text:output},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e instanceof Error&&e.name==='AbortError'?'Generation timed out.':'Provider connection failed.',502)}finally{clearTimeout(timer)}
}
