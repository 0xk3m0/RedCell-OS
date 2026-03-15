const db = require('../config/db');
const t = () => new Date().toISOString().slice(0,10);
exports.getHabits = async (req,res) => {
  const habits = await db.pAll('SELECT * FROM habits WHERE user_id=? AND active=1 ORDER BY sort_order',[req.session.userId]);
  const days=[]; for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(d.toISOString().slice(0,10));}
  const result = await Promise.all(habits.map(async h => {
    const logs = await db.pAll(`SELECT date,status,note FROM habit_logs WHERE habit_id=? AND date IN (${days.map(()=>'?').join(',')})`,[h.id,...days]);
    const map={}; logs.forEach(l=>map[l.date]=l);
    return {...h,days:days.map(d=>({date:d,...(map[d]||{status:null,note:''})}))};
  }));
  res.json(result);
};
exports.createHabit = async (req,res) => {
  const {name,icon='◉',category='core',color='green'} = req.body; if(!name) return res.status(400).json({error:'Name required'});
  const maxRow = await db.pGet('SELECT MAX(sort_order) as m FROM habits WHERE user_id=?',[req.session.userId]);
  const r = await db.pRun('INSERT INTO habits (user_id,name,icon,category,color,sort_order) VALUES (?,?,?,?,?,?)',[req.session.userId,name,icon,category,color,(maxRow?.m||0)+1]);
  res.json({id:r.lastID,name,icon,category,color});
};
exports.updateHabit = async (req,res) => {
  const {name,icon,category,color} = req.body;
  await db.pRun('UPDATE habits SET name=COALESCE(?,name),icon=COALESCE(?,icon),category=COALESCE(?,category),color=COALESCE(?,color) WHERE id=? AND user_id=?',[name,icon,category,color,req.params.id,req.session.userId]);
  res.json({success:true});
};
exports.logHabit = async (req,res) => {
  const {status='done',date=t(),note=''} = req.body;
  const h = await db.pGet('SELECT id FROM habits WHERE id=? AND user_id=?',[req.params.id,req.session.userId]); if(!h) return res.status(404).json({error:'Not found'});
  if(!status||status==='null') await db.pRun('DELETE FROM habit_logs WHERE habit_id=? AND date=?',[req.params.id,date]);
  else await db.pRun('INSERT OR REPLACE INTO habit_logs (habit_id,user_id,date,status,note) VALUES (?,?,?,?,?)',[req.params.id,req.session.userId,date,status,note]);
  res.json({success:true});
};
exports.deleteHabit = async (req,res) => {await db.pRun('UPDATE habits SET active=0 WHERE id=? AND user_id=?',[req.params.id,req.session.userId]);res.json({success:true});};
exports.reorder = async (req,res) => {
  const {ids} = req.body;
  for(let i=0;i<ids.length;i++) await db.pRun('UPDATE habits SET sort_order=? WHERE id=? AND user_id=?',[i+1,ids[i],req.session.userId]);
  res.json({success:true});
};
