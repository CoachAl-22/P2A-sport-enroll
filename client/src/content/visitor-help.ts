import { DISCOVERY_CALL_URL, EMAIL_ENQUIRY_URL, EMERGING_TRIAL_URL } from './contact';
import { RUNG_PAGES } from './rungs';

export type HelpAnswer = { id:string; title:string; text:string; label:string; href:string; matches:[RegExp,number][] };

// Approved public guidance only; matching happens locally without transmitting,
// logging, or persisting questions. No free-form generated answers.
export const VISITOR_HELP: HelpAnswer[] = [
  {id:'programs',title:'Find a suitable program',text:'Foundation: Prep–Year 2. Emerging Athletes: Years 3–6. Junior Academy: Years 6–9, with individual exceptions. Year 6 families can discuss either option. Senior Squad is generally ages 16+, Team Sport Speed ages 13+, and High Performance suitability is discussed with Coach Al. A discovery call helps confirm the fit.',label:'Compare programs',href:'/programs',matches:[[/\b(programs?|squads?|years?|grades?|ages?|foundation|emerging|academy|beginner)\b/,3],[/\b(prep|child|suit|fit)\b/,1]]},
  {id:'fees',title:'Fees and GST',text:'School classes and Team Sport Speed are $33 per class including GST ($30 + $3 GST). Other programs have their own fees and inclusions. Check your program page and the booking provider’s final total before paying. Ballam Park may have separate venue membership costs; confirm these with Coach Al.',label:'View programs and fees',href:'/programs',matches:[[/\b(costs?|fees?|prices?|pricing|gst|expensive|much)\b/,8]]},
  {id:'trial',title:'Arrange a free trial',text:'Every new athlete can have a free trial session. For Emerging Athletes, use the free-trial page below and choose the correct group, venue and date. Confirm any Ballam Park membership requirements before attending. For another program or help choosing, book a discovery call with Coach Al. A paid session booking is not a free-trial booking.',label:'Book an Emerging Athlete free trial',href:EMERGING_TRIAL_URL,matches:[[/\b(trials?|try|free)\b/,8]]},
  {id:'first-session',title:'Prepare for your first session',text:'Confirm the date, time, venue and meeting point with Coach Al before travelling. Bring a water bottle, suitable sports shoes and comfortable clothing. Check your confirmation for any other equipment. An enquiry or application alone does not confirm a place.',label:'Your first-session guide',href:'/enrollment-guide',matches:[[/\b(bring|wear|equipment|prepare|preparation|bottle|shoes)\b/,8],[/\bfirst session\b/,5]]},
  {id:'existing',title:'Manage an existing booking',text:'Use the link provided in your original booking confirmation to review or change a booking. Session changes and payments remain with that provider. This help cannot view your booking, change it or take payment. Contact Coach Al if you need help.',label:'Existing-family guidance',href:'/enrollment-guide#existing-families',matches:[[/\b(existing|manage|change|login|log in|account|password)\b/,4],[/\b(bookings?|booked)\b/,1]]},
  {id:'confirmation',title:'Missing booking confirmation',text:'Check your inbox, spam folder and the account or provider used to book. Check whether payment was taken before booking again. An enquiry receipt is not a booking confirmation. Contact Coach Al directly with your booking details if unsure; this help cannot check payment or booking status.',label:'Booking and payment help',href:'/payment-support',matches:[[/\b(confirmation|receipt|charged|paid|payment|duplicate)\b/,6]]},
  {id:'absence',title:'Absences, changes and credits',text:'Prepaid Setmore appointments are generally rescheduled; please give more than two hours’ notice. For term enrolments, less than two hours’ notice is late notice, and missed sessions without notice are no-shows. Neither receives a credit. Illness and family matters are assessed individually by Coach Al. Any discretionary credit or refund needs his decision.',label:'Read absence guidance',href:'/parent-help-center#policies',matches:[[/\b(absen\w*|missed|reschedul\w*|refund\w*|no show|late notice|hours? notice|cancel\w*)\b/,5],[/\b(credits?|setmore)\b/,2]]},
  {id:'weather',title:'Heat and extreme weather',text:'Sessions do not run above 36°C or in extreme weather. Venue rules may require earlier cancellation. If Power2ADAPT cancels a class, everyone booked into it receives a credit. This help cannot see today’s live session status. Check your session messages and contact Coach Al before travelling if unsure.',label:'Weather and parent guidance',href:'/parent-help-center',matches:[[/\b(weather|heat|hot|temperature|rain|storm\w*|lightning|36)\b/,10],[/\b(training|classes?|sessions?)\b.*\b(cancelled|canceled|going ahead|on today|on tonight)\b/,10]]},
  {id:'parents',title:'Can parents stay?',text:'Parents do not need to stay during training. You are welcome to watch, particularly for Prep and Year 1. Parents and caregivers remain responsible before and after the designated class time. Collect your child on time and tell the coach if arrangements change or you are delayed.',label:'Arrival and collection guidance',href:'/enrollment-guide',matches:[[/\b(stay|watch|supervision|supervise|drop off)\b/,8],[/\b(parents?|collection)\b/,1]]},
  {id:'peninsula',title:'Peninsula Grammar meeting point',text:'Prep–Year 1: meet at your child’s classroom/playground area.\n\nYears 2–6: meet at the Junior Gym.\n\nThese school sessions are for Peninsula Grammar students. Confirm your agreed session before travelling.',label:'See venue meeting points',href:'/enrollment-guide#venue-meeting-points',matches:[[/\b(peninsula|grammar|pg|pgs|junior gym)\b/,6]]},
  {id:'ballam',title:'Ballam Park Athletic Track',text:'Meet at the high jump area on the track. Confirm your session before travelling and check the separate Frankston Athletic Club membership requirements and costs with Coach Al, including what applies to a trial.',label:'See venue meeting points',href:'/enrollment-guide#venue-meeting-points',matches:[[/\b(ballam|high jump|frankston)\b/,6]]},
  {id:'mornington',title:'Mornington Athletics Track',text:'Meet at the 100m finish or the undercover area. Confirm your agreed group and session before travelling. If you need entrance or parking instructions, contact Coach Al.',label:'See venue meeting points',href:'/enrollment-guide#venue-meeting-points',matches:[[/\b(mornington|100m|undercover)\b/,6]]},
  {id:'toorak',title:'Toorak College meeting and pickup',text:'Meet at the rock climbing wall. Pickup is at 4:45pm at the Wardle House turning circle. These school sessions are for Toorak College students. Confirm your agreed session before travelling.',label:'See venue meeting points',href:'/enrollment-guide#venue-meeting-points',matches:[[/\b(toorak|wardle|rock climbing)\b/,6]]},
  {id:'venues',title:'Venues and session times',text:'We train at Ballam Park Athletic Track, Mornington Athletics Track, Peninsula Grammar and Toorak College. School sessions are for students of that school. Check Where we train and confirm the current group, date and time with Coach Al before attending. This help does not show live availability.',label:'Where we train',href:'https://power2adapt.coach/where-we-train',matches:[[/\b(venues?|where|directions|parking|meet|location|pickup|pick up)\b/,3],[/\b(timetable|schedule|times?|when|tuesday|wednesday|thursday|friday|hurdles?)\b/,7]]},
  {id:'images',title:'Photo and video choices',text:'Private technique videos and public website/social sharing have separate permissions. For under-18 athletes, parent/guardian and athlete must both agree before recording or public use. Saying no does not affect participation. Coach Al currently keeps private videos in athlete-specific Google Drive folders accessible only to him and sends feedback copies to parents through iMessage or WhatsApp. Contact him to change permission or request removal.',label:'Photos, videos and your choices',href:'/photos-and-videos',matches:[[/\b(photos?|images?|videos?|filming|recording|consent|permission|social|privacy|whatsapp|imessage)\b/,9]]},
  {id:'inclusions',title:'What is included?',text:'Foundation and Emerging Athletes include My Athletic Journey app access. Junior Academy and Senior Squad include individual programming, progress testing and app support. High Performance includes its current physio partnership and advanced performance testing. See your program page for membership details.',label:'Compare program inclusions',href:'/programs',matches:[[/\b(include|included|inclusions?|programming|testing|maj|my athletic journey|app)\b/,8]]},
  {id:'enrol',title:'Enrol or book a session',text:'Choose your school class, session, squad application or free trial below. For High Performance, speak with Coach Al.',label:'Compare all programs',href:'/programs',matches:[[/\b(enrol\w*|enroll\w*|applications?|apply|join|sign up|book)\b/,7],[/\b(make|new)\b.*\bbooking\b|\bbooking (a |an )?session\b/,8]]},
  {id:'contact',title:'Talk to Coach Al',text:'Book a free 15-minute video discovery call to discuss your athlete’s goals and confirm how we can help. Prefer email? Use info@power2adapt.com and include your mobile number and best callback time (Melbourne time).',label:'Book a Discovery Call',href:DISCOVERY_CALL_URL,matches:[[/\b(contact|coach al|email|phone|call|talk|human|someone|discovery)\b/,4]]},
  {id:'health',title:'Discuss health and individual needs directly',text:'This help cannot assess injuries, give medical advice or decide whether an athlete can safely train. Please discuss relevant health or support needs directly with Coach Al before the session. Do not enter medical details here.',label:'Email Coach Al',href:EMAIL_ENQUIRY_URL,matches:[]},
];

export function findVisitorHelp(query:string): HelpAnswer[] {
  const text=query.slice(0,220).toLowerCase().replace(/[’']/g,'').replace(/[-–—]/g,' ').trim();
  if (!text) return [];
  if (/\b(injur\w*|pain|hurt\w*|medical|diagnos\w*|medicat\w*|allerg\w*|concussion|asthma|disabil\w*)\b/.test(text)) return [VISITOR_HELP.find(a=>a.id==='health')!];
  const meeting=/\b(meet|pickup|pick up|collect|directions|where)\b/.test(text);
  const venueIds=['peninsula','ballam','mornington','toorak'];
  const ranked=VISITOR_HELP.map(answer=>({answer,score:answer.matches.reduce((sum,[pattern,weight])=>sum+(pattern.test(text)?weight:0),0)}))
    .map(item=>({...item,score:item.score+(meeting && item.score>0 && venueIds.includes(item.answer.id)?6:0)}))
    .filter(item=>item.score>=3 && !(item.answer.id==='enrol' && /\b(trials?|free|try|discovery|call|reschedul\w*|cancel\w*)\b/.test(text))).sort((a,b)=>b.score-a.score);
  return ranked.filter(item=>item.score>=ranked[0].score-2).slice(0,3).map(item=>item.answer);
}

const PUBLIC_HELP_PATHS=new Set(['/', '/programs', '/foundation', '/emerging-athletes', '/junior-academy', '/senior-squad', '/high-performance', '/team-sport-speed', '/coaches', '/enrollment-guide', '/parent-help-center', '/payment-support', '/photos-and-videos', '/blog', '/education']);
export function showVisitorHelp(path:string):boolean {
  return PUBLIC_HELP_PATHS.has(path) || /^\/(blog|education)\/[^/]+$/.test(path);
}


export const BOOKING_OPTIONS = [
  {
    id:'school', title:'School classes',
    note:'For students of that school only. These links open the SportsBiz timetable; your class is not preselected. Choose the correct term, school and class before paying.',
    links:[RUNG_PAGES.foundation,RUNG_PAGES['emerging-athletes']].flatMap(program=>program.classes.map(session=>({
      label:`${session.venue} · ${program.name} (${program.ageBand}) · ${session.day} ${session.time}`,
      href:`/enrol/${session.slug}`,
    }))),
  },
  {
    id:'sessions', title:'Team Sport Speed sessions',
    note:'Ages 13+. $33 including GST per class. Choose your date in Setmore and check Melbourne time and the final total. Arrange a free trial with Coach Al first.',
    links:RUNG_PAGES['team-sport-speed'].classes.map(session=>({label:`${session.day} ${session.time} · ${session.venue}`,href:`/enrol/${session.slug}`})),
  },
  {
    id:'applications', title:'Junior Academy / Senior Squad applications',
    note:'Applications are reviewed by Coach Al; submitting one does not confirm a place. Junior Academy is Years 6–9 with individual exceptions; discuss Senior Squad placement with Coach Al.',
    links:[{label:'Apply for Junior Academy',href:'/junior-academy-application.html'},{label:'Apply for Senior Squad',href:'/senior-squad-application.html'}],
  },
  {
    id:'trial', title:'Arrange a free trial',
    note:'Every new athlete can have a free trial. Emerging Athletes can use the free-trial booking page. Choose the correct group, venue and date. For another program or help choosing, speak with Coach Al. A paid session booking is not a free-trial booking.',
    links:[{label:'Book an Emerging Athlete free trial',href:EMERGING_TRIAL_URL},{label:'Other programs or unsure? Talk to Coach Al',href:DISCOVERY_CALL_URL}],
  },
];
