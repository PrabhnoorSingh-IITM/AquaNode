// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Hero Animations
window.addEventListener('load', () => {
    const tl = gsap.timeline();

    tl.to('.hero-title', {
        opacity: 1,
        y: -20,
        duration: 0.6,
        ease: 'power3.out'
    })
    .to('.hero-subtitle', {
        opacity: 1,
        y: -10,
        duration: 0.5,
        ease: 'power2.out'
    }, '-=0.4')
    .to('.hero-cta', {
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out'
    }, '-=0.3');
});

// Architecture Section Animations
gsap.from('.architecture-visual', {
    scrollTrigger: {
        trigger: '#architecture',
        start: 'top 80%',
        toggleActions: 'play none none none'
    },
    opacity: 0,
    x: -30,
    duration: 0.8,
    ease: 'expo.out'
});

gsap.to('.step-card', {
    scrollTrigger: {
        trigger: '#architecture',
        start: 'top 60%',
        toggleActions: 'play none none none'
    },
    opacity: 1,
    x: 0,
    stagger: 0.15,
    duration: 0.6,
    ease: 'power3.out'
});

// Anime.js Water Flow Animation
function animateWater() {
    // Animate Inlet 1
    anime({
        targets: '#water-inlet-1',
        strokeDashoffset: [anime.setDashoffset, 0],
        easing: 'linear',
        duration: 1500,
        loop: true
    });

    // Animate Inlet 2
    anime({
        targets: '#water-inlet-2',
        strokeDashoffset: [anime.setDashoffset, 0],
        easing: 'linear',
        duration: 1500,
        loop: true
    });

    // Animate Main Pipe (Slightly delayed for visual flow)
    anime({
        targets: '#water-main',
        strokeDashoffset: [anime.setDashoffset, 0],
        easing: 'linear',
        duration: 2000,
        delay: 500,
        loop: true
    });

    // Animate Container Dosing (Pulse effect)
    anime({
        targets: '#water-container',
        opacity: [0.2, 0.8],
        strokeDashoffset: [anime.setDashoffset, 0],
        easing: 'easeInOutQuad',
        duration: 3000,
        loop: true
    });
}

// System Simulation Logic
async function runSimulation() {
    const startBtn = document.getElementById('sim-start-btn');
    const hud = document.getElementById('sim-hud');
    const grid = document.getElementById('architecture-grid');
    const statusText = document.getElementById('sim-status-text');
    const clogBar = document.getElementById('sim-clog-bar');
    const clogText = document.getElementById('sim-clog-text');
    const phText = document.getElementById('sim-ph-text');
    const statusDot = document.getElementById('sim-status-dot');

    startBtn.classList.add('pointer-events-none', 'opacity-0');
    grid.classList.add('sim-active');
    
    // Wait for expansion animation
    await new Promise(r => setTimeout(r, 600));
    hud.classList.remove('opacity-0');

    const updateStatus = (text, colorClass = 'text-emerald-400', dotColor = 'bg-emerald-500') => {
        statusText.innerText = text;
        statusText.className = `text-xs font-mono uppercase tracking-widest ${colorClass}`;
        statusDot.className = `w-2 h-2 rounded-full ${dotColor} animate-pulse`;
    };

    try {
        // STEP 1: Start Branch 1
        updateStatus('Opening Valve 1...', 'text-sky-400', 'bg-sky-500');
        gsap.to('#rect-valve-1', { fill: '#0ea5e9', duration: 0.5 });
        
        const flow1 = anime({
            targets: '#water-inlet-1, #water-main',
            strokeDashoffset: [anime.setDashoffset, 0],
            easing: 'linear',
            duration: 1500,
            loop: true
        });

        await new Promise(r => setTimeout(r, 2000));

        // STEP 2: Simulate Clogging
        updateStatus('Monitoring Filter 1...', 'text-amber-400', 'bg-amber-500');
        let clogging = 0;
        const clogInterval = setInterval(() => {
            clogging += 5;
            clogBar.style.width = clogging + '%';
            clogText.innerText = clogging + '% Clogged';
            if (clogging >= 70) {
                clogBar.classList.replace('bg-sky-500', 'bg-rose-500');
                clogText.classList.replace('text-slate-400', 'text-rose-400');
            }
            if (clogging >= 85) clearInterval(clogInterval);
        }, 200);

        await new Promise(r => setTimeout(r, 4000));

        // STEP 3: Handle Clogging (>70%)
        updateStatus('CRITICAL: Branch 1 Clogged!', 'text-rose-400', 'bg-rose-500');
        gsap.to('#rect-valve-1', { fill: '#f43f5e', duration: 0.3 });
        flow1.pause();
        
        await new Promise(r => setTimeout(r, 1500));

        // STEP 4: Switch to Branch 2
        updateStatus('Switching to Branch 2...', 'text-sky-400', 'bg-sky-500');
        gsap.to('#rect-valve-2', { fill: '#0ea5e9', duration: 0.5 });
        
        anime({
            targets: '#water-inlet-2, #water-main',
            strokeDashoffset: [anime.setDashoffset, 0],
            easing: 'linear',
            duration: 1500,
            loop: true
        });

        await new Promise(r => setTimeout(r, 2000));

        // STEP 5: pH Analysis
        updateStatus('Analyzing pH Levels...', 'text-indigo-400', 'bg-indigo-500');
        let currentPH = 7.0;
        const phInterval = setInterval(() => {
            currentPH -= 0.1;
            phText.innerText = currentPH.toFixed(1) + ' pH';
            if (currentPH <= 5.2) clearInterval(phInterval);
        }, 100);

        await new Promise(r => setTimeout(r, 2000));

        // STEP 6: pH Neutralization
        updateStatus('Acid Detected: Dosing Base...', 'text-indigo-400', 'bg-indigo-500');
        gsap.to('#rect-cont', { fill: '#38bdf8', duration: 0.5 });
        
        anime({
            targets: '#water-container',
            opacity: [0.2, 1],
            strokeDashoffset: [anime.setDashoffset, 0],
            easing: 'linear',
            duration: 1000,
            loop: true
        });

        const neutralInterval = setInterval(() => {
            currentPH += 0.1;
            phText.innerText = currentPH.toFixed(1) + ' pH';
            if (currentPH >= 7.0) {
                phText.innerText = '7.0 pH';
                clearInterval(neutralInterval);
            }
        }, 150);

        await new Promise(r => setTimeout(r, 3000));

        // FINISH
        updateStatus('System Balanced & Nominal', 'text-emerald-400', 'bg-emerald-500');
        await new Promise(r => setTimeout(r, 3000));
        
        // Reset UI for next run
        location.reload(); 

    } catch (err) {
        console.error("Simulation failed:", err);
    }
}

// Event Listeners
document.getElementById('sim-start-btn')?.addEventListener('click', runSimulation);

// Trigger initial water flow on scroll (Ambient)
ScrollTrigger.create({
    trigger: '#architecture',
    start: 'top center',
    onEnter: animateWater
});

// Hardware Card Hover Effects
document.querySelectorAll('.hardware-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        gsap.to(card, { scale: 1.02, duration: 0.3, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => {
        gsap.to(card, { scale: 1, duration: 0.3, ease: 'power2.in' });
    });
});
