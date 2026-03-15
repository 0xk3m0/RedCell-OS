const db = require('../config/db');
const t = () => new Date().toISOString().slice(0,10);
exports.getStats = async (req,res) => {
  const uid = req.session.userId;
  const [user,focus,done,total,energy,dates,rm,proj,habs] = await Promise.all([
    db.pGet('SELECT username,mission,daily_focus_target FROM users WHERE id=?',[uid]),
    db.pGet('SELECT COALESCE(SUM(minutes),0) total FROM focus_sessions WHERE user_id=? AND date=?',[uid,t()]),
    db.pGet('SELECT COUNT(*) c FROM tasks WHERE user_id=? AND date=? AND status="done"',[uid,t()]),
    db.pGet('SELECT COUNT(*) c FROM tasks WHERE user_id=? AND date=?',[uid,t()]),
    db.pGet('SELECT level FROM energy_logs WHERE user_id=? AND date=?',[uid,t()]),
    db.pAll('SELECT DISTINCT date FROM focus_sessions WHERE user_id=? ORDER BY date DESC LIMIT 60',[uid]),
    db.pGet('SELECT COALESCE(AVG(progress),0) a FROM roadmap_items WHERE user_id=?',[uid]),
    db.pGet('SELECT COUNT(*) c FROM projects WHERE user_id=? AND status="active"',[uid]),
    db.pAll('SELECT h.name,hl.status FROM habits h LEFT JOIN habit_logs hl ON h.id=hl.habit_id AND hl.date=? WHERE h.user_id=? AND h.active=1',[t(),uid]),
  ]);
  const ds = new Set(dates.map(r=>r.date)); let streak=0;
  for(let i=0;i<365;i++){const d=new Date();d.setDate(d.getDate()-i);if(ds.has(d.toISOString().slice(0,10)))streak++;else if(i>0)break;}
  // Weekly focus totals (last 7 days)
  const weeklyFocus = [];
  for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().slice(0,10);const r=await db.pGet('SELECT COALESCE(SUM(minutes),0) t FROM focus_sessions WHERE user_id=? AND date=?',[uid,ds]);weeklyFocus.push({date:ds,minutes:r.t});}
  res.json({user,focusMinutes:focus.total,focusHours:(focus.total/60).toFixed(1),tasksDone:done.c,tasksTotal:total.c,streak,energy:energy?.level||null,rmOverall:Math.round(rm.a||0),activeProjects:proj.c,habitsChecked:habs.filter(h=>h.status==='done').length,habitsTotal:habs.length,weeklyFocus});
};
exports.getRecentFocus = async (req,res) => res.json(await db.pAll('SELECT topic,minutes,category,mood,date FROM focus_sessions WHERE user_id=? ORDER BY created_at DESC LIMIT 7',[req.session.userId]));
exports.getTodayTasks = async (req,res) => res.json(await db.pAll('SELECT * FROM tasks WHERE user_id=? AND date=? ORDER BY priority,created_at LIMIT 6',[req.session.userId,t()]));
exports.getDailyNote = async (req,res) => {const r=await db.pGet('SELECT content FROM daily_notes WHERE user_id=? AND date=?',[req.session.userId,t()]);res.json({content:r?.content||''});};
exports.saveDailyNote = async (req,res) => {const{content=''}=req.body;await db.pRun('INSERT OR REPLACE INTO daily_notes (user_id,date,content) VALUES (?,?,?)',[req.session.userId,t(),content]);res.json({success:true});};
