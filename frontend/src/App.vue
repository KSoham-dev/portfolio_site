<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import projectDisplay from '/src/components/projectDisplay.vue';
import { getIconName, getIconCdnUrl } from '/iconutils.js';

// State to control the visibility of the welcome screen
const isLoading = ref(true);
// State to show the explicit "click to enter" message
const showExplicitMessage = ref(false);

const visibleSections = ref({});
let observer = null;
const sectionIds = ['home', 'projects', 'skills', 'journey'];

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

  // Custom cursor tracking
  document.addEventListener('mousemove', updateCursor);
  document.addEventListener('mousedown', () => cursorClicking.value = true);
  document.addEventListener('mouseup', () => cursorClicking.value = false);
  
  // Disable right click
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Track hover state for pointer cursor
  const handleMouseOver = (e) => {
    const target = e.target;
    if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button') || target.classList.contains('cursor-pointer')) {
      cursorPointer.value = true;
    }
  };
  
  const handleMouseOut = (e) => {
    cursorPointer.value = false;
  };
  
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);

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

// Image reveal effect state
const revealProgress = ref(0);
let animationId = null;
const revealSpeed = 2; // Percentage per frame (adjust for speed)

const startReveal = () => {
  const animate = () => {
    if (revealProgress.value < 100) {
      revealProgress.value = Math.min(100, revealProgress.value + revealSpeed);
      animationId = requestAnimationFrame(animate);
    }
  };
  if (animationId) cancelAnimationFrame(animationId);
  animate();
};

const reverseReveal = () => {
  const animate = () => {
    if (revealProgress.value > 0) {
      revealProgress.value = Math.max(0, revealProgress.value - revealSpeed);
      animationId = requestAnimationFrame(animate);
    }
  };
  if (animationId) cancelAnimationFrame(animationId);
  animate();
};

// Skills data - just provide the names!
const hoveredSkill = ref(null);

const skillNames = [
  'Python',
  'TensorFlow',
  'PyTorch',
  'Keras',
  'scikitlearn',
  'Pandas',
  'NumPy',
  'Jupyter',
  'Anaconda',
  'Apache Spark',
  'PostgreSQL',
  'Google Cloud',
  'Docker',
  'Kubernetes',
  'Git',
  'Linux',
];

// Computed property that automatically resolves icon URLs from skill names
const skills = computed(() => {
  return skillNames.map(name => {
    const iconKey = getIconName(name);
    const iconUrl = iconKey ? getIconCdnUrl(iconKey) : null;
    return {
      name,
      iconUrl
    };
  });
});

// Function to calculate circular position for skill icons
const getSkillPosition = (index, total) => {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radius = 160; // Increased radius to prevent overlap
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  return {
    transform: `translate(${x}px, ${y}px)`
  };
};

// Journey data
const educationData = ref([
  {
    id: 0,
    degree: 'ML Engineer Intern',
    institution: 'Helloramp.ai',
    year: 'Nov 2025 - Present',
    description: 'Working on cutting-edge machine learning models and AI solutions.'
  },
  {
    id: 1,
    degree: 'Bachelor of Science in Data Science',
    institution: 'IIT Madras',
    year: '2021 - 2025',
    description: 'Specializing in Machine Learning, Deep Learning, and Big Data Analytics.'
  },
  {
    id: 2,
    degree: 'Higher Secondary Certificate',
    institution: 'Junior College',
    year: '2019 - 2021',
    description: 'Completed pre-university education with focus on Mathematics, Physics, and Computer Science.'
  },
  {
    id: 3,
    degree: 'Secondary School Certificate',
    institution: 'High School',
    year: '2009 - 2019',
    description: 'Foundation years building strong analytical and problem-solving skills.'
  }
]);

// Custom cursor logic
const cursorX = ref(0);
const cursorY = ref(0);
const cursorClicking = ref(false);
const cursorPointer = ref(false);

const updateCursor = (e) => {
  cursorX.value = e.clientX;
  cursorY.value = e.clientY;
};


onUnmounted(() => {
  clearTimeout(messageTimeoutId); // Clean up the timer
  document.removeEventListener('mousedown', enterSite);
  document.removeEventListener('keydown', enterSite);
  document.removeEventListener('mousedown', handleClickOutside);
  document.removeEventListener('mousemove', updateCursor);
  if (observer) {
    observer.disconnect();
  }
});
</script>

<template>
  <!-- Custom Cursor -->
  <div 
    class="custom-cursor" 
    :class="{ 'clicking': cursorClicking, 'pointer': cursorPointer }"
    :style="{ left: cursorX + 'px', top: cursorY + 'px' }">
    <div class="cursor-arrow"></div>
    <div class="cursor-ring"></div>
    <div class="cursor-pointer-ring"></div>
  </div>
  
  <div v-show="isLoading" class="welcome-screen">
    <div class="text-center px-4">
      <h1 class="text-white text-6xl md:text-8xl lg:text-9xl font-thin tracking-widest animate-pulse">Welcome</h1>
      <p v-if="!showExplicitMessage"
        class="text-gray-400 text-lg md:text-xl font-light tracking-widest mt-4 animate-pulse">
        A gesture unlocks the way.
      </p>
      <p v-if="showExplicitMessage"
        class="text-gray-200 text-lg md:text-xl font-light tracking-widest mt-4 animate-pulse">
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
          <a href="#skills"
            class="w-24 bg-white border-2 border-black rounded text-black font-bold text-sm px-5 py-2.5 text-center transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-offset-2 focus:ring-black">
            Skills
          </a>
          <a href="#journey"
            class="w-28 bg-white border-2 border-black rounded text-black font-bold text-sm px-5 py-2.5 text-center transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-offset-2 focus:ring-black">
            Journey
          </a>
        </div>
      </div>
    </div>

    <div v-if="isSocialMenuOpen"
      class="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300">
    </div>

    <div ref="socialMenuContainer" class="fixed bottom-6 right-6 lg:left-6 lg:right-auto z-50">

      <div class="lg:hidden relative flex flex-col items-center">
        <transition name="fade-up">
          <div v-if="isSocialMenuOpen" class="absolute bottom-full mb-4">
            <div
              class="flex flex-col items-center space-y-5 p-3 rounded-full bg-white/90 backdrop-blur-lg shadow-md border-2 border-black">
              <a href="https://github.com/KSoham-dev" class="text-black hover:opacity-70 transition-opacity" target="_blank"><i
                  class="ri-github-line text-3xl"></i></a>
              <a href="https://www.linkedin.com/in/ksohamdev/" class="text-black hover:opacity-70 transition-opacity"
                target="_blank"><i class="ri-linkedin-line text-3xl"></i></a>
              <a href="https://mail.google.com/mail/u/0/?fs=1&to=sohamkulkarni709@gmail.com&su=Hello&body=I+wanted+to+reach+out!&tf=cm"
                class="text-black hover:opacity-70 transition-opacity" target="_blank"><i
                  class="ri-mail-line text-3xl"></i></a>
              <a href="#" class="text-black hover:opacity-70 transition-opacity" target="_blank"><i
                  class="ri-chat-ai-line text-3xl"></i></a>
            </div>
          </div>
        </transition>

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
          <div 
            class="reveal-container"
            @mouseenter="startReveal"
            @mouseleave="reverseReveal">
            <!-- Original photo -->
            <img src="/assets/img/profile.jpg" alt="Profile photo" class="reveal-image original-image">
            <!-- Dotted overlay that reveals on hover -->
            <img 
              src="/assets/img/dotted_portrait.png" 
              alt="Dotted portrait" 
              class="reveal-image dotted-overlay"
              :style="{ clipPath: `inset(0 ${100 - revealProgress}% 0 0)` }">
          </div>
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

      <div id="skills" :class="{
      'content-section min-h-screen bg-white p-4 lg:p-8 flex flex-col lg:flex-row items-center transition-all duration-1000 ease-out': true,
      'opacity-100 translate-y-0': visibleSections.skills,
      'opacity-0 translate-y-10': !visibleSections.skills
      }">
        <div class="w-full text-center lg:text-left lg:w-1/2 p-4">
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 leading-tight">Skills</h1>
          <p>A comprehensive toolkit of technologies</p>
          <p>and frameworks that power my projects.</p>
          <p>Hover to explore each skill.</p>
        </div>
        <div class="w-full lg:w-1/2 p-4 flex justify-center items-center">
          <div class="skills-orbit-container">
            <!-- Futuristic Rings -->
            <div class="orbit-ring ring-1"></div>
            <div class="orbit-ring ring-2"></div>
            <div class="orbit-ring ring-3"></div>
            <div class="orbit-core"></div>
            
            <div class="skills-orbit">
              <div v-for="(skill, index) in skills" :key="skill.name" 
                   class="skill-wrapper"
                   :style="getSkillPosition(index, skills.length)"
                   @mouseenter="hoveredSkill = skill.name"
                   @mouseleave="hoveredSkill = null">
                <div :class="['skill-icon', { 'blurred': hoveredSkill && hoveredSkill !== skill.name }]">
                  <div class="skill-content">
                    <img v-if="skill.iconUrl" :src="skill.iconUrl" :alt="skill.name" class="skill-icon-img" />
                  </div>
                </div>
                <div class="skill-tooltip" v-if="hoveredSkill === skill.name">
                  {{ skill.name }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="journey" :class="{
      'content-section min-h-screen bg-black text-white p-4 lg:p-8 flex flex-col lg:flex-row items-center transition-all duration-1000 ease-out': true,
      'opacity-100 translate-y-0': visibleSections.journey,
      'opacity-0 translate-y-10': !visibleSections.journey
      }">
        <div class="w-full text-center lg:text-left lg:w-1/2 p-4">
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 leading-tight">Journey</h1>
          <div class="text-lg">
            <p>My professional path and</p>
            <p>academic milestones that</p>
            <p>define my career.</p>
          </div>
        </div>
        <div class="w-full lg:w-1/2 p-4">
          <div class="timeline-container">
            <div class="timeline-inner">
              <div class="timeline-item" v-for="edu in educationData" :key="edu.id">
                <div class="timeline-card">
                  <h3 class="text-xl font-bold mb-2">{{ edu.degree }}</h3>
                  <p class="text-lg font-semibold mb-1">{{ edu.institution }}</p>
                  <p class="text-sm text-gray-400 mb-3">{{ edu.year }}</p>
                  <p class="text-sm">{{ edu.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

  </div>
</template>

<style>
/* FONT AND GLOBAL STYLES */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

html {
  scroll-behavior: smooth;
  scroll-padding-top: 7rem;
}

body {
  background-color: #ffffff;
  font-family: "Cormorant Garamond", serif;
  font-weight: 400;
  font-style: normal;
  cursor: none !important;
}

/* Force hide cursor on all elements */
* {
  cursor: none !important;
}

/* Custom cursor */
/* Custom cursor */
.custom-cursor {
  position: fixed;
  pointer-events: none;
  z-index: 10000;
  mix-blend-mode: difference;
  transform: translate(-50%, -50%);
  transition: transform 0.1s ease;
}

.cursor-arrow {
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 20px solid white;
  transform: rotate(-45deg);
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -10px;
  margin-left: -8px;
}

.cursor-ring {
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.5);
  opacity: 0;
  transition: all 0.2s ease;
}

.custom-cursor.clicking {
  transform: translate(-50%, -50%) scale(0.8);
}

.custom-cursor.clicking .cursor-ring {
  transform: translate(-50%, -50%) scale(1.5);
  opacity: 1;
  border-color: #00ffff;
  box-shadow: 0 0 10px #00ffff;
}

.custom-cursor.clicking .cursor-arrow {
  border-bottom-color: #00ffff;
}

/* Pointer state (hovering links/buttons) */
.cursor-pointer-ring {
  width: 30px;
  height: 30px;
  border: 2px dashed #00ffff;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  transition: all 0.2s ease;
  animation: spin 4s linear infinite;
}

.custom-cursor.pointer .cursor-pointer-ring {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}

.custom-cursor.pointer .cursor-arrow {
  transform: rotate(-45deg) scale(0.8);
  border-bottom-color: #00ffff;
}

.custom-cursor.pointer .cursor-ring {
  border-color: rgba(0, 255, 255, 0.3);
  transform: translate(-50%, -50%) scale(0.8);
}

@keyframes spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
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

/* START OF MODIFICATION */
/* Styles for the fade-up transition on the mobile menu */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
/* END OF MODIFICATION */

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

/* Interactive Reveal Effect */
.reveal-container {
  position: relative;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border: 3px solid #000;
  animation: float-gentle 6s ease-in-out infinite, glow-border 3s ease-in-out infinite;
}

/* Futuristic floating animation */
@keyframes float-gentle {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-15px) rotate(1deg);
  }
}

/* Glowing border pulse */
@keyframes glow-border {
  0%, 100% {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15),
                0 0 20px rgba(59, 130, 246, 0.3);
  }
  50% {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15),
                0 0 40px rgba(59, 130, 246, 0.6),
                0 0 60px rgba(139, 92, 246, 0.4);
  }
}

.reveal-image {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.original-image {
  z-index: 1;
}

.dotted-overlay {
  z-index: 2;
  transition: clip-path 0.05s linear;
}

.reveal-container:hover {
  animation: float-gentle 6s ease-in-out infinite, glow-border-active 2s ease-in-out infinite;
}

@keyframes glow-border-active {
  0%, 100% {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2),
                0 0 30px rgba(59, 130, 246, 0.6),
                0 0 60px rgba(139, 92, 246, 0.5);
    border-color: #3b82f6;
  }
  50% {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25),
                0 0 50px rgba(59, 130, 246, 0.8),
                0 0 80px rgba(139, 92, 246, 0.6),
                inset 0 0 30px rgba(59, 130, 246, 0.2);
    border-color: #8b5cf6;
  }
}

.reveal-container:hover .original-image {
  filter: grayscale(0.1) contrast(1.1);
}

/* Scan line effect overlay */
.reveal-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(59, 130, 246, 0.05) 50%,
    transparent 100%
  );
  z-index: 3;
  pointer-events: none;
  animation: scan-line 4s linear infinite;
  opacity: 0;
  transition: opacity 0.3s;
}

.reveal-container:hover::before {
  opacity: 1;
}

@keyframes scan-line {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

/* Skills Section Styles - Futuristic Orbit */
.skills-orbit-container {
  position: relative;
  width: 500px;
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1000px;
  transform-style: preserve-3d;
}

/* Pause animations on hover */
.skills-orbit-container:hover .skills-orbit,
.skills-orbit-container:hover .orbit-ring,
.skills-orbit-container:hover .skill-icon {
  animation-play-state: paused;
}

.skills-orbit {
  position: absolute;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  animation: orbit-rotate 20s linear infinite;
}

.orbit-core {
  position: absolute;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.8) 0%, rgba(139, 92, 246, 0.2) 70%, transparent 100%);
  border-radius: 50%;
  filter: blur(10px);
  box-shadow: 0 0 40px rgba(99, 102, 241, 0.6);
  animation: pulse-core 3s ease-in-out infinite;
}

.orbit-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(99, 102, 241, 0.3);
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.2);
  transform-style: preserve-3d;
}

.ring-1 {
  width: 350px;
  height: 350px;
  border-color: rgba(139, 92, 246, 0.4);
  animation: rotate-ring-1 10s linear infinite;
}

.ring-2 {
  width: 450px;
  height: 450px;
  border-color: rgba(59, 130, 246, 0.3);
  border-width: 2px;
  border-left-color: transparent;
  border-right-color: transparent;
  animation: rotate-ring-2 15s linear infinite reverse;
}

.ring-3 {
  width: 250px;
  height: 250px;
  border: 2px dashed rgba(236, 72, 153, 0.3);
  animation: rotate-ring-3 20s linear infinite;
}

.skill-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform-style: preserve-3d;
}

.skill-icon {
  position: absolute;
  top: -30px;
  left: -30px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(99, 102, 241, 0.5);
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
  transform-style: preserve-3d;
  /* Counter-rotate to keep icons facing forward */
  animation: counter-rotate 20s linear infinite reverse;
}

.skill-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
}

.skill-icon i {
  font-size: 2.5rem;
}

.skill-icon-img {
  width: 2.5rem;
  height: 2.5rem;
  object-fit: contain;
}

.skill-icon:hover {
  transform: scale(1.5);
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.8);
  z-index: 100;
  border-color: #8b5cf6;
  background: white;
}

.skill-icon.blurred {
  filter: blur(2px);
  opacity: 0.5;
  transform: scale(0.9);
}

.skill-tooltip {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
  border: 1px solid rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.4);
  z-index: 101;
}

@keyframes orbit-rotate {
  0% { transform: rotateZ(0deg); }
  100% { transform: rotateZ(360deg); }
}

@keyframes counter-rotate {
  0% { transform: rotateZ(0deg); }
  100% { transform: rotateZ(-360deg); }
}

@keyframes rotate-ring-1 {
  0% { transform: rotateX(60deg) rotateY(0deg); }
  100% { transform: rotateX(60deg) rotateY(360deg); }
}

@keyframes rotate-ring-2 {
  0% { transform: rotateX(-45deg) rotateY(0deg); }
  100% { transform: rotateX(-45deg) rotateY(360deg); }
}

@keyframes rotate-ring-3 {
  0% { transform: rotateX(30deg) rotateY(0deg); }
  100% { transform: rotateX(30deg) rotateY(360deg); }
}

@keyframes pulse-core {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 0.5; }
}

/* Education Timeline Styles - Futuristic Design */
/* Education Timeline Styles - Futuristic Design */
.timeline-container {
  max-height: 600px;
  overflow-y: auto;
  padding: 20px;
  position: relative;
  margin-top: 60px;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.timeline-container::-webkit-scrollbar {
  display: none;
}

.timeline-inner {
  position: relative;
  padding-top: 10px;
  padding-bottom: 10px;
}

/* Center line with glow effect */
.timeline-inner::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, 
    transparent 0%,
    #667eea 10%,
    #764ba2 50%,
    #667eea 90%,
    transparent 100%
  );
  transform: translateX(-50%);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.8),
              0 0 40px rgba(118, 75, 162, 0.6);
  animation: pulse-line 3s ease-in-out infinite;
}

@keyframes pulse-line {
  0%, 100% {
    box-shadow: 0 0 20px rgba(102, 126, 234, 0.8),
                0 0 40px rgba(118, 75, 162, 0.6);
  }
  50% {
    box-shadow: 0 0 30px rgba(102, 126, 234, 1),
                0 0 60px rgba(118, 75, 162, 0.8);
  }
}

.timeline-item {
  position: relative;
  margin-bottom: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  padding: 28px;
  border-radius: 16px;
  border: 2px solid rgba(102, 126, 234, 0.5);
  color: white;
  max-width: 400px;
  position: relative;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.timeline-card::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 16px;
  padding: 2px;
  background: linear-gradient(135deg, #667eea, #764ba2, #667eea);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.timeline-card:hover {
  transform: scale(1.05);
  border-color: rgba(102, 126, 234, 0.8);
  box-shadow: 0 12px 48px rgba(102, 126, 234, 0.4),
              0 0 40px rgba(118, 75, 162, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.timeline-card:hover::before {
  opacity: 1;
}

.timeline-card h3 {
  background: linear-gradient(135deg, #fff 0%, #e0e7ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.timeline-card p {
  color: rgba(255, 255, 255, 0.9);
}

.timeline-card .text-gray-400 {
  color: rgba(167, 139, 250, 0.8) !important;
}

@media (max-width: 640px) {
  .reveal-container {
    width: 280px;
    height: 280px;
  }
  
  .skills-circle-container {
    width: 360px;
    height: 360px;
  }
  
  .skill-icon {
    width: 65px;
    height: 65px;
  }
  
  .skill-icon i {
    font-size: 2rem !important;
  }
  
  .skill-icon-img {
    width: 2rem !important;
    height: 2rem !important;
  }
  
  .timeline-card {
    max-width: 280px;
    padding: 20px;
  }
}
</style>
