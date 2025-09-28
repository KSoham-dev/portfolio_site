<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import projectDisplay from '/src/components/projectDisplay.vue';

// State to control the visibility of the welcome screen
const isLoading = ref(true);
// State to show the explicit "click to enter" message
const showExplicitMessage = ref(false);

const visibleSections = ref({});
let observer = null;
const sectionIds = ['home', 'projects', 'blog', 'about'];

let audioContext = null;
let messageTimeoutId = null; // To hold the ID of our 4-second timeout

/**
 * This function handles the user's entry into the site.
 * It's triggered by the first click or keydown.
 */
const enterSite = () => {
  // Prevent this from running more than once
  if (!isLoading.value) return;

  // Stop the 4-second timer if the user clicks before it fires
  clearTimeout(messageTimeoutId);

  // Resume audio context and play the sound
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
  playIntroSound();

  // Switch from the welcome screen to the main content
  isLoading.value = false;

  // Clean up the event listeners now that they've served their purpose
  document.removeEventListener('mousedown', enterSite);
  document.removeEventListener('keydown', enterSite);
};

/**
 * Plays the generative intro sound.
 */
const playIntroSound = () => {
  if (!audioContext) return;

  try {
    const playNote = (frequency, startTime, duration) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
      gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + startTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + startTime + duration);
      oscillator.start(audioContext.currentTime + startTime);
      oscillator.stop(audioContext.currentTime + startTime + duration);
    };

    playNote(261.63, 0, 2.5);
    playNote(392.00, 0.2, 2.5);

  } catch (e) {
    console.error("Web Audio API could not be initialized.", e);
  }
};

onMounted(() => {
  // Create the AudioContext
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Listen for the first user interaction to enter the site
  document.addEventListener('mousedown', enterSite);
  document.addEventListener('keydown', enterSite);

  // Set a 4-second timer to show the explicit message
  messageTimeoutId = setTimeout(() => {
    showExplicitMessage.value = true;
  }, 4000);

  // IntersectionObserver logic remains the same
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        visibleSections.value[entry.target.id] = entry.isIntersecting;
      });
    }, { threshold: 0.1 }
  );

  sectionIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      observer.observe(element);
    }
  });
});

// The rest of your component logic remains unchanged
const isSocialMenuOpen = ref(false);
const socialMenuContainer = ref(null);

const toggleSocialMenu = () => {
  isSocialMenuOpen.value = !isSocialMenuOpen.value;
};

const handleClickOutside = (event) => {
  if (socialMenuContainer.value && !socialMenuContainer.value.contains(event.target)) {
    isSocialMenuOpen.value = false;
  }
};

watch(isSocialMenuOpen, (isOpen) => {
  if (isOpen) {
    document.addEventListener('mousedown', handleClickOutside);
  } else {
    document.removeEventListener('mousedown', handleClickOutside);
  }
});

onUnmounted(() => {
  clearTimeout(messageTimeoutId); // Clean up the timer
  document.removeEventListener('mousedown', enterSite);
  document.removeEventListener('keydown', enterSite);
  document.removeEventListener('mousedown', handleClickOutside);
  if (observer) {
    observer.disconnect();
  }
});
</script>

<template>
  <div v-show="isLoading" class="welcome-screen">
    <div class="text-center">
      <h1 class="text-white text-9xl font-thin tracking-widest animate-pulse">Welcome</h1>
      
      <p v-if="!showExplicitMessage" class="text-gray-400 text-xl font-light tracking-widest mt-4 animate-pulse">
        A gesture unlocks the way.
      </p>
      
      <p v-if="showExplicitMessage" class="text-gray-200 text-xl font-light tracking-widest mt-4 animate-pulse">
        Click anywhere to enter.
      </p>
    </div>
  </div>

  <div v-show="!isLoading" class="main-content">
    <div class="fixed top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 z-50">
      <div
        class="navbar p-4 rounded-2xl bg-white/90 backdrop-blur-lg shadow-md flex items-center justify-center lg:justify-between border-2 border-black border-solid">
        <div class="text-2xl font-bold">SK</div>

        <div class="hidden lg:flex items-center space-x-2 sm:space-x-4">
          <a href="#home"
            class="w-24 bg-white border-2 border-black rounded text-black font-bold text-sm px-5 py-2.5 text-center transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-offset-2 focus:ring-black">
            Home
          </a>
          <a href="#projects"
            class="w-24 bg-white border-2 border-black rounded text-black font-bold text-sm px-5 py-2.5 text-center transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-offset-2 focus:ring-black">
            Projects
          </a>
          <a href="#blog"
            class="w-24 bg-white border-2 border-black rounded text-black font-bold text-sm px-5 py-2.5 text-center transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-offset-2 focus:ring-black">
            Blog
          </a>
          <a href="#about"
            class="w-24 bg-white border-2 border-black rounded text-black font-bold text-sm px-5 py-2.5 text-center transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-offset-2 focus:ring-black">
            About
          </a>
        </div>
      </div>
    </div>

    <div v-if="isSocialMenuOpen"
      class="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300">
    </div>

    <div ref="socialMenuContainer" class="fixed bottom-6 right-6 lg:left-6 lg:right-auto z-50">

      <div class="lg:hidden flex flex-col-reverse items-center space-y-4">
        <div v-if="isSocialMenuOpen"
          class="flex flex-col items-center space-y-5 p-3 rounded-full bg-white/90 backdrop-blur-lg shadow-md border-2 border-black">
          <a href="https://github.com/KSoham-dev" class="text-black hover:opacity-70 transition-opacity" target="_blank"><i
              class="ri-github-line text-3xl"></i></a>
          <a href="https://www.linkedin.com/in/ksohamdev/" class="text-black hover:opacity-70 transition-opacity"
            target="_blank"><i class="ri-linkedin-line text-3xl"></i></a>
          <a href="https://mail.google.com/mail/u/0/?fs=1&to=sohamkulkarni709@gmail.com&su=Hello&body=I+wanted+to+reach+out!&tf=cm"
            class="text-black hover:opacity-70 transition-opacity" target="_blank"><i class="ri-mail-line text-3xl"></i></a>
          <a href="#" class="text-black hover:opacity-70 transition-opacity" target="_blank"><i
              class="ri-chat-ai-line text-3xl"></i></a>
        </div>
        <button @click="toggleSocialMenu"
          class="bg-white border-2 border-black rounded-lg text-black font-extra-bold text-sm px-5 py-2.5 text-center transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-offset-2 focus:ring-black flex items-center space-x-2">
          <i :class="isSocialMenuOpen ? 'ri-close-line' : 'ri-chat-3-line'" class="text-lg"></i>
          <span>{{ isSocialMenuOpen ? 'Close' : 'Connect' }}</span>
        </button>
      </div>

      <div class="hidden lg:flex items-center space-x-4">
        <a href="https://github.com/KSoham-dev"
          class="w-14 h-14 bg-white/75 backdrop-blur-lg rounded-full shadow-md border-2 border-black flex items-center justify-center text-black hover:opacity-70 transition-opacity"
          target="_blank">
          <i class="ri-github-line text-3xl"></i>
        </a>
        <a href="https://www.linkedin.com/in/ksohamdev/"
          class="w-14 h-14 bg-white/75 backdrop-blur-lg rounded-full shadow-md border-2 border-black flex items-center justify-center text-black hover:opacity-70 transition-opacity"
          target="_blank">
          <i class="ri-linkedin-line text-3xl"></i>
        </a>
        <a href="mailto:sohamkulkarni709@gmail.com"
          class="w-14 h-14 bg-white/75 backdrop-blur-lg rounded-full shadow-md border-2 border-black flex items-center justify-center text-black hover:opacity-70 transition-opacity"
          target="_blank">
          <i class="ri-mail-line text-3xl"></i>
        </a>
        <a href="#"
          class="w-14 h-14 bg-white/75 backdrop-blur-lg rounded-full shadow-md border-2 border-black flex items-center justify-center text-black hover:opacity-70 transition-opacity"
          target="_blank">
          <i class="ri-chat-ai-line text-3xl"></i>
        </a>
      </div>

    </div>

    <main>
      <div id="home" :class="{
      'content-section min-h-screen px-4 pt-32 pb-4 lg:p-8 flex flex-col justify-center lg:flex-row lg:items-center transition-all duration-1000 ease-out': true,
      'opacity-100 translate-y-0': visibleSections.home,
      'opacity-0 translate-y-10': !visibleSections.home && !visibleSections.projects
      }">
        <div class="w-full text-center lg:text-left lg:w-1/2 lg:p-4">
          <h1 class="text-5xl sm:text-6xl lg:text-8xl font-bold mb-4 leading-tight">
            <p> Soham </p> Kulkarni
          </h1>
          <div class="subhead text-lg">
            <p>A final-year Data Science student at IIT Madras</p>
            <p>specializing in building intelligent systems,</p>
            <p>with a firm grounding in mathematics</p>
          </div>
        </div>
        <div class="w-full lg:w-1/2 p-4 flex justify-center items-center">
          <img
            class="rounded-full object-cover w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 outline outline-2 outline-offset-2 outline-black-900 shadow-xl"
            src="/assets/img/profile.jpg" alt="Profile photo of Soham">
        </div>
      </div>

      <div id="projects" :class="{
      'content-section min-h-screen bg-black text-white p-4 lg:p-8 flex flex-col lg:flex-row items-center transition-all duration-1000 ease-out': true,
      'opacity-100 translate-y-0': visibleSections.projects,
      'opacity-0 translate-y-10': !visibleSections.projects
      }">
        <div class="w-full text-center lg:text-left lg:w-1/2 p-4">
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 leading-tight">Projects</h1>
          <p>This selection of projects demonstrates</p>
          <p>my process of deconstructing a problem</p>
          and building a robust, end-to-end solution.
        </div>
        <div class="w-full lg:w-1/2 p-4">
          <div class="flex items-center justify-center">
            <projectDisplay />
          </div>
        </div>
      </div>

      <div id="blog" :class="{
      'content-section min-h-screen bg-white p-4 lg:p-8 flex flex-col lg:flex-row items-center transition-all duration-1000 ease-out': true,
      'opacity-100 translate-y-0': visibleSections.blog,
      'opacity-0 translate-y-10': !visibleSections.blog
      }">
        <div class="w-full text-center lg:text-left lg:w-1/2 p-4">
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 leading-tight">Blog</h1>
          <p>A space for my thoughts and deep dives into</p>
          <p>the world of data science. Here, I explore the</p>
          concepts behind the code, A space for the curious
        </div>
        <div class="w-full lg:w-1/2 p-4">
          <div class=" rounded-lg p-8 w-full h-64 lg:h-80 flex items-center justify-center">
            <p class="text-gray-500">Coming Soon</p>
          </div>
        </div>
      </div>

      <div id="about" :class="{
      'content-section min-h-screen bg-black text-white p-4 lg:p-8 flex flex-col lg:flex-row items-center transition-all duration-1000 ease-out': true,
      'opacity-100 translate-y-0': visibleSections.about,
      'opacity-0 translate-y-10': !visibleSections.about
      }">
        <div class="w-full text-center lg:text-left lg:w-1/2 p-4">
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 leading-tight">About</h1>
          <p class="text-gray-400">This is the about section.</p>
        </div>
        <div class="w-full lg:w-1/2 p-4">
          <div class=" rounded-lg p-8 w-full h-64 lg:h-80 flex items-center justify-center">
            <p class="text-gray-500">Content for the right side goes here.</p>
          </div>
        </div>
      </div>
    </main>

  </div>
</template>

<style>
/* FONT AND GLOBAL STYLES: UNCHANGED */
@import url('https://fonts.googleapis.com/css2?family=Doto:wght@100..900&display=swap');

html {
  scroll-behavior: smooth;
  scroll-padding-top: 7rem;
}

body {
  background-color: #ffffff;
  font-family: "Doto", sans-serif;
  font-optical-sizing: auto;
  font-weight: 500;
  font-style: normal;
  font-variation-settings:
    "ROND" 0;
}

/* Styles for the Welcome Screen */
.welcome-screen {
  position: fixed;
  inset: 0;
  background-color: black;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  color: white;
}

.welcome-text {
  font-size: 4rem;
  font-weight: bold;
  animation: fadeInOut 5s ease-in-out forwards;
}

/* Keyframe animation for the welcome text */
@keyframes fadeInOut {
  0% {
    opacity: 0;
  }

  20% {
    opacity: 1;
  }

  80% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

/* Styles for the main content transition */
.main-content {
  animation: revealPage 1.5s ease-in forwards;
}

/* Keyframe animation for the main page reveal */
@keyframes revealPage {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* Responsive font size for welcome text on smaller screens */
@media (max-width: 768px) {
  .welcome-text {
    font-size: 2.5rem;
  }
}
</style>



