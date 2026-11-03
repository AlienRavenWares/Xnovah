import {NextRequest,NextResponse} from 'next/server';
import {ensureSubscribers} from '../../../lib/subscribers';
export const runtime='nodejs';
const headers={'Cache-Control':'no-store'};
export async function POST(req:NextRequest){
 if(!(req.headers.get('content-type')||'').includes('application/json'))return NextResponse.json({error:'Expected JSON.'},{status:415,headers});
 const origin=req.headers.get('origin');
 if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:'Origin not allowed.'},{status:403,headers});
 if(Number(req.headers.get('content-length')||0)>4096)return NextResponse.json({error:'Request too large.'},{status:413,headers});
 const data=await req.json().catch(()=>null);
 if(!data||typeof data!=='object'||Array.isArray(data))return NextResponse.json({error:'Invalid request.'},{status:400,headers});
 if(typeof data.website==='string'&&data.website.trim())return NextResponse.json({success:true},{headers});
 const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
 if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return NextResponse.json({error:'Please enter a valid email.'},{status:400,headers});
 const source=data.source==='newsletter'?'Newsletter':'Waitlist';
 if(!process.env.DATABASE_URL)return NextResponse.json({error:'Subscriber storage is not configured yet.'},{status:503,headers});
 try{
  const sql=await ensureSubscribers();
  const inserted=await sql`INSERT INTO xnovah_subscribers (email,source) VALUES (${email},${source}) ON CONFLICT (email,source) DO NOTHING RETURNING id`;
  return NextResponse.json({success:true,alreadySubscribed:inserted.length===0},{headers});
 }catch(e){console.error('Subscriber storage failed',e instanceof Error?e.message:'unknown');return NextResponse.json({error:'Could not save your email. Please try again.'},{status:502,headers})}
}
