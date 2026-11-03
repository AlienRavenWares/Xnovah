import {NextRequest,NextResponse} from 'next/server';

export const runtime='nodejs';

const jsonHeaders={'Cache-Control':'no-store'};
const validEmail=(value:string)=>value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function POST(req:NextRequest){
 if(!(req.headers.get('content-type')||'').toLowerCase().includes('application/json'))return NextResponse.json({error:'Expected JSON request.'},{status:415});
 const origin=req.headers.get('origin');
 if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:'Request origin not allowed.'},{status:403});
 if(Number(req.headers.get('content-length')||0)>4096)return NextResponse.json({error:'Request is too large.'},{status:413});
 const data=await req.json().catch(()=>null);
 if(!data||typeof data!=='object'||Array.isArray(data))return NextResponse.json({error:'Invalid signup request.'},{status:400});
 if(typeof data.website==='string'&&data.website.trim())return NextResponse.json({success:true},{headers:jsonHeaders});
 const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
 if(!validEmail(email))return NextResponse.json({error:'Please enter a valid email.'},{status:400});
 const source=data.source==='newsletter'?'Newsletter':'Early-access waitlist';
 const key=process.env.RESEND_API_KEY;
 const audienceId=process.env.RESEND_AUDIENCE_ID;
 if(!key||!audienceId)return NextResponse.json({error:'Email signup is not configured yet.'},{status:503});
 try{
  const response=await fetch(`https://api.resend.com/audiences/${encodeURIComponent(audienceId)}/contacts`,{
   method:'POST',
   headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
   body:JSON.stringify({email,unsubscribed:false}),
   cache:'no-store',
   signal:AbortSignal.timeout(10000)
  });
  if(response.status===409)return NextResponse.json({success:true,alreadySubscribed:true},{headers:jsonHeaders});
  if(!response.ok){
   console.error('Subscriber storage failed:',response.status);
   return NextResponse.json({error:response.status===429?'Signup is busy. Please try again shortly.':'Could not save your email. Please try again.'},{status:response.status===429?429:502});
  }
 }catch{
  return NextResponse.json({error:'Could not reach the signup service. Please try again.'},{status:502});
 }

 // A notification is optional: subscriber storage is the source of truth.
 // Never expose recipient addresses, provider errors, or API keys to visitors.
 const notifyTo=process.env.SIGNUP_NOTIFICATION_EMAIL;
 const notifyFrom=process.env.RESEND_FROM_EMAIL;
 if(notifyTo&&notifyFrom&&validEmail(notifyTo.trim())&&validEmail(notifyFrom.trim())){
  try{
   const notification=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body:JSON.stringify({
     from:notifyFrom.trim(),
     to:[notifyTo.trim()],
     subject:`New Xnovah ${source.toLowerCase()} subscriber`,
     text:`A new subscriber joined Xnovah.\n\nEmail: ${email}\nSource: ${source}\n\nThis address has been saved to the Resend audience.`
    }),
    cache:'no-store',
    signal:AbortSignal.timeout(10000)
   });
   if(!notification.ok)console.error('Signup notification failed:',notification.status);
  }catch{console.error('Signup notification delivery request failed.');}
 }
 return NextResponse.json({success:true},{headers:jsonHeaders});
}
