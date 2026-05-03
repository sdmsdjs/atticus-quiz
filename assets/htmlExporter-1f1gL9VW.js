import{m as u,Q as c,s as g}from"./index-u4TUa9-E.js";const p=["A","B","C","D","E"],b=t=>t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),m=t=>{const n=t.trim().toUpperCase();if(!n)return null;if(/^\d+$/.test(n)){const r=Number(n)-1;return r>=0?r:null}const e=p.indexOf(n);return e>=0?e:null},h=t=>{const n=t.correctAnswer.split(",").map(m).filter(e=>e!==null);return new Set(n)},x=t=>{const n=t.correctAnswer.trim(),e=m(n);return e!==null&&t.options[e]?t.options[e]:n&&n!=="1"?n:t.options[0]||""},w=t=>t.questionType===c.Checkbox?2:t.questionType===c.FillInTheBlank?3:1,v=t=>{const n=new Map;return t.map(e=>{const r=w(e),o=(n.get(r)||0)+1;n.set(r,o);const i=h(e),l=Number(e.timeInSeconds)||60;return e.questionType===c.Checkbox?{title:`Câu ${o}`,part:r,type:"tf",content:e.questionText,explanation:e.answerExplanation,options:e.options.map((d,s)=>({label:`${String.fromCharCode(97+s)})`,text:d,is_correct:i.has(s)})),correct_answer:"",image:e.imageLink||void 0,time:l}:e.questionType===c.FillInTheBlank?{title:`Câu ${o}`,part:r,type:"short",content:e.questionText,explanation:e.answerExplanation,options:[],correct_answer:x(e),image:e.imageLink||void 0,time:l}:{title:`Câu ${o}`,part:r,type:"mc",content:e.questionText,explanation:e.answerExplanation,options:e.options.map((d,s)=>({label:p[s]||String(s+1),text:d,is_correct:i.has(s)})),correct_answer:"",image:e.imageLink||void 0,time:l}})},y=t=>JSON.stringify(t).replace(/</g,"\\u003C").replace(/>/g,"\\u003E").replace(/&/g,"\\u0026").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029"),a=t=>{const n=String(t||"");return/\\\(|\\\)|\\\[|\\\]|\\begin\{|\\end\{|\\frac|\\sqrt|\\sum|\\int|\\lim|\\times|\\cdot|\\leq|\\geq|\$\$|<math\b|<\/math>/i.test(n)||/\$[^$\n]{1,200}\$/.test(n)},S=t=>t.some(n=>a(n.content)||a(n.explanation)||a(n.correct_answer)||n.options.some(e=>a(e.text))),f=(t,n=u(t))=>{const e=b(n),r=v(t),o=y(r),i=S(r)?'<script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"><\/script>':"";return`<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>${e}</title>
${i}
<style>
:root { --base-size: 34px; --opt-size: 30px; --badge-size: 50px; --math-scale: 115%; }
* { box-sizing: border-box; }
body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; background: #f0fdf4; display: flex; flex-direction: column; align-items: center; min-height: 100dvh; margin: 0; overflow-x: hidden; overflow-y: auto; user-select: none; -webkit-tap-highlight-color: transparent; }
.slide-container { width: 95%; max-width: 1400px; min-height: 96vh; background: white; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); padding: 20px 30px; margin: 10px 0; display: none; flex-direction: column; position: relative; }
.slide-container.active { display: flex; animation: slideIn 0.3s ease-out; }
.q-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 10px; gap: 12px; flex-wrap: wrap; }
.header-left, .header-right { display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
.part-badge { background: #1e3a8a; color: white; padding: 10px 25px; border-radius: 30px; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.zoom-btn { width: 45px; height: 45px; border-radius: 50%; border: 2px solid #cbd5e1; background: white; color: #334155; font-size: 24px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; touch-action: manipulation; }
.zoom-btn:hover { background: #e2e8f0; color: #0f172a; border-color: #94a3b8; }
.zoom-btn:active { transform: scale(0.95); }
.search-btn { width: 42px; height: 42px; border-radius: 50%; border: 2px solid #93c5fd; background: #eff6ff; color: #1d4ed8; font-size: 20px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; touch-action: manipulation; }
.search-btn:hover { background: #dbeafe; color: #1e40af; border-color: #60a5fa; transform: translateY(-1px); }
.search-btn:active { transform: scale(0.95); }
.timer { font-size: 24px; color: #64748b; font-weight: 800; background: #f1f5f9; padding: 10px 25px; border-radius: 30px; cursor: pointer; border: 3px solid transparent; transition: 0.3s; display: flex; align-items: center; gap: 8px; min-width: 180px; justify-content: center; touch-action: manipulation; }
.timer:hover { background: #e2e8f0; }
.timer.running { color: #dc2626; background: #fee2e2; border-color: #fca5a5; animation: pulse 1s infinite; }
.btn-exit-html { background: #ef4444; color: white; border: none; padding: 10px 25px; border-radius: 30px; font-size: 20px; font-weight: 900; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; touch-action: manipulation; }
.btn-exit-html:hover { background: #dc2626; transform: translateY(-2px); box-shadow: 0 6px 10px rgba(0,0,0,0.2); }
.content-wrapper { flex-grow: 1; overflow-y: auto; padding-right: 15px; padding-bottom: 30px; display: flex; flex-direction: column; }
.question-content { font-size: var(--base-size); font-weight: 600; color: #1e293b; margin-bottom: 10px; line-height: 1.5; text-align: justify; white-space: normal; }
.q-label { color: #d97706; font-weight: 900; margin-right: 10px; }
mjx-container { font-size: var(--math-scale) !important; margin: 0 4px !important; }
.img-container { text-align: center; margin: 5px 0 15px; width: 100%; }
.real-image { display: inline-block; max-width: 90%; height: auto; max-height: 400px; border-radius: 12px; border: 2px solid #cbd5e1; box-shadow: 0 6px 10px rgba(0,0,0,0.1); cursor: ns-resize; }
.img-hint { font-size: 14px; color: #64748b; font-style: italic; margin-top: 5px; opacity: 0.8; }
.image-error { display: inline-flex; align-items: center; justify-content: center; min-height: 120px; width: min(620px, 90%); border: 2px dashed #fca5a5; border-radius: 12px; background: #fff7ed; color: #991b1b; font-size: 18px; font-weight: 900; padding: 16px; }
.options-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px; }
.options-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
.options-grid-1 { display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 20px; }
.btn-option { background: #fff; border: 3px solid #cbd5e1; padding: 15px; font-size: var(--opt-size); border-radius: 16px; cursor: pointer; text-align: left; font-weight: 600; color: #334155; transition: 0.2s; display: grid; grid-template-columns: var(--badge-size) 1fr; align-items: flex-start; gap: 15px; box-shadow: 0 4px 0 #cbd5e1; touch-action: manipulation; line-height: 1.3; min-width: 0; }
.btn-option:active { transform: translateY(4px); box-shadow: none; }
.btn-option:hover { border-color: #94a3b8; background-color: #f8fafc; }
.opt-badge { width: var(--badge-size); height: var(--badge-size); min-width: var(--badge-size); background-color: #15803d; color: white; border-radius: 12px; display: flex; justify-content: center; align-items: center; font-weight: 900; flex-shrink: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.2); margin-top: 2px; }
.btn-option.correct { background: #dcfce7 !important; border-color: #22c55e !important; color: #14532d !important; box-shadow: 0 4px 0 #22c55e; }
.btn-option.correct .opt-badge { background-color: #166534; }
.btn-option.wrong { opacity: 0.6; background: #fee2e2 !important; border-color: #ef4444 !important; }
.btn-option.wrong .opt-badge { background-color: #991b1b; }
.tf-container { display: flex; flex-direction: column; gap: 15px; margin-bottom: 25px; }
.tf-row { display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 15px 25px; border-radius: 16px; border: 2px solid #e2e8f0; box-shadow: 0 3px 6px rgba(0,0,0,0.03); gap: 20px; }
.tf-content { font-size: var(--opt-size); font-weight: 600; color: #334155; flex-grow: 1; }
.tf-buttons { display: flex; gap: 15px; min-width: 180px; }
.btn-tf { border: 3px solid #cbd5e1; background: #f8fafc; padding: 10px 0; border-radius: 10px; font-weight: 800; cursor: pointer; flex: 1; transition: 0.2s; color: #64748b; text-align: center; font-size: 24px; touch-action: manipulation; }
.btn-tf:hover { background: #e2e8f0; }
.btn-tf.user-correct { background: #22c55e !important; color: white !important; border-color: #16a34a !important; }
.btn-tf.user-wrong { background: #ef4444 !important; color: white !important; border-color: #dc2626 !important; }
.btn-tf.reveal-true { border: 4px solid #22c55e !important; color: #16a34a !important; background: #dcfce7 !important; }
.short-answer-area { display: flex; flex-direction: column; align-items: center; margin-bottom: 30px; width: 100%; }
.input-group { position: relative; width: min(720px, 90%); }
input.answer-input { width: 100%; padding: 20px 30px; font-size: 32px; border: 4px solid #cbd5e1; border-radius: 16px; outline: none; text-align: center; font-weight: 800; color: #334155; background: #f8fafc; transition: 0.3s; touch-action: manipulation; }
input.answer-input:focus { border-color: #3b82f6; background: white; box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.15); }
.explanation-box { display: none; margin-top: 20px; padding: 25px; background: #f0f9ff; border-left: 8px solid #0ea5e9; border-radius: 12px; animation: fadeIn 0.4s; }
.explanation-title { font-weight: 900; color: #0284c7; margin-bottom: 12px; font-size: 28px; display: flex; align-items: center; gap: 10px; }
.explanation-content { font-size: var(--opt-size); color: #334155; line-height: 1.6; white-space: normal; }
.actions-area { display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: auto; padding-top: 15px; border-top: 3px solid #f1f5f9; flex-wrap: wrap; }
.btn-action { color: white; border: none; padding: 12px 25px; font-size: 20px; font-weight: 800; border-radius: 12px; cursor: pointer; transition: 0.2s; min-width: 180px; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 6px 0 rgba(0,0,0,0.2); touch-action: manipulation; }
.btn-action:active { transform: translateY(6px); box-shadow: none; }
.btn-reveal { background: #f59e0b; } .btn-check { background: #3b82f6; } .btn-explain { background: #10b981; }
.slide-counter { font-size: 20px; font-weight: 900; color: #475569; background: #e2e8f0; padding: 10px 25px; border-radius: 30px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); }
.nav-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 60px; height: 80px; background: rgba(51, 65, 89, 0.2); color: white; font-size: 40px; border: none; border-radius: 10px; cursor: pointer; transition: 0.3s; z-index: 100; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(5px); touch-action: manipulation; }
.nav-arrow:hover { background: rgba(51, 65, 89, 0.9); scale: 1.1; }
.nav-prev { left: 10px; } .nav-next { right: 10px; }
.feedback-popup { position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%) scale(0); display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; z-index: 9999; pointer-events: none; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); filter: drop-shadow(0 15px 25px rgba(0,0,0,0.3)); background: rgba(255, 255, 255, 0.95); padding: 20px 50px; border-radius: 30px; text-align: center; border: 5px solid transparent; }
.feedback-popup.correct { border-color: #22c55e; color: #15803d; }
.feedback-popup.wrong { border-color: #ef4444; color: #991b1b; }
.feedback-popup .emoji { font-size: 100px; line-height: 1; margin-bottom: 10px; }
.feedback-popup .message { font-size: 40px; font-weight: 900; white-space: nowrap; }
.feedback-popup.pop { transform: translate(-50%, -50%) scale(1); opacity: 1; }
.app-screen { width: 95%; max-width: 1400px; min-height: 96vh; background: white; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); padding: 28px 34px; margin: 10px 0; display: none; flex-direction: column; position: relative; }
.app-screen.active { display: flex; animation: slideIn 0.3s ease-out; }
.home-top, .summary-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; border-bottom: 3px solid #e2e8f0; padding-bottom: 18px; margin-bottom: 22px; flex-wrap: wrap; }
.home-title, .summary-title { margin: 0; color: #0f172a; font-size: 42px; line-height: 1.15; font-weight: 900; letter-spacing: 0; }
.home-subtitle, .summary-subtitle { margin: 8px 0 0; color: #475569; font-size: 20px; font-weight: 700; line-height: 1.4; }
.home-count { background: #ecfeff; border: 2px solid #67e8f9; color: #155e75; border-radius: 8px; padding: 12px 16px; font-size: 18px; font-weight: 900; min-width: 170px; text-align: center; }
.mode-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
.mode-card { text-align: left; background: #ffffff; border: 3px solid #cbd5e1; border-radius: 8px; padding: 18px; cursor: pointer; color: #1e293b; box-shadow: 0 5px 0 #cbd5e1; transition: 0.2s; min-height: 150px; display: flex; flex-direction: column; justify-content: space-between; }
.mode-card:hover { border-color: #0f766e; box-shadow: 0 5px 0 #0f766e; transform: translateY(-2px); }
.mode-card:active { transform: translateY(5px); box-shadow: none; }
.mode-card.disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: 0 5px 0 #cbd5e1; border-color: #cbd5e1; }
.mode-card-title { font-size: 24px; line-height: 1.25; font-weight: 900; margin-bottom: 10px; color: #0f172a; }
.mode-card-desc { font-size: 17px; line-height: 1.45; font-weight: 650; color: #475569; }
.mode-card-foot { margin-top: 16px; color: #0f766e; font-size: 16px; font-weight: 900; }
.mode-badge { background: #fef3c7; color: #92400e; padding: 9px 15px; border-radius: 8px; font-size: 17px; font-weight: 900; border: 2px solid #fbbf24; }
.btn-home-html { background: #0f766e; color: white; border: none; padding: 10px 20px; border-radius: 30px; font-size: 18px; font-weight: 900; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; touch-action: manipulation; }
.btn-home-html:hover { background: #115e59; transform: translateY(-2px); }
.btn-next { background: #1e3a8a; }
.notice-toast { position: absolute; left: 50%; bottom: 95px; transform: translateX(-50%); background: #0f172a; color: white; padding: 12px 18px; border-radius: 8px; font-size: 18px; font-weight: 850; z-index: 10000; box-shadow: 0 10px 20px rgba(15, 23, 42, 0.22); animation: fadeIn 0.2s ease-out; max-width: min(620px, 90%); text-align: center; }
.summary-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 18px; }
.summary-stat { border: 2px solid #cbd5e1; border-radius: 8px; padding: 16px; background: #f8fafc; }
.summary-stat-value { color: #0f172a; font-size: 36px; line-height: 1; font-weight: 950; }
.summary-stat-label { margin-top: 8px; color: #475569; font-size: 16px; font-weight: 850; }
.summary-actions { display: flex; gap: 14px; flex-wrap: wrap; margin: 14px 0 22px; }
.summary-button { color: white; border: none; padding: 12px 20px; border-radius: 8px; font-size: 18px; font-weight: 900; cursor: pointer; background: #1e3a8a; box-shadow: 0 5px 0 rgba(0,0,0,0.2); }
.summary-button.secondary { background: #0f766e; }
.summary-button.warning { background: #d97706; }
.summary-button.light { color: #1e293b; background: #e2e8f0; }
.summary-button:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
.summary-table { width: 100%; border-collapse: collapse; margin: 10px 0 22px; overflow: hidden; border-radius: 8px; }
.summary-table th, .summary-table td { border: 2px solid #e2e8f0; padding: 12px; text-align: left; font-size: 17px; }
.summary-table th { background: #f1f5f9; color: #0f172a; font-weight: 900; }
.review-section { margin-top: 24px; border-top: 3px solid #e2e8f0; padding-top: 20px; }
.review-title-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; }
.review-title { margin: 0; color: #0f172a; font-size: 28px; font-weight: 950; line-height: 1.2; }
.review-note { color: #475569; font-size: 16px; font-weight: 750; }
.review-list { display: grid; grid-template-columns: 1fr; gap: 14px; padding-bottom: 20px; }
.review-card { border: 2px solid #cbd5e1; border-radius: 10px; background: #ffffff; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06); }
.review-card.wrong { border-color: #fca5a5; }
.review-card.correct { border-color: #86efac; }
.review-head { display: flex; align-items: center; gap: 12px; justify-content: space-between; background: #f8fafc; padding: 12px 16px; border-bottom: 2px solid #e2e8f0; flex-wrap: wrap; }
.review-head-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.review-index { width: 42px; height: 42px; border-radius: 8px; background: #1e3a8a; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 950; }
.review-chip { border-radius: 999px; padding: 7px 12px; font-size: 14px; font-weight: 950; }
.review-chip.correct { background: #dcfce7; color: #166534; }
.review-chip.wrong { background: #fee2e2; color: #991b1b; }
.review-type { color: #334155; font-size: 15px; font-weight: 850; }
.review-attempts { color: #64748b; font-size: 15px; font-weight: 850; }
.review-body { padding: 16px; }
.review-question { color: #0f172a; font-size: 20px; line-height: 1.45; font-weight: 850; margin-bottom: 14px; }
.review-image { margin: 0 0 14px; border: 2px solid #e2e8f0; border-radius: 8px; background: #f8fafc; padding: 10px; text-align: center; }
.review-image img { max-width: 100%; max-height: 240px; object-fit: contain; border-radius: 6px; background: white; }
.review-answer-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
.review-answer { border: 2px solid #e2e8f0; border-radius: 8px; background: #f8fafc; padding: 12px; min-width: 0; }
.review-answer.user.wrong { border-color: #fed7aa; background: #fff7ed; }
.review-answer.user.correct { border-color: #bbf7d0; background: #f0fdf4; }
.review-answer.key { border-color: #bae6fd; background: #f0f9ff; }
.review-answer-label { color: #475569; font-size: 14px; font-weight: 950; margin-bottom: 6px; text-transform: uppercase; }
.review-answer-text { color: #0f172a; font-size: 17px; line-height: 1.45; font-weight: 700; }
.review-explain { border: 2px solid #e0f2fe; background: #f8fafc; border-radius: 8px; padding: 12px; color: #334155; font-size: 16px; line-height: 1.5; }
.review-explain-title { color: #0369a1; font-weight: 950; margin-bottom: 6px; }
.empty-mistakes { border: 2px solid #bbf7d0; border-radius: 8px; background: #f0fdf4; color: #14532d; padding: 18px; font-size: 20px; font-weight: 900; }
@keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
@media (max-width: 900px) {
  :root { --base-size: 24px; --opt-size: 21px; --badge-size: 42px; }
  .slide-container { width: 100%; min-height: 100dvh; border-radius: 0; margin: 0; padding: 14px; }
  .app-screen { width: 100%; min-height: 100dvh; border-radius: 0; margin: 0; padding: 18px 14px; }
  .home-title, .summary-title { font-size: 32px; }
  .home-subtitle, .summary-subtitle { font-size: 17px; }
  .options-grid-4, .options-grid-2 { grid-template-columns: 1fr; }
  .tf-row { align-items: stretch; flex-direction: column; padding: 14px; }
  .tf-buttons { width: 100%; min-width: 0; }
  .nav-arrow { width: 46px; height: 64px; font-size: 32px; }
  .btn-action { min-width: 140px; font-size: 17px; }
  .timer { min-width: 150px; font-size: 18px; }
  .review-answer-grid { grid-template-columns: 1fr; }
  .review-question { font-size: 18px; }
}
</style>
</head>
<body>
<div id="home-screen" class="app-screen"></div>
<div id="slides-root"></div>
<div id="summary-screen" class="app-screen"></div>
<script>
let currentSlide = 0;
let slides = [];
let timerInterval = null;
let audioCtx = null;
function getAudioCtx() { if(!audioCtx) { const Ctx = window.AudioContext || window.webkitAudioContext; if(Ctx) audioCtx = new Ctx(); } return audioCtx; }
function playSound(type) {
    const ctx = getAudioCtx(); if (!ctx) return; if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination);
    const now = ctx.currentTime;
    if (type === 'correct') { osc.frequency.setValueAtTime(800, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3); osc.start(); osc.stop(now + 0.3); if(navigator.vibrate) navigator.vibrate([100, 50, 100]); }
    else if (type === 'wrong') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3); osc.start(); osc.stop(now + 0.3); if(navigator.vibrate) navigator.vibrate(200); }
    else if (type === 'tick') { osc.type = 'triangle'; osc.frequency.setValueAtTime(1000, now); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(); osc.stop(now + 0.1); }
    else if (type === 'timeup') { osc.type = 'square'; osc.frequency.setValueAtTime(400, now); gain.gain.setValueAtTime(1.5, now); osc.start(now); osc.stop(now + 1.0); }
}
const msgCorrect = ["Tuyệt vời!", "Chính xác!", "Quá đỉnh!", "Xuất sắc!", "Giỏi quá!", "10 điểm!"];
const msgWrong = ["Cố lên nhé!", "Chưa chính xác!", "Hãy thử lại!", "Cẩn thận hơn!", "Đừng nản chí!", "Suýt nữa thì đúng!"];
function esc(value) {
    return String(value || '').replace(/[&<>"']/g, function(ch) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
}
function lines(value) { return esc(value).replace(/\\n/g, '<br>'); }
function formatTime(s) { let m = Math.floor(s/60); let sec = s%60; return (m<10?'0':'') + m + ':' + (sec<10?'0':'') + sec; }
function b64Encode(value) { return btoa(unescape(encodeURIComponent(String(value || '')))); }
function normalizedText(el) {
    return el ? String(el.textContent || '').replace(/\\s+/g, ' ').trim() : '';
}
function optionSearchText(btn) {
    const clone = btn.cloneNode(true);
    const badge = clone.querySelector('.opt-badge');
    const label = badge ? normalizedText(badge) : '';
    if (badge) badge.remove();
    const text = normalizedText(clone);
    return (label && text ? label + '. ' : label) + text;
}
function currentSearchQuery() {
    const slide = document.querySelector('.slide-container.active');
    if (!slide) return '';
    const parts = [];
    const question = normalizedText(slide.querySelector('.question-content'));
    if (question) parts.push(question);
    slide.querySelectorAll('.btn-option').forEach(function(btn) {
        const text = optionSearchText(btn);
        if (text) parts.push(text);
    });
    slide.querySelectorAll('.tf-content').forEach(function(row) {
        const text = normalizedText(row);
        if (text) parts.push(text);
    });
    const input = slide.querySelector('.answer-input');
    if (input && input.value.trim()) parts.push('Dap an da nhap: ' + input.value.trim());
    return parts.join(' ');
}
function searchCurrentSlide() {
    const query = currentSearchQuery();
    if (!query) return;
    const url = 'https://www.google.com/search?q=' + encodeURIComponent(query);
    const tab = window.open(url, '_blank');
    if (tab) tab.opener = null;
    else window.location.href = url;
}
function buildSlides(data) {
    const root = document.getElementById('slides-root');
    root.innerHTML = data.map(function(item, index) {
        const time = parseInt(item.time || 60, 10);
        const image = item.image ? '<div class="img-container"><img class="real-image" src="' + esc(item.image) + '" onclick="openImage(this.src)" onerror="handleImageError(this)" style="width:80%"><div class="img-hint">Cuộn chuột trên ảnh để phóng to/thu nhỏ</div></div>' : '';
        let answerArea = '';
        let actions = '';
        if (item.type === 'mc') {
            const gridClass = item.options.length <= 2 ? 'options-grid-2' : (item.options.length === 4 ? 'options-grid-4' : 'options-grid-1');
            answerArea = '<div class="' + gridClass + '">' + item.options.map(function(opt) {
                return '<button class="btn-option" data-correct="' + Boolean(opt.is_correct) + '" onclick="checkChoice(this, ' + Boolean(opt.is_correct) + ')"><span class="opt-badge">' + esc(opt.label) + '</span><span>' + lines(opt.text) + '</span></button>';
            }).join('') + '</div>';
            actions = '<button class="btn-action btn-reveal" onclick="revealAnswerMC(this)">Hiện đáp án</button>';
        } else if (item.type === 'tf') {
            answerArea = '<div class="tf-container">' + item.options.map(function(opt) {
                return '<div class="tf-row" data-correct="' + Boolean(opt.is_correct) + '"><div class="tf-content"><b>' + esc(opt.label) + '</b> ' + lines(opt.text) + '</div><div class="tf-buttons"><button class="btn-tf" onclick="checkTF(this, true)">Đ</button><button class="btn-tf" onclick="checkTF(this, false)">S</button></div></div>';
            }).join('') + '</div>';
            actions = '<button class="btn-action btn-reveal" onclick="revealAnswerTF(this)">Hiện đáp án</button>';
        } else {
            const answerB64 = b64Encode(item.correct_answer);
            answerArea = '<div class="short-answer-area"><div class="input-group"><input class="answer-input" placeholder="Nhập đáp án..." onkeydown="handleEnter(event, ' + index + ', \\'' + answerB64 + '\\')"></div></div>';
            actions = '<button id="btn-chk-' + index + '" class="btn-action btn-check" onclick="checkShort(this, \\'' + answerB64 + '\\')">Kiểm tra</button><button class="btn-action btn-reveal" onclick="revealShort(this, \\'' + answerB64 + '\\')">Hiện đáp án</button>';
        }
        return '<section id="slide-' + index + '" class="slide-container"><div class="q-header"><div class="header-left"><div class="part-badge">Phần ' + esc(item.part) + '</div></div><div class="header-right"><button class="search-btn" onclick="searchCurrentSlide()" title="Tim cau nay tren Google" aria-label="Tim cau nay tren Google">&#128269;</button><button class="zoom-btn" onclick="changeFontSize(-2)">−</button><button class="zoom-btn" onclick="changeFontSize(2)">+</button><div class="timer" data-time="' + time + '" onclick="startTimer(this)" ondblclick="editTimer(this)">⏳ Bắt đầu (' + formatTime(time) + ')</div><button class="btn-exit-html" onclick="window.close()">Thoát</button></div></div><div class="content-wrapper"><div class="question-content"><span class="q-label">' + esc(item.title) + '.</span>' + lines(item.content) + '</div>' + image + answerArea + '<div class="explanation-box"><div class="explanation-title">Giải thích</div><div class="explanation-content">' + lines(item.explanation || 'Chưa có giải thích.') + '</div></div></div><div class="actions-area">' + actions + '<button class="btn-action btn-explain" onclick="toggleExpl(this)">Giải thích</button><div class="slide-counter"></div></div><button class="nav-arrow nav-prev" onclick="prevSlide()">‹</button><button class="nav-arrow nav-next" onclick="nextSlide()">›</button><div class="feedback-anchor"></div></section>';
    }).join('');
}
function showFeedback(isCorrect, slideElement) {
    let popup = document.createElement('div'); popup.className = 'feedback-popup ' + (isCorrect ? 'correct' : 'wrong');
    let emoji = isCorrect ? '😄' : '😢'; let textArr = isCorrect ? msgCorrect : msgWrong;
    popup.innerHTML = '<div class="emoji">' + emoji + '</div><div class="message">' + textArr[Math.floor(Math.random() * textArr.length)] + '</div>';
    slideElement.appendChild(popup); setTimeout(function() { popup.classList.add('pop'); }, 10);
    setTimeout(function() { popup.classList.remove('pop'); setTimeout(function() { popup.remove(); }, 400); }, 1500);
}
function renderSlide(index) {
    clearInterval(timerInterval);
    document.querySelectorAll('.timer.running').forEach(function(el) {
        el.classList.remove('running');
        el.innerText = '⏳ Bắt đầu (' + formatTime(parseInt(el.dataset.time, 10)) + ')';
    });
    document.querySelectorAll('.slide-container').forEach(function(el) { el.classList.remove('active'); });
    const activeSlide = document.getElementById('slide-' + index);
    if (activeSlide) {
        activeSlide.classList.add('active'); currentSlide = index;
        document.querySelectorAll('.slide-counter').forEach(function(el) { el.innerText = 'Câu ' + (index + 1) + ' / ' + slides.length; });
        if (window.MathJax && !activeSlide.dataset.typeset) {
            MathJax.typesetPromise([activeSlide]).then(function() { activeSlide.dataset.typeset = 'true'; });
        }
    }
}
function changeFontSize(delta) {
    const root = document.documentElement; const style = getComputedStyle(root);
    let baseSize = parseInt(style.getPropertyValue('--base-size'), 10);
    if ((delta < 0 && baseSize <= 24) || (delta > 0 && baseSize >= 60)) return;
    root.style.setProperty('--base-size', (baseSize + delta) + 'px');
    root.style.setProperty('--opt-size', (baseSize + delta - 4) + 'px');
}
function startTimer(el) {
    if (el.classList.contains('running')) {
        clearInterval(timerInterval); el.classList.remove('running');
        el.innerText = '⏳ Bắt đầu (' + formatTime(parseInt(el.dataset.time, 10)) + ')';
        return;
    }
    clearInterval(timerInterval);
    let timeLeft = parseInt(el.dataset.time, 10); el.classList.add('running');
    timerInterval = setInterval(function() {
        timeLeft--; el.innerText = formatTime(timeLeft);
        if (timeLeft <= 5 && timeLeft > 0) playSound('tick');
        if (timeLeft <= 0) { clearInterval(timerInterval); el.classList.remove('running'); el.innerText = 'HẾT GIỜ!'; playSound('timeup'); }
    }, 1000);
}
function editTimer(el) {
    let n = prompt('Nhập thời gian (60 hoặc 1:30):', formatTime(parseInt(el.dataset.time, 10)));
    if(n) {
        let total; if(n.includes(':')) { let p = n.split(':'); total = (parseInt(p[0], 10) * 60) + (parseInt(p[1], 10) || 0); } else { total = parseInt(n, 10); }
        if(!isNaN(total) && total > 0) { el.dataset.time = total; el.innerText = '⏳ Bắt đầu (' + formatTime(total) + ')'; }
    }
}
function nextSlide() { if (currentSlide < slides.length - 1) renderSlide(currentSlide + 1); }
function prevSlide() { if (currentSlide > 0) renderSlide(currentSlide - 1); }
function openImage(src) { const w = window.open(''); if (w) w.document.write('<img src="' + src + '" style="max-width:100%;">'); }
function handleImageError(img) {
    img.style.display = 'none';
    const box = img.closest('.img-container') || img.parentElement;
    if (!box || box.querySelector('.image-error')) return;
    const error = document.createElement('div');
    error.className = 'image-error';
    error.textContent = 'Không tải được ảnh. Hãy nhúng ảnh trực tiếp hoặc kiểm tra lại URL.';
    box.insertBefore(error, box.firstChild);
}
function checkChoice(btn, isCorrect) {
    if (btn.classList.contains('checked')) return; const slide = btn.closest('.slide-container');
    if (isCorrect) { playSound('correct'); showFeedback(true, slide); btn.classList.add('correct', 'checked'); }
    else { playSound('wrong'); showFeedback(false, slide); btn.classList.add('wrong', 'checked'); }
}
function revealAnswerMC(btn) {
    const slide = btn.closest('.slide-container');
    slide.querySelectorAll('.btn-option[data-correct="true"]').forEach(function(corr) { corr.classList.add('correct', 'checked'); });
    btn.style.display = 'none';
}
function checkTF(btn, userChoice) {
    const row = btn.closest('.tf-row'); const isCorrect = (row.getAttribute('data-correct') === 'true');
    const slide = row.closest('.slide-container');
    if (userChoice === isCorrect) { playSound('correct'); showFeedback(true, slide); btn.classList.add('user-correct'); }
    else { playSound('wrong'); showFeedback(false, slide); btn.classList.add('user-wrong'); }
}
function revealAnswerTF(btn) {
    const slide = btn.closest('.slide-container');
    slide.querySelectorAll('.tf-row').forEach(function(r) {
        const isTrue = r.dataset.correct === 'true';
        r.querySelectorAll('.btn-tf').forEach(function(b) { if((b.innerText === 'Đ' && isTrue) || (b.innerText === 'S' && !isTrue)) b.classList.add('reveal-true'); });
    });
    btn.style.display = 'none';
}
function checkShort(btn, b64) {
    const slide = btn.closest('.slide-container'); const inp = slide.querySelector('input');
    let val = inp.value.trim().toLowerCase().replace(',', '.');
    let ans = decodeURIComponent(escape(atob(b64))).trim().toLowerCase().replace(',', '.');
    if(val === ans) { playSound('correct'); showFeedback(true, slide); inp.style.borderColor = '#22c55e'; }
    else { playSound('wrong'); showFeedback(false, slide); inp.style.borderColor = '#ef4444'; }
}
function revealShort(btn, b64) { const inp = btn.closest('.slide-container').querySelector('input'); inp.value = decodeURIComponent(escape(atob(b64))).trim(); }
function toggleExpl(btn) { const box = btn.closest('.slide-container').querySelector('.explanation-box'); box.style.display = box.style.display === 'block' ? 'none' : 'block'; }
function handleEnter(e, id, b64) { if (e.key === 'Enter') checkShort(document.getElementById('btn-chk-' + id), b64); }
function initImageZoom() {
    document.querySelectorAll('.real-image').forEach(function(img) {
        img.addEventListener('wheel', function(e) {
            e.preventDefault(); let delta = e.deltaY < 0 ? 5 : -5;
            let w = parseInt(img.style.width || '80', 10); w = Math.max(20, Math.min(200, w + delta));
            img.style.width = w + '%';
        });
    });
}
let ts = 0;
document.addEventListener('touchstart', function(e) { ts = e.changedTouches[0].screenX; }, {passive:true});
document.addEventListener('touchend', function(e) {
    if(document.activeElement && document.activeElement.tagName === 'INPUT') return;
    let te = e.changedTouches[0].screenX; if(Math.abs(ts - te) > 60) { if(ts > te) nextSlide(); else prevSlide(); }
}, {passive:true});
document.addEventListener('keydown', function(e) {
    if(document.activeElement && document.activeElement.tagName === 'INPUT') return;
    if(e.key === 'ArrowRight') nextSlide();
    if(e.key === 'ArrowLeft') prevSlide();
});
let allSlides = [];
let activeModeKey = 'normal';
let currentRunIsReview = false;
let sessionQuestionIds = [];
let answerRecords = {};
let wrongEverIds = {};
const practiceOptionLabels = ['A', 'B', 'C', 'D', 'E'];
const practiceMsgCorrect = [
    { icon: '&#127881;', text: 'Xuất sắc!' },
    { icon: '&#9989;', text: 'Chính xác!' },
    { icon: '&#128079;', text: 'Tốt lắm!' },
    { icon: '&#11088;', text: 'Đúng rồi!' }
];
const practiceMsgWrong = [
    { icon: '&#128533;', text: 'Chưa chính xác!' },
    { icon: '&#128161;', text: 'Thử lại nhé.' },
    { icon: '&#128221;', text: 'Cần ôn câu này.' },
    { icon: '&#128064;', text: 'Nhìn lại một chút.' }
];
const modeConfig = {
    normal: {
        title: 'Làm bài bình thường',
        desc: 'Làm từ đầu đến cuối, cuối bài xem điểm và các câu cần ôn.',
        foot: 'Phù hợp để kiểm tra nhanh',
        retryUntilCorrect: false,
        retryAtEnd: false,
        shuffleQuestions: false,
        shuffleAnswers: false
    },
    retryImmediate: {
        title: 'Sai thì làm lại ngay',
        desc: 'Nếu trả lời sai, câu đó chưa được tính qua cho đến khi bạn trả lời đúng hoặc hiện đáp án.',
        foot: 'Tốt cho học thuộc kỹ',
        retryUntilCorrect: true,
        retryAtEnd: false,
        shuffleQuestions: false,
        shuffleAnswers: false
    },
    retryEnd: {
        title: 'Gom câu sai để cuối bài',
        desc: 'Làm hết đề trước, sau đó tự động mở một vòng riêng gồm các câu sai và chưa trả lời.',
        foot: 'Tốt cho luyện đề dài',
        retryUntilCorrect: false,
        retryAtEnd: true,
        shuffleQuestions: false,
        shuffleAnswers: false
    },
    shuffleRetry: {
        title: 'Đảo câu + đáp án, ôn sai',
        desc: 'Xáo trộn thứ tự câu hỏi, xáo trộn đáp án, và gom câu sai để làm lại ở cuối.',
        foot: 'Chế độ luyện thật',
        retryUntilCorrect: false,
        retryAtEnd: true,
        shuffleQuestions: true,
        shuffleAnswers: true
    },
    previousWrong: {
        title: 'Chỉ làm câu sai lần trước',
        desc: 'Mở lại những câu đã sai trong lần tổng kết gần nhất của file này.',
        foot: 'Ôn đúng điểm yếu',
        retryUntilCorrect: true,
        retryAtEnd: false,
        shuffleQuestions: false,
        shuffleAnswers: false
    }
};
function b64Decode(value) { return decodeURIComponent(escape(atob(value))); }
function normalizeAnswer(value) { return String(value || '').trim().toLowerCase().replace(',', '.').replace(/\\s+/g, ' '); }
function getMode() { return modeConfig[activeModeKey] || modeConfig.normal; }
function cloneSlide(item) { return JSON.parse(JSON.stringify(item)); }
function uniqueIds(ids) {
    const seen = {};
    return ids.filter(function(id) {
        const n = Number(id);
        if (!Number.isInteger(n) || n < 0 || n >= allSlides.length || seen[n]) return false;
        seen[n] = true;
        return true;
    });
}
function hashString(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    return Math.abs(hash);
}
function quizStorageKey() {
    const first = allSlides[0] ? String(allSlides[0].content || '').slice(0, 140) : '';
    return 'quiz-html-wrong-v1-' + hashString(document.title + '|' + allSlides.length + '|' + first);
}
function getStoredWrongIds() {
    try {
        const raw = localStorage.getItem(quizStorageKey());
        return uniqueIds(JSON.parse(raw || '[]'));
    } catch (e) {
        return [];
    }
}
function saveStoredWrongIds(ids) {
    try {
        localStorage.setItem(quizStorageKey(), JSON.stringify(uniqueIds(ids)));
    } catch (e) {}
}
function shuffleArray(items) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = result[i]; result[i] = result[j]; result[j] = tmp;
    }
    return result;
}
function relabelOptions(item) {
    if (!item.options) return item;
    item.options.forEach(function(opt, index) {
        opt.label = item.type === 'tf' ? String.fromCharCode(97 + index) + ')' : (practiceOptionLabels[index] || String(index + 1));
    });
    return item;
}
function prepareSlides(ids) {
    const mode = getMode();
    let prepared = ids.map(function(id) {
        const copy = cloneSlide(allSlides[id]);
        copy._id = id;
        return copy;
    });
    if (mode.shuffleAnswers) {
        prepared.forEach(function(item) {
            if ((item.type === 'mc' || item.type === 'tf') && item.options && item.options.length > 1) {
                item.options = shuffleArray(item.options.map(function(opt) { return Object.assign({}, opt); }));
                relabelOptions(item);
            }
        });
    }
    if (mode.shuffleQuestions) prepared = shuffleArray(prepared);
    return prepared;
}
function clearTimerUi() {
    clearInterval(timerInterval);
    timerInterval = null;
    document.querySelectorAll('.timer.running').forEach(function(el) {
        el.classList.remove('running');
        el.innerText = 'Bắt đầu (' + formatTime(parseInt(el.dataset.time, 10)) + ')';
    });
}
function setScreen(name) {
    clearTimerUi();
    const root = document.getElementById('slides-root');
    document.querySelectorAll('.slide-container').forEach(function(el) { el.classList.remove('active'); });
    document.getElementById('home-screen').classList.toggle('active', name === 'home');
    document.getElementById('summary-screen').classList.toggle('active', name === 'summary');
    root.style.display = name === 'quiz' ? 'block' : 'none';
}
function renderHome() {
    const prevWrongCount = getStoredWrongIds().length;
    const total = allSlides.length;
    const modeOrder = ['normal', 'retryImmediate', 'retryEnd', 'shuffleRetry', 'previousWrong'];
    const cards = modeOrder.map(function(key) {
        const mode = modeConfig[key];
        const disabled = key === 'previousWrong' && prevWrongCount === 0;
        const desc = key === 'previousWrong' && prevWrongCount > 0 ? mode.desc + ' Đang có ' + prevWrongCount + ' câu.' : mode.desc;
        return '<button class="mode-card' + (disabled ? ' disabled' : '') + '" ' + (disabled ? 'disabled' : 'onclick="startMode(\\'' + key + '\\')"') + '><div><div class="mode-card-title">' + esc(mode.title) + '</div><div class="mode-card-desc">' + esc(desc) + '</div></div><div class="mode-card-foot">' + esc(disabled ? 'Chưa có dữ liệu câu sai' : mode.foot) + '</div></button>';
    }).join('');
    document.getElementById('home-screen').innerHTML = '<div class="home-top"><div><h1 class="home-title">' + esc(document.title || 'Quiz') + '</h1><p class="home-subtitle">Chọn chế độ luyện tập trước khi bắt đầu.</p></div><div class="home-count">' + total + '<br>câu hỏi</div></div><div class="mode-grid">' + cards + '</div>';
    setScreen('home');
}
function startMode(key) {
    activeModeKey = modeConfig[key] ? key : 'normal';
    let ids = allSlides.map(function(_, index) { return index; });
    if (activeModeKey === 'previousWrong') ids = getStoredWrongIds();
    if (!ids.length) {
        renderHome();
        return;
    }
    startSession(activeModeKey, ids);
}
function startSession(key, ids) {
    activeModeKey = modeConfig[key] ? key : 'normal';
    sessionQuestionIds = uniqueIds(ids);
    answerRecords = {};
    wrongEverIds = {};
    startRun(sessionQuestionIds, false);
}
function startRun(ids, isReview) {
    currentRunIsReview = Boolean(isReview);
    slides = prepareSlides(uniqueIds(ids));
    buildSlides(slides);
    setScreen('quiz');
    renderSlide(0);
    initImageZoom();
}
function buildSlides(data) {
    const root = document.getElementById('slides-root');
    root.innerHTML = data.map(function(item, index) {
        const time = parseInt(item.time || 60, 10);
        const image = item.image ? '<div class="img-container"><img class="real-image" src="' + esc(item.image) + '" onclick="openImage(this.src)" style="width:80%"><div class="img-hint">Cuộn chuột trên ảnh để phóng to/thu nhỏ</div></div>' : '';
        let answerArea = '';
        let actions = '';
        if (item.type === 'mc') {
            const gridClass = item.options.length <= 2 ? 'options-grid-2' : (item.options.length === 4 ? 'options-grid-4' : 'options-grid-1');
            answerArea = '<div class="' + gridClass + '">' + item.options.map(function(opt) {
                return '<button class="btn-option" data-correct="' + Boolean(opt.is_correct) + '" onclick="checkChoice(this)"><span class="opt-badge">' + esc(opt.label) + '</span><span>' + lines(opt.text) + '</span></button>';
            }).join('') + '</div>';
            actions = '<button class="btn-action btn-reveal" onclick="revealAnswerMC(this)">Hiện đáp án</button>';
        } else if (item.type === 'tf') {
            answerArea = '<div class="tf-container">' + item.options.map(function(opt) {
                return '<div class="tf-row" data-correct="' + Boolean(opt.is_correct) + '"><div class="tf-content"><b>' + esc(opt.label) + '</b> ' + lines(opt.text) + '</div><div class="tf-buttons"><button class="btn-tf" onclick="checkTF(this, true)">Đ</button><button class="btn-tf" onclick="checkTF(this, false)">S</button></div></div>';
            }).join('') + '</div>';
            actions = '<button class="btn-action btn-reveal" onclick="revealAnswerTF(this)">Hiện đáp án</button>';
        } else {
            const answerB64 = b64Encode(item.correct_answer);
            answerArea = '<div class="short-answer-area"><div class="input-group"><input class="answer-input" placeholder="Nhập đáp án..." onkeydown="handleEnter(event, ' + index + ', \\'' + answerB64 + '\\')"></div></div>';
            actions = '<button id="btn-chk-' + index + '" class="btn-action btn-check" onclick="checkShort(this, \\'' + answerB64 + '\\')">Kiểm tra</button><button class="btn-action btn-reveal" onclick="revealShort(this, \\'' + answerB64 + '\\')">Hiện đáp án</button>';
        }
        return '<section id="slide-' + index + '" class="slide-container" data-slide-index="' + index + '" data-original-index="' + item._id + '"><div class="q-header"><div class="header-left"><div class="part-badge">Phần ' + esc(item.part) + '</div><div class="mode-badge">' + esc(currentRunIsReview ? 'Vòng ôn câu sai' : getMode().title) + '</div></div><div class="header-right"><button class="search-btn" onclick="searchCurrentSlide()" title="Tim cau nay tren Google" aria-label="Tim cau nay tren Google">&#128269;</button><button class="zoom-btn" onclick="changeFontSize(-2)">-</button><button class="zoom-btn" onclick="changeFontSize(2)">+</button><div class="timer" data-time="' + time + '" onclick="startTimer(this)" ondblclick="editTimer(this)">Bắt đầu (' + formatTime(time) + ')</div><button class="btn-home-html" onclick="renderHome()">Trang chủ</button><button class="btn-exit-html" onclick="window.close()">Thoát</button></div></div><div class="content-wrapper"><div class="question-content"><span class="q-label">' + esc(item.title) + '.</span>' + lines(item.content) + '</div>' + image + answerArea + '<div class="explanation-box"><div class="explanation-title">Giải thích</div><div class="explanation-content">' + lines(item.explanation || 'Chưa có giải thích.') + '</div></div></div><div class="actions-area">' + actions + '<button class="btn-action btn-explain" onclick="toggleExpl(this)">Giải thích</button><div class="slide-counter"></div></div><button class="nav-arrow nav-prev" onclick="prevSlide()">&lt;</button><button class="nav-arrow nav-next" onclick="nextSlide()">&gt;</button><div class="feedback-anchor"></div></section>';
    }).join('');
}
function showFeedback(isCorrect, slideElement) {
    if (!slideElement) return;
    let popup = document.createElement('div');
    popup.className = 'feedback-popup ' + (isCorrect ? 'correct' : 'wrong');
    const textArr = isCorrect ? practiceMsgCorrect : practiceMsgWrong;
    const item = textArr[Math.floor(Math.random() * textArr.length)];
    popup.innerHTML = '<div class="emoji">' + item.icon + '</div><div class="message">' + esc(item.text) + '</div>';
    slideElement.appendChild(popup);
    setTimeout(function() { popup.classList.add('pop'); }, 10);
    setTimeout(function() { popup.classList.remove('pop'); setTimeout(function() { popup.remove(); }, 400); }, 1500);
}
function showNotice(slide, text) {
    if (!slide) return;
    const old = slide.querySelector('.notice-toast');
    if (old) old.remove();
    const notice = document.createElement('div');
    notice.className = 'notice-toast';
    notice.textContent = text;
    slide.appendChild(notice);
    setTimeout(function() { notice.remove(); }, 1800);
}
function renderSlide(index) {
    clearTimerUi();
    document.querySelectorAll('.slide-container').forEach(function(el) { el.classList.remove('active'); });
    const activeSlide = document.getElementById('slide-' + index);
    if (activeSlide) {
        activeSlide.classList.add('active');
        currentSlide = index;
        document.querySelectorAll('.slide-counter').forEach(function(el) { el.innerText = 'Câu ' + (index + 1) + ' / ' + slides.length; });
        if (window.MathJax && !activeSlide.dataset.typeset) {
            MathJax.typesetPromise([activeSlide]).then(function() { activeSlide.dataset.typeset = 'true'; });
        }
        const timer = activeSlide.querySelector('.timer');
        if (timer) setTimeout(function() { if (activeSlide.classList.contains('active')) startTimer(timer); }, 80);
    }
}
function startTimer(el) {
    if (el.classList.contains('running')) {
        clearInterval(timerInterval);
        el.classList.remove('running');
        el.innerText = 'Bắt đầu (' + formatTime(parseInt(el.dataset.time, 10)) + ')';
        return;
    }
    clearInterval(timerInterval);
    let timeLeft = parseInt(el.dataset.time, 10);
    el.classList.add('running');
    timerInterval = setInterval(function() {
        timeLeft--;
        el.innerText = formatTime(timeLeft);
        if (timeLeft <= 5 && timeLeft > 0) playSound('tick');
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            el.classList.remove('running');
            el.innerText = 'HẾT GIỜ!';
            playSound('timeup');
        }
    }, 1000);
}
function editTimer(el) {
    let n = prompt('Nhập thời gian (60 hoặc 1:30):', formatTime(parseInt(el.dataset.time, 10)));
    if(n) {
        let total;
        if(n.includes(':')) {
            let p = n.split(':');
            total = (parseInt(p[0], 10) * 60) + (parseInt(p[1], 10) || 0);
        } else {
            total = parseInt(n, 10);
        }
        if(!isNaN(total) && total > 0) {
            el.dataset.time = total;
            el.innerText = 'Bắt đầu (' + formatTime(total) + ')';
        }
    }
}
function currentSlideElement() { return document.getElementById('slide-' + currentSlide); }
function ensureRecord(originalIndex) {
    const key = String(originalIndex);
    if (!answerRecords[key]) {
        answerRecords[key] = { attempts: 0, wrongAttempts: 0, wrongEver: false, finalCorrect: false, lastAnswer: '', lastCorrect: false };
    }
    return answerRecords[key];
}
function recordAnswer(slide, isCorrect, userAnswer) {
    if (!slide) return null;
    const item = slides[Number(slide.dataset.slideIndex)];
    if (!item) return null;
    const mode = getMode();
    const rec = ensureRecord(item._id);
    if (rec.finalCorrect && mode.retryUntilCorrect) return rec;
    const signature = String(isCorrect) + '|' + String(userAnswer || '');
    if (slide.dataset.lastAnswerSignature === signature && mode.retryUntilCorrect) return rec;
    slide.dataset.lastAnswerSignature = signature;
    rec.attempts += 1;
    rec.lastAnswer = userAnswer || '';
    rec.lastCorrect = Boolean(isCorrect);
    slide.dataset.answered = 'true';
    slide.dataset.correct = String(Boolean(isCorrect));
    if (isCorrect) {
        rec.finalCorrect = true;
    } else {
        rec.finalCorrect = false;
        rec.wrongEver = true;
        rec.wrongAttempts += 1;
        wrongEverIds[String(item._id)] = true;
    }
    return rec;
}
function canMoveForward() {
    const mode = getMode();
    if (!mode.retryUntilCorrect) return true;
    const slide = currentSlideElement();
    if (!slide) return true;
    if (slide.dataset.revealed === 'true') return true;
    const item = slides[currentSlide];
    const rec = item ? answerRecords[String(item._id)] : null;
    if (rec && rec.finalCorrect) return true;
    showNotice(slide, 'Chế độ này cần trả lời đúng câu hiện tại trước khi qua câu tiếp.');
    return false;
}
function collectWrongIds(includeUnanswered) {
    return uniqueIds(sessionQuestionIds.filter(function(id) {
        const rec = answerRecords[String(id)];
        if (!rec) return Boolean(includeUnanswered);
        return rec.wrongEver || !rec.finalCorrect;
    }));
}
function completeRun() {
    const mode = getMode();
    if (mode.retryAtEnd && !currentRunIsReview) {
        const wrongIds = collectWrongIds(true);
        if (wrongIds.length) {
            startRun(wrongIds, true);
            return;
        }
    }
    showSummary();
}
function nextSlide() {
    if (!canMoveForward()) return;
    if (currentSlide < slides.length - 1) renderSlide(currentSlide + 1);
    else completeRun();
}
function checkChoice(btn) {
    const slide = btn.closest('.slide-container');
    const mode = getMode();
    if (slide.dataset.answered === 'true' && !mode.retryUntilCorrect) return;
    if (btn.classList.contains('checked') && !mode.retryUntilCorrect) return;
    const isCorrect = btn.getAttribute('data-correct') === 'true';
    if (isCorrect) {
        playSound('correct');
        showFeedback(true, slide);
        btn.classList.add('correct', 'checked');
    } else {
        playSound('wrong');
        showFeedback(false, slide);
        btn.classList.add('wrong', 'checked');
    }
    recordAnswer(slide, isCorrect, btn.textContent.trim().replace(/\\s+/g, ' '));
}
function revealAnswerMC(btn) {
    const slide = btn.closest('.slide-container');
    slide.querySelectorAll('.btn-option[data-correct="true"]').forEach(function(corr) { corr.classList.add('correct', 'checked'); });
    if (slide.dataset.answered !== 'true' || getMode().retryUntilCorrect) recordAnswer(slide, false, 'Đã hiện đáp án');
    slide.dataset.revealed = 'true';
    btn.style.display = 'none';
}
function buildTfAnswer(slide) {
    return Array.prototype.map.call(slide.querySelectorAll('.tf-row'), function(row) {
        const label = row.querySelector('.tf-content b') ? row.querySelector('.tf-content b').textContent : '';
        const user = row.dataset.user === 'true' ? 'Đ' : (row.dataset.user === 'false' ? 'S' : '?');
        return label + ' ' + user;
    }).join('; ');
}
function checkTF(btn, userChoice) {
    const row = btn.closest('.tf-row');
    const isCorrect = row.getAttribute('data-correct') === 'true';
    const slide = row.closest('.slide-container');
    const mode = getMode();
    if (slide.dataset.answered === 'true' && !mode.retryUntilCorrect) return;
    row.dataset.user = String(Boolean(userChoice));
    row.querySelectorAll('.btn-tf').forEach(function(b) { b.classList.remove('user-correct', 'user-wrong'); });
    if (userChoice === isCorrect) { playSound('correct'); btn.classList.add('user-correct'); }
    else { playSound('wrong'); btn.classList.add('user-wrong'); }
    const rows = Array.prototype.slice.call(slide.querySelectorAll('.tf-row'));
    const allAnswered = rows.every(function(r) { return r.dataset.user === 'true' || r.dataset.user === 'false'; });
    if (allAnswered) {
        const wholeCorrect = rows.every(function(r) { return r.dataset.user === r.dataset.correct; });
        showFeedback(wholeCorrect, slide);
        recordAnswer(slide, wholeCorrect, buildTfAnswer(slide));
    }
}
function revealAnswerTF(btn) {
    const slide = btn.closest('.slide-container');
    slide.querySelectorAll('.tf-row').forEach(function(r) {
        const isTrue = r.dataset.correct === 'true';
        r.querySelectorAll('.btn-tf').forEach(function(b) {
            if((b.innerText === 'Đ' && isTrue) || (b.innerText === 'S' && !isTrue)) b.classList.add('reveal-true');
        });
    });
    if (slide.dataset.answered !== 'true' || getMode().retryUntilCorrect) recordAnswer(slide, false, 'Đã hiện đáp án');
    slide.dataset.revealed = 'true';
    btn.style.display = 'none';
}
function checkShort(btn, b64) {
    const slide = btn.closest('.slide-container');
    const inp = slide.querySelector('input');
    const mode = getMode();
    if (slide.dataset.answered === 'true' && !mode.retryUntilCorrect) return;
    const val = normalizeAnswer(inp.value);
    const ans = normalizeAnswer(b64Decode(b64));
    const isCorrect = val === ans;
    if(isCorrect) { playSound('correct'); showFeedback(true, slide); inp.style.borderColor = '#22c55e'; }
    else { playSound('wrong'); showFeedback(false, slide); inp.style.borderColor = '#ef4444'; }
    recordAnswer(slide, isCorrect, inp.value.trim());
}
function revealShort(btn, b64) {
    const slide = btn.closest('.slide-container');
    const inp = slide.querySelector('input');
    inp.value = b64Decode(b64).trim();
    if (slide.dataset.answered !== 'true' || getMode().retryUntilCorrect) recordAnswer(slide, false, 'Đã hiện đáp án');
    slide.dataset.revealed = 'true';
}
function handleEnter(e, id, b64) {
    if (e.key === 'Enter') checkShort(document.getElementById('btn-chk-' + id), b64);
}
function typeName(type) {
    if (type === 'mc') return 'Trắc nghiệm';
    if (type === 'tf') return 'Đúng/Sai';
    return 'Điền đáp án';
}
function correctAnswerText(item) {
    if (!item) return '';
    if (item.type === 'short') return item.correct_answer || '';
    if (item.type === 'tf') {
        return (item.options || []).map(function(opt) {
            return opt.label + ' ' + (opt.is_correct ? 'Đúng' : 'Sai') + ': ' + opt.text;
        }).join('; ');
    }
    return (item.options || []).filter(function(opt) { return opt.is_correct; }).map(function(opt) {
        return opt.label + '. ' + opt.text;
    }).join('; ');
}
function buildTypeRows(wrongIds) {
    const wrongSet = {};
    wrongIds.forEach(function(id) { wrongSet[String(id)] = true; });
    const stats = {};
    sessionQuestionIds.forEach(function(id) {
        const item = allSlides[id];
        const name = typeName(item ? item.type : '');
        if (!stats[name]) stats[name] = { total: 0, wrong: 0 };
        stats[name].total += 1;
        if (wrongSet[String(id)]) stats[name].wrong += 1;
    });
    return Object.keys(stats).map(function(name) {
        const row = stats[name];
        return '<tr><td>' + esc(name) + '</td><td>' + row.total + '</td><td>' + (row.total - row.wrong) + '</td><td>' + row.wrong + '</td></tr>';
    }).join('');
}
function buildReviewImage(item) {
    if (!item || !item.image) return '';
    return '<div class="review-image"><img src="' + esc(item.image) + '" onclick="openImage(this.src)" onerror="handleImageError(this)" alt="Ảnh minh họa câu hỏi"></div>';
}
function buildReviewList(wrongIds) {
    const wrongSet = {};
    wrongIds.forEach(function(id) { wrongSet[String(id)] = true; });
    const orderedIds = wrongIds.concat(sessionQuestionIds.filter(function(id) { return !wrongSet[String(id)]; }));
    if (!orderedIds.length) return '<div class="empty-mistakes">Chưa có câu nào để xem lại.</div>';
    return '<section class="review-section"><div class="review-title-row"><h2 class="review-title">Xem lại câu đã làm</h2><div class="review-note">Câu cần ôn được đưa lên trước để dễ rà lại.</div></div><div class="review-list">' + orderedIds.map(function(id, index) {
        const item = allSlides[id];
        const rec = answerRecords[String(id)];
        const needsReview = Boolean(wrongSet[String(id)]);
        const userAnswer = rec && rec.lastAnswer ? rec.lastAnswer : 'Chưa trả lời';
        const attempts = rec ? rec.attempts : 0;
        const stateText = needsReview ? 'Cần ôn' : 'Ổn định';
        const cardClass = needsReview ? 'wrong' : 'correct';
        return '<article class="review-card ' + cardClass + '"><div class="review-head"><div class="review-head-left"><span class="review-index">' + (index + 1) + '</span><span class="review-chip ' + cardClass + '">' + stateText + '</span><span class="review-type">' + esc(typeName(item.type)) + '</span></div><div class="review-attempts">' + attempts + ' lượt thử</div></div><div class="review-body"><div class="review-question">' + lines(item.content) + '</div>' + buildReviewImage(item) + '<div class="review-answer-grid"><div class="review-answer user ' + cardClass + '"><div class="review-answer-label">Bạn trả lời</div><div class="review-answer-text">' + lines(userAnswer) + '</div></div><div class="review-answer key"><div class="review-answer-label">Đáp án đúng</div><div class="review-answer-text">' + lines(correctAnswerText(item)) + '</div></div></div><div class="review-explain"><div class="review-explain-title">Giải thích</div>' + lines(item.explanation || 'Chưa có giải thích.') + '</div></div></article>';
    }).join('') + '</div></section>';
}
function showSummary() {
    const wrongIds = collectWrongIds(true);
    saveStoredWrongIds(wrongIds);
    const total = sessionQuestionIds.length;
    const answered = sessionQuestionIds.filter(function(id) {
        const rec = answerRecords[String(id)];
        return rec && rec.attempts > 0;
    }).length;
    const rightFirst = sessionQuestionIds.filter(function(id) {
        const rec = answerRecords[String(id)];
        return rec && rec.finalCorrect && !rec.wrongEver;
    }).length;
    const wrongAttempts = Object.keys(answerRecords).reduce(function(sum, key) { return sum + answerRecords[key].wrongAttempts; }, 0);
    const percent = total ? Math.round((rightFirst / total) * 100) : 0;
    const retryDisabled = wrongIds.length ? '' : 'disabled';
    document.getElementById('summary-screen').innerHTML = '<div class="summary-top"><div><h1 class="summary-title">Tổng kết</h1><p class="summary-subtitle">' + esc(getMode().title) + ' - ' + answered + '/' + total + ' câu đã trả lời.</p></div><div class="home-count">' + percent + '%<br>đúng ngay</div></div><div class="summary-stats"><div class="summary-stat"><div class="summary-stat-value">' + total + '</div><div class="summary-stat-label">Tổng câu</div></div><div class="summary-stat"><div class="summary-stat-value">' + rightFirst + '</div><div class="summary-stat-label">Đúng ngay</div></div><div class="summary-stat"><div class="summary-stat-value">' + wrongIds.length + '</div><div class="summary-stat-label">Cần ôn lại</div></div><div class="summary-stat"><div class="summary-stat-value">' + wrongAttempts + '</div><div class="summary-stat-label">Lượt sai</div></div></div><div class="summary-actions"><button class="summary-button" onclick="restartSession()">Làm lại bài này</button><button class="summary-button warning" onclick="retryWrongFromSummary()" ' + retryDisabled + '>Làm lại câu sai</button><button class="summary-button secondary" onclick="restartAllQuestions()">Làm lại toàn bộ</button><button class="summary-button light" onclick="renderHome()">Trang chủ</button></div><table class="summary-table"><thead><tr><th>Loại câu</th><th>Tổng</th><th>Ổn định</th><th>Cần ôn</th></tr></thead><tbody>' + buildTypeRows(wrongIds) + '</tbody></table>' + buildReviewList(wrongIds);
    setScreen('summary');
    const summary = document.getElementById('summary-screen');
    if (window.MathJax) MathJax.typesetPromise([summary]);
}
function restartSession() { startSession(activeModeKey, sessionQuestionIds); }
function restartAllQuestions() {
    startSession(activeModeKey === 'previousWrong' ? 'normal' : activeModeKey, allSlides.map(function(_, index) { return index; }));
}
function retryWrongFromSummary() {
    const wrongIds = collectWrongIds(true);
    if (!wrongIds.length) return;
    startSession('retryImmediate', wrongIds);
}
function initSlides(data) {
    allSlides = data.map(function(item, index) {
        const copy = cloneSlide(item);
        copy._id = index;
        return relabelOptions(copy);
    });
    slides = [];
    renderHome();
}
<\/script>
<script type="application/json" id="quiz-data">${o}<\/script>
<script>initSlides(JSON.parse(document.getElementById('quiz-data').textContent || '[]'));<\/script>
</body>
</html>`},k=(t,n,e)=>{const r=new Blob([t],{type:e}),o=URL.createObjectURL(r),i=document.createElement("a");i.href=o,i.download=g(n),document.body.appendChild(i),i.click(),i.remove(),URL.revokeObjectURL(o)},I=(t,n=`${u(t)}.html`)=>{const e=n.replace(/\.html?$/i,"");k(f(t,e),n,"text/html;charset=utf-8")},T=(t,n=u(t))=>{const e=new Blob([f(t,n)],{type:"text/html;charset=utf-8"});return URL.createObjectURL(e)};export{f as buildHtmlDocument,v as buildHtmlSlides,T as createHtmlPreviewUrl,I as exportToHtml};
