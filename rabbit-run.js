/* WRF Rabbit Run V4: original artwork, fast sprint, trailing sentence, reverse letter fall. Silent. */
(function(){
  const scene=document.querySelector('.rabbit-run');
  if(!scene)return;
  const quote=scene.querySelector('.rabbit-quote');
  const hole=scene.querySelector('.rabbit-hole');
  const replay=scene.querySelector('.rabbit-replay');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const phrase='The future is already leaking through.';
  let timers=[],animations=[],started=false;
  quote.textContent='';
  const letters=[];
  phrase.split(' ').forEach(word=>{
    const wrapper=document.createElement('span');
    wrapper.className='quote-word';
    wrapper.setAttribute('aria-hidden','true');
    [...word].forEach(character=>{
      const el=document.createElement('span');
      el.className='quote-letter';
      el.textContent=character;
      wrapper.appendChild(el);
      letters.push(el);
    });
    quote.appendChild(wrapper);
  });
  function later(fn,delay){timers.push(window.setTimeout(fn,delay));}
  function reset(){
    timers.forEach(clearTimeout);timers=[];
    animations.forEach(animation=>animation.cancel());animations=[];
    letters.forEach(letter=>{letter.style.opacity='';letter.style.transform='';});
  }
  function finish(){scene.classList.remove('is-playing');scene.classList.add('is-finished');}
  function reveal(){
    letters.forEach((letter,i)=>{
      const animation=letter.animate([
        {opacity:0,transform:'translate(-22px,4px) scale(.82)'},
        {opacity:1,transform:'translate(0,0) scale(1)'}
      ],{duration:220,delay:i*47,easing:'ease-out',fill:'forwards'});
      animations.push(animation);
    });
  }
  function fall(){
    const rect=hole.getBoundingClientRect();
    const targetX=rect.left+rect.width*.5;
    const targetY=rect.top+rect.height*.55;
    [...letters].reverse().forEach((letter,i)=>{
      const box=letter.getBoundingClientRect();
      const dx=targetX-(box.left+box.width*.5);
      const dy=targetY-(box.top+box.height*.5);
      const animation=letter.animate([
        {opacity:1,transform:'translate(0px,0px) rotate(0deg) scale(1)',offset:0},
        {opacity:1,transform:`translate(${dx*.4}px,${dy*.1-28}px) rotate(${i%2?12:-12}deg) scale(.85)`,offset:.48},
        {opacity:0,transform:`translate(${dx}px,${dy}px) rotate(${i%2?110:-110}deg) scale(.02)`,offset:1}
      ],{duration:850,delay:i*86,easing:'cubic-bezier(.45,.05,.8,1)',fill:'forwards'});
      animations.push(animation);
    });
  }
  function play(){
    reset();
    scene.classList.remove('is-playing','is-finished');
    if(reduced.matches){finish();return;}
    void scene.offsetWidth;
    scene.classList.add('is-playing');
    later(reveal,150);
    later(fall,2950);
    later(finish,2950+850+(letters.length-1)*86+450);
  }
  replay.addEventListener('click',play);
  reduced.addEventListener?.('change',()=>{reset();if(reduced.matches)finish();});
  const observer=new IntersectionObserver(entries=>{
    if(!started&&entries.some(entry=>entry.isIntersecting)){
      started=true;observer.disconnect();play();
    }
  },{threshold:.3});
  observer.observe(scene);
})();
