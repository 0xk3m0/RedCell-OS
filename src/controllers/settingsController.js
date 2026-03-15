const db = require('../config/db');
const bcrypt = require('bcryptjs');
exports.get = async (req,res) => res.json(await db.pGet('SELECT id,username,email,mission,bio,focus_duration,daily_focus_target,theme,accent_color,timezone,notifications_enabled,sound_enabled,avatar_letter,created_at FROM users WHERE id=?',[req.session.userId]));
exports.update = async (req,res) => {
  const {mission,bio,focus_duration,daily_focus_target,theme,accent_color,timezone,notifications_enabled,sound_enabled,avatar_letter} = req.body;
  await db.pRun('UPDATE users SET mission=?,bio=?,focus_duration=?,daily_focus_target=?,theme=?,accent_color=?,timezone=?,notifications_enabled=?,sound_enabled=?,avatar_letter=? WHERE id=?',
    [mission,bio||'',focus_duration||25,daily_focus_target||4,theme||'dark',accent_color||'blue',timezone||'Africa/Cairo',notifications_enabled??1,sound_enabled??0,avatar_letter||'K',req.session.userId]);
  res.json({success:true});
};
exports.changePassword = async (req,res) => {
  const {current,newPassword} = req.body;
  if(!current||!newPassword) return res.status(400).json({error:'Both fields required'});
  if(newPassword.length<6) return res.status(400).json({error:'Password min 6 characters'});
  const user = await db.pGet('SELECT password FROM users WHERE id=?',[req.session.userId]);
  if(!await bcrypt.compare(current,user.password)) return res.status(400).json({error:'Current password incorrect'});
  await db.pRun('UPDATE users SET password=? WHERE id=?',[await bcrypt.hash(newPassword,12),req.session.userId]);
  res.json({success:true});
};
exports.deleteAccount = async (req,res) => {
  const {password} = req.body;
  const user = await db.pGet('SELECT password FROM users WHERE id=?',[req.session.userId]);
  if(!await bcrypt.compare(password,user.password)) return res.status(400).json({error:'Password incorrect'});
  await db.pRun('DELETE FROM users WHERE id=?',[req.session.userId]);
  req.session.destroy(()=>res.json({success:true}));
};
exports.getStats = async (req,res) => {
  const uid = req.session.userId;
  const [tasks,sessions,habits,notes,projects] = await Promise.all([
    db.pGet('SELECT COUNT(*) c FROM tasks WHERE user_id=?',[uid]),
    db.pGet('SELECT COUNT(*) c,COALESCE(SUM(minutes),0) m FROM focus_sessions WHERE user_id=?',[uid]),
    db.pGet('SELECT COUNT(*) c FROM habit_logs WHERE user_id=?',[uid]),
    db.pGet('SELECT COUNT(*) c FROM notes WHERE user_id=?',[uid]),
    db.pGet('SELECT COUNT(*) c FROM projects WHERE user_id=?',[uid]),
  ]);
  const member = await db.pGet('SELECT created_at FROM users WHERE id=?',[uid]);
  const days = Math.round((new Date()-new Date(member.created_at))/(1000*60*60*24));
  res.json({tasks:tasks.c,sessions:sessions.c,focusHours:Math.round(sessions.m/60),habits:habits.c,notes:notes.c,projects:projects.c,memberDays:days});
};
