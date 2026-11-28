import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status,headers:{...cors,"Content-Type":"application/json"}});
const ROOT="drivelinkxv76@gmail.com";
const url=Deno.env.get("SUPABASE_URL")!;
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
function sameSecret(a:string,b:string){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({error:"Méthode non autorisée."},405);
 try{
  const body=await req.json(),action=String(body?.action||""),email=String(body?.email||"").trim().toLowerCase(),password=String(body?.password||"");
  if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({error:"Adresse e-mail invalide."},400);
  if(password.length<8||password.length>128)return json({error:"Le mot de passe doit contenir entre 8 et 128 caractères."},400);
  if(action==="create_invited_admin"){
   if(email===ROOT)return json({error:"Cette adresse est réservée au Super Admin."},403);
   const {data:invite,error:inviteError}=await admin.from("hadassa_admin_users").select("id,user_id,is_active").eq("email",email).eq("is_active",true).is("user_id",null).maybeSingle();
   if(inviteError)throw inviteError;
   if(!invite)return json({error:"Aucune invitation active et non utilisée ne correspond à cette adresse."},403);
   const {data:created,error:createError}=await admin.auth.admin.createUser({email,password,email_confirm:true});
   if(createError){const message=/already|registered|exists/i.test(createError.message)?"Un compte existe déjà avec cette adresse. Contactez le Super Admin.":createError.message;return json({error:message},409);}
   if(!created.user)return json({error:"Supabase n’a pas retourné le compte créé."},500);
   const {data:linked,error:linkError}=await admin.from("hadassa_admin_users").update({user_id:created.user.id}).eq("id",invite.id).eq("is_active",true).is("user_id",null).select("id").maybeSingle();
   if(linkError||!linked){await admin.auth.admin.deleteUser(created.user.id);if(linkError)throw linkError;return json({error:"L’invitation a changé pendant la création. Réessayez ou contactez le Super Admin."},409);}
   return json({created:true});
  }
  if(action==="set_root_password"){
   if(email!==ROOT)return json({error:"Adresse Super Admin invalide."},403);
   const expectedToken=Deno.env.get("HADASSA_ROOT_SETUP_TOKEN")||"",suppliedToken=String(body?.activation_token||"");
   if(!expectedToken||!suppliedToken||!sameSecret(expectedToken,suppliedToken))return json({error:"Clé d’activation invalide."},403);
   const {data:rootRecord,error:rootError}=await admin.from("hadassa_admin_users").select("id,user_id").eq("email",ROOT).eq("role","super_admin").eq("is_active",true).maybeSingle();
   if(rootError)throw rootError;if(!rootRecord?.user_id)return json({error:"Le compte Super Admin n’est pas correctement initialisé."},409);
   const {data:used,error:usedError}=await admin.from("hadassa_admin_audit_log").select("id").eq("action","initialize_root_password").limit(1).maybeSingle();
   if(usedError)throw usedError;if(used)return json({error:"La clé de première activation a déjà été utilisée. Elle doit être renouvelée par le gestionnaire du projet."},409);
   const {error:auditError}=await admin.from("hadassa_admin_audit_log").insert({actor_user_id:rootRecord.user_id,actor_email:ROOT,action:"initialize_root_password",entity_type:"auth_user",entity_id:rootRecord.user_id,details:{method:"protected_initial_activation"}});
   if(auditError)throw auditError;
   const {data:updated,error:updateError}=await admin.auth.admin.updateUserById(rootRecord.user_id,{password,email_confirm:true});
   if(updateError)throw updateError;
   return json({updated:Boolean(updated.user)});
  }
  return json({error:"Action non autorisée."},400);
 }catch(error){console.error("hadassa-admin-code:",error);return json({error:error instanceof Error?error.message:"Erreur interne."},500);}
});
