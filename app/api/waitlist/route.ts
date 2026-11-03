import {NextRequest,NextResponse} from 'next/server';

// Resend stores contacts persistently. Never confirm a signup unless the provider accepts it.
export async function POST(req:NextRequest){
 if(!(req.headers.get('content-type')||'').toLowerCase().includes('application/json'))return NextResponse.json({error:'Expected JSON request.'},{status:415});
 const origin=req.headers.get('origin');
 if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:'Request origin not allowed.'},{status:403});
 const length=Number(req.headers.get('content-length')||0);
 if(length>4096)return NextResponse.json({error:'Request is too large.'},{status:413});
 const data=await req.json().catch(()=>null);
 if(!data||typeof data!=='object'||Array.isArray(data))return NextResponse.json({error:'Invalid signup request.'},{status:400});
 // Honeypot for automated form submissions; the public form leaves this field empty.
 if(typeof data?.website==='string'&&data.website.trim())return NextResponse.json({success:true});
 const email=typeof data?.email==='string'?data.email.trim().toLowerCase():'';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return NextResponse.json({error:'Please enter a valid email.'},{status:400});
 const key=process.env.RESEND_API_KEY;
 const audienceId=process.env.RESEND_AUDIENCE_ID;
 if(!key||!audienceId)return NextResponse.json({error:'Waitlist email service is not configured yet.'},{status:503});
 try{
  const response=await fetch(`https://api.resend.com/audiences/${encodeURIComponent(audienceId)}/contacts`,{
   method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
   body:JSON.stringify({email,unsubscribed:false}),cache:'no-store',signal:AbortSignal.timeout(10000)
  });
  if(response.status===409)return NextResponse.json({success:true,alreadySubscribed:true},{headers:{'Cache-Control':'no-store'}});
  if(!response.ok){
   console.error('Waitlist provider status:',response.status);
   return NextResponse.json({error:response.status===429?'Signup is busy. Please try again shortly.':'Could not join the waitlist. Please try again.'},{status:response.status===429?429:502});
  }
  return NextResponse.json({success:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Could not reach the signup service. Please try again.'},{status:502})}
}
