<script setup>
import { ref } from 'vue';

// Data for the cards, making the template cleaner
const cards = ref([
    {
        id: 'card-1',
        title: 'ChurnPredictor',
        imgSrc: '/assets/img/ChurnPredictor.png',
        imgAlt: 'churnPredictor',
        link: 'https://github.com/KSoham-dev', // Added link
        poem: [
            `Welcome to ChurnPredictor, a predictive realm where data foretells customer loyalty. It deciphers the subtle signals of 
            attrition—from monthly charges to short-term contracts—identifying at-risk accounts before they depart. 
            This foresight is powered by a finely-tuned engine of XGBoost and RandomForest.`
        ]
    },
    {
        id: 'card-2',
        title: 'Vedaphix',
        imgSrc: '/assets/img/vedaphix.png',
        imgAlt: 'Vedaphix',
        link: 'https://github.com/KSoham-dev/soft-engg-project-jan-2025-se-Jan-2', // Added link
        poem: [
            `Welcome to Vedaphix, a living learning ecosystem where education adapts to you. Each student receives an AI guide, 
             illuminating their academic path with personalized SWOT analyses and gamified milestones. Built on a robust core of 
             FastAPI and PostgreSQL with a React frontend, its intelligence is powered by a Llama 3 LLM`
        ]
    },{
        id: 'card-3',
        title: 'Bookit',
        imgSrc: '/assets/img/bookit.png',
        imgAlt: 'Bookit',
        link: 'https://github.com/KSoham-dev/bookit-v2', // Added link
        poem: [
            `Welcome to the realm of Bookit V2, a library of two halves. 
             Its bright, public halls offer readers stories that magically vanish after seven days. 
             But in its hidden chambers, librarians master the entire collection, tracking every book's journey. 
             This world runs on a powerful heart of Flask, Celery, and Redis, all securely guarded by JWT.`
        ]
    }
]);

// Reactive state to track the current active card index
const activeIndex = ref(0);

// Function to go to the next card, wrapping around to the start
const goToNext = () => {
    activeIndex.value = (activeIndex.value + 1) % cards.value.length;
};

// Function to go to the previous card, wrapping around to the end
const goToPrev = () => {
    activeIndex.value = (activeIndex.value - 1 + cards.value.length) % cards.value.length;
};
</script>

<template>
    <div class="component-wrapper">
        <section :class="`active-card-${activeIndex + 1}`">
            <article v-for="card in cards" :key="card.id">
                <header>
                    <h2>{{ card.title }}</h2>
                    <a :href="card.link" target="_blank" rel="noopener noreferrer" class="github-icon-link">
                        <i class="ri-github-line text-3xl"></i>
                    </a>
                </header>
                <div>
                    <div>
                        <img :src="card.imgSrc" :alt="card.imgAlt">
                    </div>
                    <div class="poem">
                        <p v-for="(paragraph, pIndex) in card.poem" :key="pIndex" v-html="paragraph"
                            class="text-justify"></p>
                    </div>
                </div>
            </article>

            <div class="navigation-arrows">
                <button @click="goToPrev" aria-label="Previous Card">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                </button>
                <button @click="goToNext" aria-label="Next Card">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
            </div>

        </section>
    </div>
</template>

<style>
@import url(https://fonts.bunny.net/css?family=kodchasan:200,400,600);

/* --- Base & Wrapper Styles --- */
.component-wrapper {
    background-color: black;
    color: white;
    min-height: 100vh;
    width: 100%;
    margin: 0;
    padding: 2rem;
    font-family: system-ui, sans-serif;
    line-height: 1.5;
    display: grid;
    place-items: center;
    gap: 2rem;
}

/* --- Main Section Logic & Layout --- */
section {
    /* CSS variables for controlling the stacking effect */
    --_offset-steps: 6rem;
    --_scale-steps: 25;
    --_opacity-steps: 15;
    --_ani-duration: 300ms;

    /* Calculations based on the variables */
    --_offset-steps-two: calc(var(--_offset-steps) * -1);
    --_offset-steps-three: calc(var(--_offset-steps) * -2);
    --scale-steps-two: calc(1 - var(--_scale-steps) * 0.01);
    --scale-steps-three: calc(1 - var(--_scale-steps) * 0.02);
    --opacity-steps-two: calc(1 - var(--_opacity-steps) * 0.02);
    --opacity-steps-three: calc(1 - var(--_opacity-steps) * 0.04);

    @media (width > 600px) {
        --_offset-steps: 4em;
    }

    display: grid;
    grid-template-areas: "stack";
    color: black;
    width: min(calc(100% - 2rem), 40rem);
    position: relative;
}

/* --- Card Styles --- */
article {
    --_border-radius: 10px;
    --_bg-dot-offset: 20px;
    --_bg-dot-color: black;
    /* Black & White Theme */

    position: relative;
    isolation: isolate;
    background-color: white;
    grid-area: stack;
    transition: 500ms ease-in-out;
    border-radius: var(--_border-radius);
    font-family: "Kodchasan", sans-serif;
    border: 1px solid #333;

    /* Properties are set by the active-card-* class on the parent */
    order: var(--_order);
    z-index: var(--_order);
    transform: translateY(var(--_offset, 0)) scale(var(--_scale, 1));
    opacity: var(--_opacity, 1);
    /* THIS IS THE KEY PROPERTY: DEFAULTS TO 'none' */
    pointer-events: var(--_pointer-event, none);
}

/* Dotted background effect */
article::before,
article::after {
    content: "";
    position: absolute;
    border-radius: inherit;
    z-index: -1;
}

article::before {
    z-index: -1;
    inset: calc(var(--_bg-dot-offset) * -1);
    background-image: radial-gradient(var(--_bg-dot-color) 1px, transparent 0px);
    background-repeat: repeat;
    background-size: 5px 5px;
    background-position: center;
    border-radius: calc(var(--_border-radius) + var(--_bg-dot-offset));
}

article::after {
    background-color: white;
    inset: 0;
}

/* --- State Management via CSS Classes --- */

/* Default styles for each card */
article:nth-of-type(1) {
    --_order: var(--_1-order);
    --_scale: var(--_1-scale);
    --_opacity: var(--_1-opacity);
    --_offset: var(--_1-offset);
    --_pointer-event: var(--_1-pointer-event);
}

article:nth-of-type(2) {
    --_order: var(--_2-order);
    --_scale: var(--_2-scale);
    --_opacity: var(--_2-opacity);
    --_offset: var(--_2-offset);
    --_pointer-event: var(--_2-pointer-event);
}

article:nth-of-type(3) {
    --_order: var(--_3-order);
    --_scale: var(--_3-scale);
    --_opacity: var(--_3-opacity);
    --_offset: var(--_3-offset);
    --_pointer-event: var(--_3-pointer-event);
}

/* Card 1 is active */
section.active-card-1 {
    --_1-order: 3;
    --_1-scale: 1;
    --_1-opacity: 1;
    --_1-offset: 0;
    --_1-pointer-event: auto; /* FIX: Enable pointer events for active card */

    --_2-order: 2;
    --_2-scale: var(--scale-steps-two);
    --_2-opacity: var(--opacity-steps-two);
    --_2-offset: var(--_offset-steps-two);

    --_3-order: 1;
    --_3-scale: var(--scale-steps-three);
    --_3-opacity: var(--opacity-steps-three);
    --_3-offset: var(--_offset-steps-three);
}

/* Card 2 is active */
section.active-card-2 {
    --_2-order: 3;
    --_2-scale: 1;
    --_2-opacity: 1;
    --_2-offset: 0;
    --_2-pointer-event: auto; /* FIX: Enable pointer events for active card */

    --_3-order: 2;
    --_3-scale: var(--scale-steps-two);
    --_3-opacity: var(--opacity-steps-two);
    --_3-offset: var(--_offset-steps-two);

    --_1-order: 1;
    --_1-scale: var(--scale-steps-three);
    --_1-opacity: var(--opacity-steps-three);
    --_1-offset: var(--_offset-steps-three);
}

/* Card 3 is active */
section.active-card-3 {
    --_3-order: 3;
    --_3-scale: 1;
    --_3-opacity: 1;
    --_3-offset: 0;
    --_3-pointer-event: auto; /* FIX: Enable pointer events for active card */

    --_1-order: 2;
    --_1-scale: var(--scale-steps-two);
    --_1-opacity: var(--opacity-steps-two);
    --_1-offset: var(--_offset-steps-two);
    
    --_2-order: 1;
    --_2-scale: var(--scale-steps-three);
    --_2-opacity: var(--opacity-steps-three);
    --_2-offset: var(--_offset-steps-three);
}


/* --- Card Content Styles --- */
article>header {
    padding: .5rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: white;
    /* Black & White Theme */
    border-bottom: 1px solid #eee;
    transition: background-color var(--_ani-duration) ease-in-out;
    border-radius: var(--_border-radius) var(--_border-radius) 0 0;
}

article>header>h2 {
    margin: 0;
    font-weight: 500;
    font-size: 1.1rem;
}

article>div {
    position: relative;
    padding: 2rem;
    display: grid;
    grid-template-columns: 1fr;
    place-items: start;
    gap: 2rem;
}

@media (width > 600px) {
    article>div {
        grid-template-columns: 1fr 2fr;
    }
}

article img {
    width: 100%;
    transition: var(--_ani-duration) ease-in-out;
}

article .poem {
    width: 100%;
    height: 200px;
    overflow-y: hidden;
    /* No scrollbar */
}

article p {
    opacity: 1;
    /* Always visible */
    margin: 0 0 1rem 0;
    font-size: .9rem;
}

/* --- New Navigation Arrows --- */
.navigation-arrows {
    grid-area: stack;
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1rem;
    z-index: 100;
    align-self: end;
    /* Position below the card stack */
    transform: translateY(calc(100% + 2rem));
}

.navigation-arrows button {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    border: 1px solid white;
    background-color: black;
    color: white;
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: transform 0.2s, background-color 0.2s;
}

.navigation-arrows button:hover {
    transform: scale(1.1);
    background-color: #333;
}

.navigation-arrows svg {
    width: 1.25rem;
    height: 1.25rem;
    stroke: white;
}

/* --- GitHub Icon Link Styling --- */
.github-icon-link {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 44px; /* Adjust size as needed */
    height: 44px; /* Must be same as width for a circle */
    border-radius: 50%;
    border: 2px solid black;
    background-color: transparent;
    color: black;
    text-decoration: none;
    transition: background-color 0.2s ease, transform 0.2s ease;
}

.github-icon-link:hover {
    background-color: #f0f0f0; /* Light grey on hover for feedback */
    transform: scale(1.1);
}
</style>