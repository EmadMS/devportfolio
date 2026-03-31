import * as THREE from 'three';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. TOGGLE NAV ---
    const menuBtn = document.querySelector('.menu-btn');
    const fullMenu = document.querySelector('.full-menu');
    const menuLinks = document.querySelectorAll('.full-menu a');

    if (menuBtn && fullMenu) {
        menuBtn.addEventListener('click', () => {
            fullMenu.classList.toggle('active');
            menuBtn.textContent = fullMenu.classList.contains('active') ? 'CLOSE' : 'INDEX';
        });

        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                fullMenu.classList.remove('active');
                menuBtn.textContent = 'INDEX';
            });
        });
    }

    // --- 2. ULTRA-FAST CUSTOM CURSOR (GSAP) ---
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    const hoverables = document.querySelectorAll('a, button, .menu-btn, input, textarea');

    if (cursorDot && cursorOutline && typeof gsap !== 'undefined') {
        const xToDot = gsap.quickTo(cursorDot, "x", {duration: 0.05, ease: "none"});
        const yToDot = gsap.quickTo(cursorDot, "y", {duration: 0.05, ease: "none"});
        
        const xToOutline = gsap.quickTo(cursorOutline, "x", {duration: 0.15, ease: "power3"});
        const yToOutline = gsap.quickTo(cursorOutline, "y", {duration: 0.15, ease: "power3"});

        window.addEventListener('mousemove', (e) => {
            xToDot(e.clientX - 3);
            yToDot(e.clientY - 3);
            xToOutline(e.clientX - 20);
            yToOutline(e.clientY - 20);
        }, { passive: true }); // Passive flag stops scroll blocking

        hoverables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorOutline.style.width = '60px';
                cursorOutline.style.height = '60px';
                cursorOutline.style.backgroundColor = 'rgba(255,255,255,0.1)';
                xToOutline.tween.vars.x = xToOutline.target._gsap.x - 10;
                yToOutline.tween.vars.y = xToOutline.target._gsap.y - 10;
            });
            el.addEventListener('mouseleave', () => {
                cursorOutline.style.width = '40px';
                cursorOutline.style.height = '40px';
                cursorOutline.style.backgroundColor = 'transparent';
            });
        });
    }

    // --- 3. ZERO-LAG 3D LIQUID OBSIDIAN ---
    const canvas = document.querySelector('#webgl-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x050505, 10, 50);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);

    // MAC FIX 1: Turn off antialias and alpha for massive performance boost
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" }); 
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // MAC FIX 2: Hard cap pixel ratio to 1. Retina displays push 4x the pixels otherwise.
    renderer.setPixelRatio(1); 

    // MAC FIX 3: Drastically reduce geometry vertices from 10,000 down to 625.
    const geometry = new THREE.PlaneGeometry(60, 60, 25, 25); 
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x111111, roughness: 0.3, metalness: 0.7 
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -2;
    scene.add(plane);
    
    // Cache the positions array for faster math loops
    const positions = plane.geometry.attributes.position;
    const originalPositions = positions.clone();
    const vertexCount = positions.count;

    // MAC FIX 4: Simplified Lighting.
    scene.add(new THREE.AmbientLight(0xffffff, 0.15));
    const mouseLight = new THREE.PointLight(0xffffff, 20, 30);
    mouseLight.position.set(0, 5, 0);
    scene.add(mouseLight);
    
    const rimLight1 = new THREE.SpotLight(0x444444, 60); 
    rimLight1.position.set(-10, 5, -10); 
    scene.add(rimLight1);

    const mouse = new THREE.Vector2();
    let targetX = 0; let targetY = 0;
    
    document.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        targetX = mouse.x * 15;
        targetY = mouse.y * 10;
    }, { passive: true });

    const clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        // Smoothly follow mouse with light
        mouseLight.position.x += (targetX - mouseLight.position.x) * 0.1;
        mouseLight.position.z += (-targetY - mouseLight.position.z) * 0.1;

        // Wave Math (Ultra-fast loop over only 625 vertices)
        for (let i = 0; i < vertexCount; i++) {
            const x = originalPositions.getX(i);
            const y = originalPositions.getY(i);
            const wave1 = Math.sin(x * 0.2 + time * 0.5) * 0.5;
            const wave2 = Math.cos(y * 0.3 + time * 0.8) * 0.3;
            positions.setZ(i, wave1 + wave2); // Dropped a 3rd wave calculation for pure speed
        }
        positions.needsUpdate = true;

        // Parallax scroll effect
        camera.position.y = 5 + (window.scrollY * 0.005);
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }
    animate();

    // --- 4. GSAP SCROLL ANIMATIONS ---
    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        if(document.querySelector('.hero-text')) {
            gsap.fromTo('.hero-text', 
                { opacity: 0, y: 30 }, 
                { opacity: 1, y: 0, duration: 1.5, ease: "power3.out", delay: 0.1 }
            );
        }

        // Fast render for panels
        gsap.utils.toArray('.glass-panel').forEach(panel => {
            gsap.to(panel, {
                scrollTrigger: { trigger: panel, start: "top 90%" },
                opacity: 1, y: 0, duration: 0.8, ease: "power2.out"
            });
        });
    }

    // Debounce resize to prevent lag when resizing window
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }, 100);
    });
    // --- 5. STEALTH CONTACT FORM (AJAX) ---
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // Stops the page from redirecting
            
            // Change button text to show it's working
            submitBtn.textContent = 'TRANSMITTING...';
            submitBtn.style.color = '#888';

            const formData = new FormData(contactForm);

            try {
                const response = await fetch(contactForm.action, {
                    method: contactForm.method,
                    body: formData,
                    headers: {
                        'Accept': 'application/json' // Tells Formspree not to send the Captcha page
                    }
                });

                if (response.ok) {
                    // Success! Hide the form and show the green success message
                    contactForm.style.display = 'none';
                    formStatus.style.display = 'block';
                } else {
                    // Formspree rejected it (usually bad email format)
                    submitBtn.textContent = 'TRANSMISSION FAILED - TRY AGAIN';
                    submitBtn.style.color = 'red';
                }
            } catch (error) {
                // Network error (wifi down, etc)
                submitBtn.textContent = 'NETWORK ERROR - TRY AGAIN';
                submitBtn.style.color = 'red';
            }
        });
    }
});