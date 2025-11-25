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
  
  // Start code typing animation
  setTimeout(() => typeCode(), 2000);
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
  const radius = 220; // Increased from 160 for fuller display
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
    year: 'Sept 2022 - present',
    description: 'Specializing in Machine Learning, Deep Learning, and Big Data Analytics.'
  },
  {
    id: 2,
    degree: 'Higher Secondary Certificate',
    institution: 'Junior College',
    year: 'Sept 2020 - June 2022',
    description: 'Completed pre-university education with focus on Mathematics, Physics, and Computer Science.'
  },
  {
    id: 3,
    degree: 'Secondary School Certificate',
    institution: 'High School',
    year: 'June 2020',
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

// Code snippets for showcase
const codeSnippets = [
  `# Neural Network Training
model = Sequential([
  Dense(128, activation='relu'),
  Dropout(0.2),
  Dense(10, activation='softmax')
])
model.compile(optimizer='adam',
              loss='categorical_crossentropy')`,
  `# Data Analysis Pipeline
df = pd.read_csv('data.csv')
X = df.drop('target', axis=1)
y = df['target']
X_train, X_test = train_test_split(X, y)
model.fit(X_train, y_train)`,
  `# Deep Learning with PyTorch
class NeuralNet(nn.Module):
  def __init__(self):
    super().__init__()
    self.fc1 = nn.Linear(784, 256)
    self.fc2 = nn.Linear(256, 10)
  def forward(self, x):
    return F.softmax(self.fc2(F.relu(self.fc1(x))))`
];
const currentSnippetIndex = ref(0);
const displayedCode = ref('');
const isTyping = ref(false);

const typeCode = async () => {
  if (isTyping.value) return;
  isTyping.value = true;
  
  const snippet = codeSnippets[currentSnippetIndex.value];
  displayedCode.value = '';
  
  for (let i = 0; i < snippet.length; i++) {
    displayedCode.value += snippet[i];
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  currentSnippetIndex.value = (currentSnippetIndex.value + 1) % codeSnippets.length;
  isTyping.value = false;
  typeCode();
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
        <!-- Animated Background Grid -->
        <div class="grid-background"></div>
        
        <div class="w-full text-center lg:text-left lg:w-1/2 lg:p-4 relative z-10">
          <h1 class="text-5xl sm:text-6xl lg:text-8xl font-bold mb-4 leading-tight">
            <p> Soham </p> Kulkarni
          </h1>
          <div class="subhead text-lg">
            <p>A final-year Data Science student at IIT Madras</p>
            <p>specializing in building intelligent systems,</p>
            <p>with a firm grounding in mathematics</p>
          </div>
        </div>
        <div class="w-full lg:w-1/2 p-4 flex justify-center items-center relative z-10">
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
        <!-- Code Snippet Showcase -->
        <div class="code-window">
          <div class="code-window-header">
            <div class="code-dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <span class="code-title">ml_model.py</span>
          </div>
          <pre class="code-content"><code>{{ displayedCode }}</code></pre>
        </div>
        
        <div class="w-full text-center lg:text-left lg:w-1/2 p-4 relative z-10">
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 leading-tight">Projects</h1>
          <p>This selection of projects demonstrates</p>
          <p>my process of deconstructing a problem</p>
          and building a robust, end-to-end solution.
        </div>
        <div class="w-full lg:w-1/2 p-4 relative z-10">
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
        <!-- Animated Background Grid -->
        <div class="grid-background"></div>
        
        <div class="w-full text-center lg:text-left lg:w-1/2 p-4 relative z-10">
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 leading-tight">Skills</h1>
          <p class="text-xl">A comprehensive toolkit of technologies</p>
          <p class="text-xl">and frameworks that power my projects.</p>
          <p class="text-xl mt-4">Hover to explore each skill.</p>
        </div>
        <div class="w-full lg:w-1/2 p-4 flex justify-center items-center relative z-10">
          <div class="skills-circle-container-large">
            <div v-for="(skill, index) in skills" :key="skill.name" 
                 :class="['skill-icon-large', { 'blurred': hoveredSkill && hoveredSkill !== skill.name }]"
                 :style="getSkillPosition(index, skills.length)"
                 @mouseenter="hoveredSkill = skill.name"
                 @mouseleave="hoveredSkill = null">
              <img v-if="skill.iconUrl" :src="skill.iconUrl" :alt="skill.name" class="skill-icon-img-large" />
              <div class="skill-tooltip" v-if="hoveredSkill === skill.name">
                {{ skill.name }}
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
        <!-- Data Visualization Background Elements -->
        <svg class="data-viz-background" viewBox="0 0 400 300">
          <!-- Animated bar chart -->
          <g class="bar-chart">
            <rect x="50" y="200" width="30" height="0" class="data-bar" style="animation-delay: 0s">
              <animate attributeName="height" from="0" to="80" dur="1s" fill="freeze" begin="0s"/>
              <animate attributeName="y" from="200" to="120" dur="1s" fill="freeze" begin="0s"/>
            </rect>
            <rect x="90" y="200" width="30" height="0" class="data-bar" style="animation-delay: 0.2s">
              <animate attributeName="height" from="0" to="120" dur="1s" fill="freeze" begin="0.2s"/>
              <animate attributeName="y" from="200" to="80" dur="1s" fill="freeze" begin="0.2s"/>
            </rect>
            <rect x="130" y="200" width="30" height="0" class="data-bar" style="animation-delay: 0.4s">
              <animate attributeName="height" from="0" to="60" dur="1s" fill="freeze" begin="0.4s"/>
              <animate attributeName="y" from="200" to="140" dur="1s" fill="freeze" begin="0.4s"/>
            </rect>
            <rect x="170" y="200" width="30" height="0" class="data-bar" style="animation-delay: 0.6s">
              <animate attributeName="height" from="0" to="150" dur="1s" fill="freeze" begin="0.6s"/>
              <animate attributeName="y" from="200" to="50" dur="1s" fill="freeze" begin="0.6s"/>
            </rect>
          </g>
          
          <!-- Animated line graph -->
          <polyline class="line-graph" points="250,180 280,140 310,160 340,100 370,120"
                    stroke-dasharray="200" stroke-dashoffset="200">
            <animate attributeName="stroke-dashoffset" from="200" to="0" dur="2s" fill="freeze"/>
          </polyline>
          <circle cx="250" cy="180" r="3" class="graph-point" style="animation-delay: 0s"/>
          <circle cx="280" cy="140" r="3" class="graph-point" style="animation-delay: 0.5s"/>
          <circle cx="310" cy="160" r="3" class="graph-point" style="animation-delay: 1s"/>
          <circle cx="340" cy="100" r="3" class="graph-point" style="animation-delay: 1.5s"/>
          <circle cx="370" cy="120" r="3" class="graph-point" style="animation-delay: 2s"/>
        </svg>
        
        <div class="w-full text-center lg:text-left lg:w-1/2 p-4 relative z-10">
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 leading-tight">Journey</h1>
          <div class="text-lg">
            <p>My professional path and</p>
            <p>academic milestones that</p>
            <p>define my career.</p>
          </div>
        </div>
        <div class="w-full lg:w-1/2 p-4 relative z-10">
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

/* Skills Section Styles */
.skills-circle-container {
  position: relative;
  width: 500px;
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Larger skills container for fuller display */
.skills-circle-container-large {
  position: relative;
  width: 700px;
  height: 700px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.skill-icon {
  position: absolute;
  width: 85px;
  height: 85px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 3px solid #000;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Larger skill icons */
.skill-icon-large {
  position: absolute;
  width: 110px;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 3px solid #000;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.skill-icon i {
  font-size: 3rem;
}

.skill-icon-img {
  width: 3rem;
  height: 3rem;
  object-fit: contain;
}

.skill-icon-img-large {
  width: 4rem;
  height: 4rem;
  object-fit: contain;
}

.skill-icon:hover,
.skill-icon-large:hover {
  transform: scale(1.25);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 10;
  border-color: #333;
}

.skill-icon.blurred,
.skill-icon-large.blurred {
  filter: blur(4px);
  opacity: 0.3;
  transform: scale(0.95);
}

.skill-tooltip {
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  background: #000;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
  animation: fadeIn 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border: 2px solid #333;
}

.skill-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 8px solid transparent;
  border-top-color: #000;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
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
  
  .skills-circle-container,
  .skills-circle-container-large {
    width: 360px;
    height: 360px;
  }
  
  .skill-icon,
  .skill-icon-large {
    width: 65px;
    height: 65px;
  }
  
  .skill-icon i {
    font-size: 2rem !important;
  }
  
  .skill-icon-img,
  .skill-icon-img-large {
    width: 2rem !important;
    height: 2rem !important;
  }
  
  .timeline-card {
    max-width: 280px;
    padding: 20px;
  }
}

/* Animated Grid Background */
.grid-background {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  z-index: 1;
  animation: grid-shift 20s linear infinite;
}

@keyframes grid-shift {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 50px 50px;
  }
}

/* Floating Particles */
.particles-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 2;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  animation: float-particle-enhanced 12s ease-in-out infinite;
}

/* Particles for light backgrounds (white/gray) */
.particles-light .particle {
  background: radial-gradient(circle, rgba(102, 126, 234, 0.4) 0%, rgba(0, 0, 0, 0.15) 100%);
  box-shadow: 0 0 10px rgba(102, 126, 234, 0.3);
}

/* Particles for dark backgrounds (black) */
.particles-dark .particle {
  background: radial-gradient(circle, rgba(0, 255, 255, 0.5) 0%, rgba(118, 75, 162, 0.2) 100%);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.4);
}

/* Enhanced floating animation with more organic movement */
@keyframes float-particle-enhanced {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  25% {
    transform: translate(30px, -30px) scale(1.2);
    opacity: 0.8;
  }
  50% {
    transform: translate(-20px, -60px) scale(0.9);
    opacity: 0.5;
  }
  75% {
    transform: translate(40px, -90px) scale(1.1);
    opacity: 0.7;
  }
  90% {
    opacity: 0.3;
  }
  100% {
    transform: translate(0, -120px) scale(1);
    opacity: 0;
  }
}

/* Statistics Cards */
.stat-card {
  cursor: pointer;
  position: relative;
}

.stat-card:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-card:hover .text-gray-700 {
  color: rgba(255, 255, 255, 0.9) !important;
}

/* Code Window Showcase */
.code-window {
  position: absolute;
  top: 10%;
  right: 5%;
  width: 400px;
  max-width: 42%;
  background: #1e1e1e;
  border: 2px solid #000;
  border-radius: 8px;
  box-shadow: 8px 8px 0px 0px rgba(0, 0, 0, 1);
  z-index: 5;
  opacity: 0.85;
  transition: opacity 0.3s, transform 0.3s;
}

.code-window:hover {
  opacity: 1;
  transform: translateY(-4px);
}

.code-window-header {
  background: #2d2d2d;
  padding: 12px 16px;
  border-bottom: 1px solid #000;
  border-radius: 6px 6px 0 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.code-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid #000;
}

.dot.red {
  background: #ff5f56;
}

.dot.yellow {
  background: #ffbd2e;
}

.dot.green {
  background: #27c93f;
}

.code-title {
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Courier New', monospace;
}

.code-content {
  padding: 20px;
  margin: 0;
  color: #d4d4d4;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  min-height: 200px;
  max-height: 300px;
  overflow: hidden;
}

.code-content code {
  color: #9cdcfe;
}

/* Neural Network Visualization */
.neural-network {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0.15;
  z-index: 1;
  pointer-events: none;
}

.neural-node {
  fill: url(#nodeGradient);
  animation: pulse-node 3s ease-in-out infinite;
}

@keyframes pulse-node {
  0%, 100% {
    opacity: 0.6;
    r: 4;
  }
  50% {
    opacity: 1;
    r: 6;
  }
}

.neural-connection {
  stroke: #00ffff;
  stroke-width: 1;
  opacity: 0.3;
  animation: pulse-connection 3s ease-in-out infinite;
}

@keyframes pulse-connection {
  0%, 100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.5;
  }
}

/* Data Visualization Background */
.data-viz-background {
  position: absolute;
  width: 50%;
  max-width: 400px;
  height: auto;
  top: 50%;
  left: 5%;
  transform: translateY(-50%);
  opacity: 0.1;
  z-index: 1;
  pointer-events: none;
}

.data-bar {
  fill: #00ffff;
  opacity: 0.6;
}

.line-graph {
  fill: none;
  stroke: #667eea;
  stroke-width: 2;
  opacity: 0.7;
}

.graph-point {
  fill: #764ba2;
  opacity: 0;
  animation: fade-in-point 0.5s ease forwards;
}

@keyframes fade-in-point {
  to {
    opacity: 1;
  }
}

/* Responsive adjustments for new elements */
@media (max-width: 1024px) {
  .code-window {
    width: 320px;
    max-width: 38%;
    top: 5%;
    right: 2%;
  }
  
  .code-content {
    font-size: 11px;
    padding: 16px;
  }
  
  .neural-network,
  .data-viz-background {
    opacity: 0.08;
  }
}

@media (max-width: 768px) {
  .code-window {
    display: none; /* Hide on mobile for better UX */
  }
  
  .grid-background {
    background-size: 30px 30px;
  }
  
  .data-viz-background {
    width: 60%;
    left: 2%;
  }
}

</style>
