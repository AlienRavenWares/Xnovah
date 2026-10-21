import {NextRequest,NextResponse} from 'next/server';
// Connect a persistent database or mailing-list provider before launching.
// This endpoint intentionally refuses signups until configured, to avoid false confirmations.
export async function POST(req:NextRequest){
  const data=await req.json().catch(()=>null);
  const email=typeof data?.email==='string'?data.email.trim().toLowerCase():'';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return NextResponse.json({error:'Please enter a valid email.'},{status:400});
  const key=process.env.RESEND_API_KEY;
  const audienceId=process.env.RESEND_AUDIENCE_ID;
  if(!key||!audienceId)return NextResponse.json({error:'Waitlist email service is not configured yet.'},{status:503});
  try{
    const response=await fetch(`https://api.resend.com/audiences/${encodeURIComponent(audienceId)}/contacts`,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({email,unsubscribed:false}),cache:'no-store'});
    if(!response.ok){console.error('Waitlist provider error',response.status);return NextResponse.json({error:'Could not join waitlist.'},{status:502})}
    return NextResponse.json({success:true});
  }catch{return NextResponse.json({error:'Could not reach waitlist service.'},{status:502})}
}
