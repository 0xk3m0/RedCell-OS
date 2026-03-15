const db = require('../config/db');
const sj = (s,fb=[]) => { try{return JSON.parse(s||'[]')}catch{return fb} };

exports.getMaps = async (req,res) => res.json(await db.pAll('SELECT * FROM roadmap_maps WHERE user_id=? ORDER BY sort_order,created_at',[req.session.userId]));
exports.createMap = async (req,res) => {
  const {name,description='',icon='⬡',color='blue'} = req.body; if(!name) return res.status(400).json({error:'Name required'});
  const maxRow = await db.pGet('SELECT MAX(sort_order) as m FROM roadmap_maps WHERE user_id=?',[req.session.userId]);
  const r = await db.pRun('INSERT INTO roadmap_maps (user_id,name,description,icon,color,sort_order) VALUES (?,?,?,?,?,?)',[req.session.userId,name,description,icon,color,(maxRow?.m||0)+1]);
  res.json({id:r.lastID,name,description,icon,color});
};
exports.updateMap = async (req,res) => {
  const m = await db.pGet('SELECT * FROM roadmap_maps WHERE id=? AND user_id=?',[req.params.id,req.session.userId]); if(!m) return res.status(404).json({error:'Not found'});
  const {name,description,icon,color} = req.body;
  await db.pRun('UPDATE roadmap_maps SET name=?,description=?,icon=?,color=? WHERE id=?',[name||m.name,description??m.description,icon||m.icon,color||m.color,m.id]);
  res.json({success:true});
};
exports.deleteMap = async (req,res) => {
  const m = await db.pGet('SELECT * FROM roadmap_maps WHERE id=? AND user_id=?',[req.params.id,req.session.userId]); if(!m) return res.status(404).json({error:'Not found'});
  if(m.is_default) return res.status(400).json({error:'Cannot delete default map'});
  await db.pRun('DELETE FROM roadmap_maps WHERE id=?',[m.id]); res.json({success:true});
};
exports.getMap = async (req,res) => {
  const uid = req.session.userId;
  const map = await db.pGet('SELECT * FROM roadmap_maps WHERE id=? AND user_id=?',[req.params.mapId,uid]); if(!map) return res.status(404).json({error:'Not found'});
  const groups = await db.pAll('SELECT * FROM roadmap_groups WHERE map_id=? AND user_id=? ORDER BY sort_order',[map.id,uid]);
  const result = await Promise.all(groups.map(async g => {
    const items = await db.pAll('SELECT * FROM roadmap_items WHERE group_id=? AND user_id=? ORDER BY sort_order',[g.id,uid]);
    const withSubs = await Promise.all(items.map(async item => {
      const subs = await db.pAll('SELECT * FROM roadmap_subtopics WHERE item_id=? ORDER BY sort_order',[item.id]);
      return {...item,resources:sj(item.resources),labs:sj(item.labs),subtopics:subs};
    }));
    const prog = withSubs.length ? Math.round(withSubs.reduce((s,i)=>s+i.progress,0)/withSubs.length) : 0;
    return {...g,items:withSubs,progress:prog};
  }));
  const overall = result.length ? Math.round(result.reduce((s,g)=>s+g.progress,0)/result.length) : 0;
  res.json({map,groups:result,overall});
};
exports.createGroup = async (req,res) => {
  const {map_id,name,description='',icon='●',color='blue'} = req.body; if(!map_id||!name) return res.status(400).json({error:'map_id and name required'});
  const maxRow = await db.pGet('SELECT MAX(sort_order) as m FROM roadmap_groups WHERE map_id=?',[map_id]);
  const r = await db.pRun('INSERT INTO roadmap_groups (map_id,user_id,name,description,icon,color,sort_order) VALUES (?,?,?,?,?,?,?)',[map_id,req.session.userId,name,description,icon,color,(maxRow?.m||0)+1]);
  res.json({id:r.lastID,name,description,icon,color,map_id});
};
exports.updateGroup = async (req,res) => {
  const g = await db.pGet('SELECT * FROM roadmap_groups WHERE id=? AND user_id=?',[req.params.id,req.session.userId]); if(!g) return res.status(404).json({error:'Not found'});
  const {name,description,icon,color} = req.body;
  await db.pRun('UPDATE roadmap_groups SET name=?,description=?,icon=?,color=? WHERE id=?',[name||g.name,description??g.description,icon||g.icon,color||g.color,g.id]);
  res.json({success:true});
};
exports.deleteGroup = async (req,res) => {await db.pRun('DELETE FROM roadmap_groups WHERE id=? AND user_id=?',[req.params.id,req.session.userId]);res.json({success:true});};
exports.createItem = async (req,res) => {
  const {group_id,name,description='',difficulty='intermediate',estimated_hours=2,tags=''} = req.body; if(!group_id||!name) return res.status(400).json({error:'group_id and name required'});
  const maxRow = await db.pGet('SELECT MAX(sort_order) as m FROM roadmap_items WHERE group_id=?',[group_id]);
  const r = await db.pRun('INSERT INTO roadmap_items (group_id,user_id,name,description,difficulty,estimated_hours,tags,sort_order) VALUES (?,?,?,?,?,?,?,?)',[group_id,req.session.userId,name,description,difficulty,estimated_hours,tags,(maxRow?.m||0)+1]);
  res.json({id:r.lastID,name,description,difficulty,estimated_hours,tags,progress:0,status:'not-started',resources:[],labs:[],subtopics:[]});
};
exports.getItem = async (req,res) => {
  const item = await db.pGet('SELECT * FROM roadmap_items WHERE id=? AND user_id=?',[req.params.id,req.session.userId]); if(!item) return res.status(404).json({error:'Not found'});
  const subs = await db.pAll('SELECT * FROM roadmap_subtopics WHERE item_id=? ORDER BY sort_order',[item.id]);
  res.json({...item,resources:sj(item.resources),labs:sj(item.labs),subtopics:subs});
};
exports.updateItem = async (req,res) => {
  const item = await db.pGet('SELECT * FROM roadmap_items WHERE id=? AND user_id=?',[req.params.id,req.session.userId]); if(!item) return res.status(404).json({error:'Not found'});
  const {progress,notes,status,resources,labs,tags,name,description,difficulty,estimated_hours} = req.body;
  const newProg = progress!==undefined ? Math.min(100,Math.max(0,parseInt(progress))) : item.progress;
  const newStatus = status||(newProg===100?'completed':newProg>0?'in-progress':item.status);
  const completedAt = newStatus==='completed'&&item.status!=='completed' ? new Date().toISOString() : item.completed_at;
  await db.pRun('UPDATE roadmap_items SET name=?,description=?,difficulty=?,estimated_hours=?,progress=?,notes=?,status=?,resources=?,labs=?,tags=?,completed_at=? WHERE id=?',
    [name||item.name,description??item.description,difficulty||item.difficulty,estimated_hours??item.estimated_hours,newProg,notes??item.notes,newStatus,resources!==undefined?JSON.stringify(resources):item.resources,labs!==undefined?JSON.stringify(labs):item.labs,tags??item.tags,completedAt,item.id]);
  res.json({success:true,progress:newProg,status:newStatus});
};
exports.deleteItem = async (req,res) => {await db.pRun('DELETE FROM roadmap_items WHERE id=? AND user_id=?',[req.params.id,req.session.userId]);res.json({success:true});};
exports.addSubtopic = async (req,res) => {
  const {name} = req.body; if(!name) return res.status(400).json({error:'Name required'});
  const maxRow = await db.pGet('SELECT MAX(sort_order) as m FROM roadmap_subtopics WHERE item_id=?',[req.params.id]);
  const r = await db.pRun('INSERT INTO roadmap_subtopics (item_id,user_id,name,sort_order) VALUES (?,?,?,?)',[req.params.id,req.session.userId,name,(maxRow?.m||0)+1]);
  res.json({id:r.lastID,name,done:0});
};
exports.toggleSubtopic = async (req,res) => {
  const sub = await db.pGet('SELECT * FROM roadmap_subtopics WHERE id=? AND user_id=?',[req.params.subId,req.session.userId]); if(!sub) return res.status(404).json({error:'Not found'});
  await db.pRun('UPDATE roadmap_subtopics SET done=? WHERE id=?',[sub.done?0:1,sub.id]);
  const all = await db.pAll('SELECT done FROM roadmap_subtopics WHERE item_id=?',[sub.item_id]);
  const autoProg = all.length ? Math.round(all.filter(s=>s.done).length/all.length*100) : 0;
  const ns = autoProg===100?'completed':autoProg>0?'in-progress':'not-started';
  await db.pRun('UPDATE roadmap_items SET progress=?,status=? WHERE id=?',[autoProg,ns,sub.item_id]);
  res.json({success:true,done:!sub.done,itemProgress:autoProg,itemStatus:ns});
};
exports.deleteSubtopic = async (req,res) => {await db.pRun('DELETE FROM roadmap_subtopics WHERE id=? AND user_id=?',[req.params.subId,req.session.userId]);res.json({success:true});};
exports.addResource = async (req,res) => {
  const item = await db.pGet('SELECT * FROM roadmap_items WHERE id=? AND user_id=?',[req.params.id,req.session.userId]); if(!item) return res.status(404).json({error:'Not found'});
  const {title,url,type='reference'} = req.body; if(!title||!url) return res.status(400).json({error:'title and url required'});
  const resources = [...sj(item.resources),{title,url,type}];
  await db.pRun('UPDATE roadmap_items SET resources=? WHERE id=?',[JSON.stringify(resources),item.id]);
  res.json({success:true,resources});
};
exports.deleteResource = async (req,res) => {
  const item = await db.pGet('SELECT * FROM roadmap_items WHERE id=? AND user_id=?',[req.params.id,req.session.userId]); if(!item) return res.status(404).json({error:'Not found'});
  const resources = sj(item.resources).filter((_,i)=>i!==+req.params.idx);
  await db.pRun('UPDATE roadmap_items SET resources=? WHERE id=?',[JSON.stringify(resources),item.id]);
  res.json({success:true,resources});
};
exports.addLab = async (req,res) => {
  const item = await db.pGet('SELECT * FROM roadmap_items WHERE id=? AND user_id=?',[req.params.id,req.session.userId]); if(!item) return res.status(404).json({error:'Not found'});
  const {title,url,platform='External'} = req.body; if(!title||!url) return res.status(400).json({error:'title and url required'});
  const labs = [...sj(item.labs),{title,url,platform}];
  await db.pRun('UPDATE roadmap_items SET labs=? WHERE id=?',[JSON.stringify(labs),item.id]);
  res.json({success:true,labs});
};
exports.getStats = async (req,res) => {
  const uid = req.session.userId;
  const [total,completed,inProgress,subsTotal,subsDone] = await Promise.all([
    db.pGet('SELECT COUNT(*) c FROM roadmap_items WHERE user_id=?',[uid]),
    db.pGet('SELECT COUNT(*) c FROM roadmap_items WHERE user_id=? AND status="completed"',[uid]),
    db.pGet('SELECT COUNT(*) c FROM roadmap_items WHERE user_id=? AND status="in-progress"',[uid]),
    db.pGet('SELECT COUNT(*) c FROM roadmap_subtopics WHERE user_id=?',[uid]),
    db.pGet('SELECT COUNT(*) c FROM roadmap_subtopics WHERE user_id=? AND done=1',[uid]),
  ]);
  const avgRow = await db.pGet('SELECT AVG(progress) a FROM roadmap_items WHERE user_id=?',[uid]);
  res.json({total:total.c,completed:completed.c,inProgress:inProgress.c,subsTotal:subsTotal.c,subsDone:subsDone.c,overall:Math.round(avgRow.a||0)});
};
