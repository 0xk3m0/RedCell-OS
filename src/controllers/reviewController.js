const db = require('../config/db');
const ws = () => {const d=new Date();d.setDate(d.getDate()-d.getDay()+1);return d.toISOString().slice(0,10);};
exports.get = async (req,res) => {const w=req.query.week||ws();res.json(await db.pGet('SELECT * FROM weekly_reviews WHERE user_id=? AND week_start=?',[req.session.userId,w])||{week_start:w,went_well:'',blockers:'',improvements:'',next_mission:'',rating:3,mood:3});};
exports.save = async (req,res) => {const{week_start,went_well='',blockers='',improvements='',next_mission='',rating=3,mood=3}=req.body;await db.pRun('INSERT OR REPLACE INTO weekly_reviews (user_id,week_start,went_well,blockers,improvements,next_mission,rating,mood) VALUES (?,?,?,?,?,?,?,?)',[req.session.userId,week_start||ws(),went_well,blockers,improvements,next_mission,rating,mood]);res.json({success:true});};
exports.history = async (req,res) => res.json(await db.pAll('SELECT * FROM weekly_reviews WHERE user_id=? ORDER BY week_start DESC LIMIT 10',[req.session.userId]));
