import type { Vocabulary } from '../types';

export function WordIllustration({ entry }: { entry: Vocabulary }) {
  if (entry.world !== 'home') return <span className="word-symbol" aria-hidden="true">{entry.icon}</span>;
  const id = entry.id.replace('home-', '');
  const person = (x: number, small = false, coral = false) => <g transform={`translate(${x} ${small ? 14 : 0}) scale(${small ? .8 : 1})`}><path d="M25 89V70q0-17 15-17t15 17v19" fill={coral ? '#ed946e' : '#45ada5'} /><circle cx="40" cy="34" r="15" fill="#f6d0a0" /><path d="M25 31q0-20 15-20t15 20q-17-12-30 0" fill="#67534a" /><circle cx="35" cy="35" r="1.5" /><circle cx="45" cy="35" r="1.5" /><path d="M35 43q5 4 10 0" fill="none" /></g>;
  return <svg className="word-illustration" viewBox="0 0 120 110" aria-hidden="true"><g stroke="#244b55" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    {id === 'house' && <><path d="M21 48 60 15l39 33v48H21Z" fill="#f2c784" /><path d="m13 49 47-39 47 39" fill="none" stroke="#d88462" strokeWidth="10" /><path d="M50 96V62h22v34" fill="#48a79d" /><path d="M28 58h15v17H28Z" fill="#b9e6e5" /></>}
    {id === 'door' && <><path d="M30 99V16h60v83" fill="#dd9967" strokeWidth="7" /><path d="M39 25h42v74H39Z" fill="#edbb7b" /><circle cx="71" cy="65" r="4" fill="#fbe2a8" /></>}
    {id === 'window' && <><rect x="22" y="16" width="76" height="75" rx="4" fill="#bde6e8" strokeWidth="6" /><path d="M60 17v74M22 53h76" fill="none" strokeWidth="5" /><circle cx="78" cy="34" r="9" fill="#f6ca72" stroke="none" /><path d="M17 96h86" strokeWidth="7" /></>}
    {id === 'table' && <><path d="M18 48h84v17H18Z" fill="#edb47b" /><path d="M27 65v32M93 65v32" strokeWidth="9" /><ellipse cx="59" cy="42" rx="19" ry="7" fill="#e5f4ed" /><path d="M51 37v-9h17v9" fill="#45ada5" /></>}
    {id === 'bed' && <><path d="M18 29v68m84-36v36" strokeWidth="8" /><path d="M19 53h70q12 0 12 13v17H19Z" fill="#58b8b1" /><rect x="23" y="43" width="28" height="18" rx="6" fill="#fff8ea" /><path d="M21 85h80" strokeWidth="6" /></>}
    {id === 'water' && <><path d="M60 12C50 31 28 48 28 69a32 32 0 0 0 64 0C92 48 70 31 60 12Z" fill="#62b8d1" /><path d="M42 62q-5 20 12 24" stroke="#daf6f5" strokeWidth="6" fill="none" /></>}
    {['mother', 'father', 'brother', 'sister'].includes(id) && person(20, ['brother', 'sister'].includes(id), ['mother', 'sister'].includes(id))}
    {['family', 'friend'].includes(id) && <>{person(-8, true, true)}{person(38, true)}{id === 'family' && <g transform="translate(31 45) scale(.48)">{person(0, false, true)}</g>}</>}
    {id === 'chair' && <><rect x="34" y="15" width="51" height="45" rx="7" fill="#70bcb0" /><path d="M28 62h64v13H28Z" fill="#e9b879" /><path d="M36 75v25M84 75v25" strokeWidth="7" /></>}
    {id === 'lamp' && <><path d="M42 20h36l18 42H24Z" fill="#f5cd73" /><path d="M60 62v33M41 98h38" strokeWidth="7" /><path d="m12 33-7-4m103 4 7-4M60 8V2" stroke="#e5ae42" /></>}
    {id === 'kitchen' && <><rect x="21" y="42" width="79" height="57" rx="5" fill="#90c6b7" /><rect x="39" y="62" width="43" height="27" rx="4" fill="#345663" /><path d="M39 34h42v-9H39Zm7-18h28" fill="#efbb7d" /><circle cx="40" cy="52" r="2" /><circle cx="60" cy="52" r="2" /><circle cx="80" cy="52" r="2" /></>}
    {id === 'garden' && <><path d="M17 95h88" stroke="#78b58b" strokeWidth="9" /><path d="M41 91V51m39 40V34" stroke="#549b78" strokeWidth="5" /><path d="M40 76Q15 51 22 73t18 3m42-15q23-21 19 0t-19 0" fill="#78b58b" /><circle cx="40" cy="43" r="17" fill="#ee9d83" /><circle cx="80" cy="25" r="17" fill="#f6cb72" /><circle cx="40" cy="43" r="5" fill="#f6cb72" /><circle cx="80" cy="25" r="5" fill="#ee9d83" /></>}
    {id === 'room' && <><path d="M17 18h86v79H17Z" fill="#f7e7c8" /><path d="M17 97 40 77h42l21 20M40 18v59m42-59v59" fill="none" /><rect x="47" y="30" width="25" height="29" fill="#a8dcdf" /></>}
    {id === 'hello' && <><path d="M36 87 19 62q-5-10 4-12 6-1 17 14V25q0-9 8-9t8 9v27-34q0-9 8-9t8 9v34-28q0-9 8-9t8 9v30-18q0-8 7-8t7 8v36q0 26-30 28-21 1-36-13Z" fill="#f1c593" /><path d="m17 26-8-9m12 21H9" fill="none" stroke="#45ada5" /></>}
    {id === 'thanks' && <path d="M60 94 24 60C-6 22 43 4 60 35 77 4 126 22 96 60Z" fill="#ef977d" />}
    {id === 'yes' && <><circle cx="60" cy="55" r="40" fill="#91cbb0" /><path d="m37 55 15 15 31-34" stroke="#fffefa" strokeWidth="10" fill="none" /></>}
    {id === 'no' && <><circle cx="60" cy="55" r="40" fill="#eeb8a1" /><path d="m44 39 32 32m0-32L44 71" stroke="#fffefa" strokeWidth="9" /></>}
    {id === 'name' && <><rect x="16" y="27" width="88" height="62" rx="10" fill="#b4ded8" /><path d="M51 28V10h18v18" fill="#eebd7b" /><circle cx="39" cy="52" r="9" fill="#f3c99d" /><path d="M25 77q0-16 14-16t14 16" fill="#ea9678" /><path d="M65 50h25M65 64h18" /></>}
    {['your_name', 'my_name'].includes(id) && <><path d="M19 20h82v58H56L34 97V78H19Z" fill="#b9ded6" />{id === 'your_name' ? <text x="60" y="63" textAnchor="middle" fontSize="42" fill="#244b55" stroke="none">?</text> : <path d="M33 39h53M33 52h41M33 65h23" strokeWidth="5" />}</>}
  </g></svg>;
}
