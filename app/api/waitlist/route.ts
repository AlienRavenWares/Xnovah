import {NextRequest,NextResponse} from 'next/server';

export const runtime='nodejs';
const noStore={'Cache-Control':'no-store'};
const validEmail=(value:string)=>value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function POST(req:NextRequest){
 if(!(req.headers.get('content-type')||'').toLowerCase().includes('application/json'))return NextResponse.json({error:'Expected JSON request.'},{status:415,headers:noStore});
 const origin=req.headers.get('origin');
 if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:'Request origin not allowed.'},{status:403,headers:noStore});
 if(Number(req.headers.get('content-length')||0)>4096)return NextResponse.json({error:'Request is too large.'},{status:413,headers:noStore});
 const data=await req.json().catch(()=>null);
 if(!data||typeof data!=='object'||Array.isArray(data))return NextResponse.json({error:'Invalid signup request.'},{status:400,headers:noStore});
 if(typeof data.website==='string'&&data.website.trim())return NextResponse.json({success:true},{headers:noStore});
 const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
 if(!validEmail(email))return NextResponse.json({error:'Please enter a valid email.'},{status:400,headers:noStore});
 const source=data.source==='newsletter'?'Newsletter':'Early-access waitlist';
 const endpoint=process.env.GOOGLE_SHEETS_WEBHOOK_URL;
 const secret=process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;
 if(!endpoint||!secret)return NextResponse.json({error:'Signup storage is not configured yet.'},{status:503,headers:noStore});
 let url:URL;
 try{url=new URL(endpoint)}catch{return NextResponse.json({error:'Signup storage is not configured yet.'},{status:503,headers:noStore})}
 if(url.protocol!=='https:'||url.hostname!=='script.google.com'||!url.pathname.startsWith('/macros/s/'))return NextResponse.json({error:'Signup storage is not configured yet.'},{status:503,headers:noStore});
 try{
  const response=await fetch(url.toString(),{
   method:'POST',
   headers:{'Content-Type':'text/plain;charset=utf-8'},
   body:JSON.stringify({email,source,secret}),
   cache:'no-store',
   redirect:'follow',
   signal:AbortSignal.timeout(15000)
  });
  if(!response.ok){console.error('Sheets signup transport status:',response.status);return NextResponse.json({error:'Could not save your email. Please try again.'},{status:502,headers:noStore})}
  const result=await response.json().catch(()=>null);
  if(result?.success===true)return NextResponse.json({success:true,alreadySubscribed:result.alreadySubscribed===true},{headers:noStore});
  console.error('Sheets signup rejected:',typeof result?.error==='string'?result.error:'Unknown error');
  return NextResponse.json({error:'Could not save your email. Please try again.'},{status:502,headers:noStore});
 }catch{
  return NextResponse.json({error:'Could not reach the signup service. Please try again.'},{status:502,headers:noStore});
 }
}
