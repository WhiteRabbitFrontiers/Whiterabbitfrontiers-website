/* White Rabbit Frontiers: quick silent rabbit, then every letter falls in reverse order. */
(function(){
  const scene=document.querySelector('.rabbit-run');
  if(!scene)return;
  const quote=scene.querySelector('.rabbit-quote');
  const hole=scene.querySelector('.rabbit-hole');
  const replay=scene.querySelector('.rabbit-replay');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const phrase='The future is already leaking through.';
  let timers=[],animations=[],started=false;

  // Word wrappers keep the sentence readable, while each character moves independently.
  quote.textContent='';
  const letters=[];
  phrase.split(' ').forEach((word,index)=>{
    const wrapper=document.createElement('span');
    wrapper.className='quote-word';
    wrapper.setAttribute('aria-hidden','true');
    [...word].forEach(char=>{
      const letter=document.createElement('span');
      letter.className='quote-letter';
      letter.textContent=char;
      wrapper.appendChild(letter);
      letters.push(letter);
    });
    quote.appendChild(wrapper);
  });
  function later(fn,delay){timers.push(window.setTimeout(fn,delay));}
  function clear(){
    timers.forEach(window.clearTimeout);timers=[];
    animations.forEach(a=>a.cancel());animations=[];
    letters.forEach(letter=>{letter.style.opacity='';letter.style.transform='';});
  }
  function finish(){scene.classList.remove('is-playing');scene.classList.add('is-finished');}
  function fall(){
    const target=hole.getBoundingClientRect();
    // Begin with the period, then h, g, u... and continue backwards to the T.
    [...letters].reverse().forEach((letter,i)=>{
      const source=letter.getBoundingClientRect();
      const dx=target.left+target.width*.52-(source.left+source.width/2);
      const dy=target.top+target.height*.55-(source.top+source.height/2);
      const duration=1050;
      const anim=letter.animate([
        {transform:'translate(0,0) rotate(0deg) scale(1)',opacity:1,offset:0},
        {transform:`translate(${dx*.48}px,${dy*.12-18}px) rotate(${i%2?16:-13}deg) scale(.86)`,opacity:1,offset:.48},
        {transform:`translate(${dx}px,${dy}px) rotate(${i%2?125:-125}deg) scale(.03)`,opacity:0,offset:1}
      ],{duration,delay:i*68,easing:'cubic-bezier(.38,.04,.72,1)',fill:'forwards'});
      animations.push(anim);
    });
  }
  function play(){
    clear();
    scene.classList.remove('is-playing','is-finished');
    if(reduced.matches){finish();return;}
    void scene.offsetWidth;
    scene.classList.add('is-playing');
    later(fall,2250);
    later(finish,2250+1050+(letters.length-1)*68+400);
  }
  replay.addEventListener('click',play);
  reduced.addEventListener?.('change',()=>{
    clear();
    if(reduced.matches)finish();
  });
  const observer=new IntersectionObserver(entries=>{
    if(!started&&entries.some(e=>e.isIntersecting)){
      started=true;observer.disconnect();play();
    }
  },{threshold:.3});
  observer.observe(scene);
})();
