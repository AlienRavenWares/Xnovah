import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
 const key = process.env.DEEPSEEK_API_KEY;
 if (!key) return NextResponse.json({error:'Assistant is not configured yet.'},{status:503});
 const body = await req.json().catch(() => null);
 const message = typeof body?.message === 'string' ? body.message.trim().slice(0,1000) : '';
 if (!message) return NextResponse.json({error:'Please enter a message.'},{status:400});
 try {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
   method:'POST', headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},
   body:JSON.stringify({model:'deepseek-chat',max_tokens:350,messages:[
    {role:'system',content:'You are Xnovah Guide. Xnovah is an AI creative platform in development with 39 planned tools. Demonstrations are simulated. Do not invent launch dates, prices, certifications or available features. Answer questions about the planned product and direct visitors to the waitlist.'},
    {role:'user',content:message}
   ]}),cache:'no-store',signal:AbortSignal.timeout(15000)
  });
  if(!response.ok)return NextResponse.json({error:'Assistant is temporarily unavailable.'},{status:502});
  const data=await response.json();
  return NextResponse.json({answer:String(data?.choices?.[0]?.message?.content||'No response available.').slice(0,2000)});
 } catch {return NextResponse.json({error:'Assistant could not respond right now.'},{status:502})}
}
