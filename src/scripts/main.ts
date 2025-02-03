import { gsap, QuickToFunc } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

type SpanData = {
    element: HTMLElement;
    setStyle: QuickToFunc;
    anim: gsap.core.Tween;
};

const initSmoothScroll = () => {
    const lenis = new Lenis({
        lerp: 0.08,
        smoothWheel: true,
        syncTouch: true,
        touchMultiplier: 1.1,
        wrapper: document.documentElement,
        content: document.body
    });

    ScrollTrigger.defaults({ scroller: window });
    ScrollTrigger.normalizeScroll(true);
    
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time: number) => lenis.raf(time * 1000));
    gsap.ticker.fps(60);

    return lenis;
};

const createLetterSpans = (): SpanData[] => {
    const headings = document.querySelectorAll<HTMLElement>('.container h1, .container h2');
    return Array.from(headings).flatMap(heading => {
        heading.innerHTML = [...heading.textContent!]
            .map(letter => `<span>${letter}</span>`)
            .join('');

        return Array.from(heading.querySelectorAll<HTMLElement>('span')).map(span => ({
            element: span,
            setStyle: gsap.quickSetter(span, 'fontVariationSettings') as QuickToFunc,
            anim: gsap.fromTo(span, 
                { y: 50, opacity: 0 }, 
                { y: 0, opacity: 1, duration: 0.5 }
            ).pause()
        }));
    });
};

const setupAnimations = (lenis: any, spans: SpanData[]) => {
    let mousePos = { x: 0, y: 0 };
    const container = document.querySelector<HTMLElement>('.container')!;
    const paragraphSpans = Array.from(document.querySelectorAll<HTMLElement>('.content-section span'))
        .map(span => ({ element: span, setStyle: gsap.quickSetter(span, 'fontVariationSettings') as QuickToFunc }));

    document.addEventListener('mousemove', ({ clientX, clientY }: MouseEvent) => {
        mousePos = { x: clientX, y: clientY };
        gsap.to(container, {
            x: (clientX - window.innerWidth / 2) * 0.02,
            y: (clientY - window.innerHeight / 2) * 0.02,
            duration: 2
        });
    });

    spans.forEach(({ element, anim }) => {
        ScrollTrigger.create({
            trigger: element,
            start: "top 90%",
            onEnter: () => anim.play(),
            onLeaveBack: () => anim.reverse()
        });
    });

    gsap.ticker.add(() => {
        const scrollY = lenis.scroll;
        
        [spans, paragraphSpans].forEach((spanGroup, index) => {
            spanGroup.forEach(({ element, setStyle }) => {
                const bounds = element.getBoundingClientRect();
                const dx = mousePos.x - (bounds.left + bounds.width / 2);
                const dy = mousePos.y - (bounds.top + bounds.height / 2);
                const distance = Math.sqrt(dx ** 2 + dy ** 2);
                
                const baseWeight = index === 0 ? 900 : 600;
                const range = index === 0 ? 800 : 400;
                const weight = baseWeight - range * Math.min(distance / (index === 0 ? 500 : 800), 1);
                setStyle(weight + (index === 0 ? Math.min(scrollY / window.innerHeight * 300, 300) : 0));
            });
        });

        gsap.set('.content-section', { y: -scrollY * 0.2 });
    });

    Array.from(document.querySelectorAll<HTMLElement>('.content-section span')).forEach((line) => {
        gsap.fromTo(line, {
            y: 100,
            opacity: 0,
            rotationX: 15
        }, {
            y: 0,
            opacity: 1,
            rotationX: 0,
            duration: 1.2,
            ease: 'power4.out',
            scrollTrigger: {
                trigger: line,
                start: 'top 90%',
                end: 'bottom 60%',
                scrub: 1,
                invalidateOnRefresh: true
            }
        });
    });
};

const lenis = initSmoothScroll();
const spans = createLetterSpans();
setupAnimations(lenis, spans);

window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
    lenis.resize();
});