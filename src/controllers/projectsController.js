const db = require('../config/db');
exports.getAll = async (req,res) => res.json(await db.pAll('SELECT * FROM projects WHERE user_id=? ORDER BY sort_order,created_at DESC',[req.session.userId]));
exports.getOne = async (req,res) => {
  const p = await db.pGet('SELECT * FROM projects WHERE id=? AND user_id=?',[req.params.id,req.session.userId]); if(!p) return res.status(404).json({error:'Not found'});
  const [tasks,noteRow] = await Promise.all([db.pAll('SELECT * FROM project_tasks WHERE project_id=? ORDER BY sort_order',[p.id]),db.pGet('SELECT content FROM project_notes WHERE project_id=?',[p.id])]);
  res.json({...p,tasks,note:noteRow?.content||''});
};
exports.create = async (req,res) => {
  const {name,description='',status='planning',stage='idea',priority='medium',tags='',github_url='',live_url='',tech_stack='',color='blue',start_date='',target_date=''} = req.body;
  if(!name) return res.status(400).json({error:'Name required'});
  const maxRow = await db.pGet('SELECT MAX(sort_order) as m FROM projects WHERE user_id=?',[req.session.userId]);
  const r = await db.pRun('INSERT INTO projects (user_id,name,description,status,stage,priority,tags,github_url,live_url,tech_stack,color,start_date,target_date,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[req.session.userId,name,description,status,stage,priority,tags,github_url,live_url,tech_stack,color,start_date,target_date,(maxRow?.m||0)+1]);
  res.json({id:r.lastID,name,description,status,stage,priority,tags,color,progress:0});
};
exports.update = async (req,res) => {
  const p = await db.pGet('SELECT * FROM projects WHERE id=? AND user_id=?',[req.params.id,req.session.userId]); if(!p) return res.status(404).json({error:'Not found'});
  const flds = ['name','description','status','stage','priority','tags','github_url','live_url','tech_stack','color','cv_ready','progress','start_date','target_date'];
  const vals = flds.map(f=>req.body[f]!==undefined?req.body[f]:p[f]);
  await db.pRun(`UPDATE projects SET ${flds.map(f=>f+'=?').join(',')} WHERE id=?`,[...vals,p.id]);
  res.json({success:true});
};
exports.remove = async (req,res) => {await db.pRun('DELETE FROM projects WHERE id=? AND user_id=?',[req.params.id,req.session.userId]);res.json({success:true});};
exports.addTask = async (req,res) => {
  const {text} = req.body; if(!text) return res.status(400).json({error:'Text required'});
  const maxRow = await db.pGet('SELECT MAX(sort_order) as m FROM project_tasks WHERE project_id=?',[req.params.id]);
  const r = await db.pRun('INSERT INTO project_tasks (project_id,user_id,text,sort_order) VALUES (?,?,?,?)',[req.params.id,req.session.userId,text,(maxRow?.m||0)+1]);
  res.json({id:r.lastID,text,done:0});
};
exports.toggleTask = async (req,res) => {
  const task = await db.pGet('SELECT * FROM project_tasks WHERE id=? AND user_id=?',[req.params.taskId,req.session.userId]); if(!task) return res.status(404).json({error:'Not found'});
  await db.pRun('UPDATE project_tasks SET done=? WHERE id=?',[task.done?0:1,task.id]);
  const all = await db.pAll('SELECT done FROM project_tasks WHERE project_id=?',[task.project_id]);
  if(all.length){const prog=Math.round(all.filter(x=>x.done).length/all.length*100);await db.pRun('UPDATE projects SET progress=? WHERE id=?',[prog,task.project_id]);}
  res.json({success:true,done:!task.done});
};
exports.deleteTask = async (req,res) => {await db.pRun('DELETE FROM project_tasks WHERE id=? AND user_id=?',[req.params.taskId,req.session.userId]);res.json({success:true});};
exports.saveNote = async (req,res) => {
  const {content=''} = req.body;
  const ex = await db.pGet('SELECT id FROM project_notes WHERE project_id=?',[req.params.id]);
  if(ex) await db.pRun('UPDATE project_notes SET content=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',[content,ex.id]);
  else await db.pRun('INSERT INTO project_notes (project_id,user_id,content) VALUES (?,?,?)',[req.params.id,req.session.userId,content]);
  res.json({success:true});
};
