const db = require('../config/db');
const t = () => new Date().toISOString().slice(0,10);
exports.getTasks = async (req,res) => res.json(await db.pAll('SELECT * FROM tasks WHERE user_id=? AND date=? ORDER BY priority,created_at',[req.session.userId,req.query.date||t()]));
exports.createTask = async (req,res) => {
  const {text,category='general',priority=2,notes='',estimated_mins=0,tags='',due_date=null} = req.body;
  if(!text) return res.status(400).json({error:'Text required'});
  const r = await db.pRun('INSERT INTO tasks (user_id,text,category,priority,notes,estimated_mins,tags,due_date) VALUES (?,?,?,?,?,?,?,?)',[req.session.userId,text,category,priority,notes,estimated_mins,tags,due_date]);
  res.json({id:r.lastID,text,category,priority,status:'pending',date:t(),estimated_mins,tags,due_date});
};
exports.updateTask = async (req,res) => {
  const task = await db.pGet('SELECT * FROM tasks WHERE id=? AND user_id=?',[req.params.id,req.session.userId]);
  if(!task) return res.status(404).json({error:'Not found'});
  const {text,category,priority,status,notes,estimated_mins,actual_mins,tags,due_date} = req.body;
  await db.pRun('UPDATE tasks SET text=?,category=?,priority=?,status=?,notes=?,estimated_mins=?,actual_mins=?,tags=?,due_date=? WHERE id=?',
    [text||task.text,category||task.category,priority??task.priority,status||task.status,notes??task.notes,estimated_mins??task.estimated_mins,actual_mins??task.actual_mins,tags??task.tags,due_date!==undefined?due_date:task.due_date,task.id]);
  res.json({success:true});
};
exports.deleteTask = async (req,res) => {await db.pRun('DELETE FROM tasks WHERE id=? AND user_id=?',[req.params.id,req.session.userId]);res.json({success:true});};
exports.logFocus = async (req,res) => {
  const {topic,minutes=25,category='cyber',mood=3} = req.body;
  if(!topic) return res.status(400).json({error:'Topic required'});
  const r = await db.pRun('INSERT INTO focus_sessions (user_id,topic,minutes,category,mood) VALUES (?,?,?,?,?)',[req.session.userId,topic,minutes,category,mood]);
  res.json({id:r.lastID});
};
exports.getEnergy = async (req,res) => {const r=await db.pGet('SELECT level,mood FROM energy_logs WHERE user_id=? AND date=?',[req.session.userId,t()]);res.json({level:r?.level||null,mood:r?.mood||'neutral'});};
exports.setEnergy = async (req,res) => {const{level,mood='neutral'}=req.body;await db.pRun('INSERT OR REPLACE INTO energy_logs (user_id,level,mood,date) VALUES (?,?,?,?)',[req.session.userId,level,mood,t()]);res.json({success:true});};
