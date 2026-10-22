/* Rabbit Run: plays once on entry, silent, replayable, respects reduced motion. */
(function(){
  const scene=document.querySelector('.rabbit-run');
  if(!scene)return;
  const replay=scene.querySelector('.rabbit-replay');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let timer;
  function finish(){scene.classList.remove('is-playing');scene.classList.add('is-finished');}
  function play(){
    if(reduced.matches){finish();return;}
    window.clearTimeout(timer);
    scene.classList.remove('is-playing','is-finished');
    void scene.offsetWidth;
    scene.classList.add('is-playing');
    timer=window.setTimeout(finish,8900);
  }
  replay.addEventListener('click',play);
  reduced.addEventListener?.('change',()=>{window.clearTimeout(timer);if(reduced.matches)finish();});
  const observer=new IntersectionObserver((entries)=>{
    if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();play();}
  },{threshold:.3});
  observer.observe(scene);
})();
