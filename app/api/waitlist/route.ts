import {NextRequest,NextResponse} from 'next/server';

export const runtime='nodejs';
const headers={'Cache-Control':'no-store'};

// REPLACE THIS DEMO ADDRESS WITH YOUR REAL INBOX LATER.
// GitHub: app/api/waitlist/route.ts
const NOTIFICATION_EMAIL='demo@example.com';

const validEmail=(email:string)=>email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export async function POST(req:NextRequest){
 if(!(req.headers.get('content-type')||'').toLowerCase().includes('application/json'))return NextResponse.json({error:'Expected JSON.'},{status:415,headers});
 const origin=req.headers.get('origin');
 if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:'Origin not allowed.'},{status:403,headers});
 if(Number(req.headers.get('content-length')||0)>4096)return NextResponse.json({error:'Request too large.'},{status:413,headers});
 const data=await req.json().catch(()=>null);
 if(!data||typeof data!=='object'||Array.isArray(data))return NextResponse.json({error:'Invalid signup request.'},{status:400,headers});
 if(typeof data.website==='string'&&data.website.trim())return NextResponse.json({success:true},{headers});
 const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
 if(!validEmail(email))return NextResponse.json({error:'Please enter a valid email.'},{status:400,headers});
 const source=data.source==='newsletter'?'Newsletter':'Waitlist';
 // Never send real visitors' addresses to a demo mailbox.
 if(NOTIFICATION_EMAIL==='demo@example.com')return NextResponse.json({error:'Email signup notifications are awaiting inbox setup. Please try again later.'},{status:503,headers});
 try{
  const response=await fetch('https://formsubmit.co/ajax/'+encodeURIComponent(NOTIFICATION_EMAIL),{
   method:'POST',
   headers:{'Content-Type':'application/json','Accept':'application/json'},
   body:JSON.stringify({
    _subject:'Xnovah — New '+source+' signup',
    _template:'table',
    _captcha:'true',
    email,
    signup_source:source,
    submitted_at_utc:new Date().toISOString()
   }),
   cache:'no-store',
   signal:AbortSignal.timeout(15000)
  });
  const result=await response.json().catch(()=>null);
  if(!response.ok||result?.success===false||result?.success==='false')throw new Error('Form notification delivery failed');
  return NextResponse.json({success:true},{headers});
 }catch(e){
  console.error('Signup email notification failed',e instanceof Error?e.message:'unknown');
  return NextResponse.json({error:'Could not submit your email. Please try again.'},{status:502,headers});
 }
}
