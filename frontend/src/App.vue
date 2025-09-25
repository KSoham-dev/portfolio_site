<script setup>
import { ref, watch, onUnmounted } from 'vue';
import Carousel from './components/carousel.vue';

// Social menu logic remains the same
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
  document.removeEventListener('mousedown', handleClickOutside);
});

// The activeSection state has been removed to allow scrolling
</script>

<template>
  <div
    class="navbar p-4 rounded-2xl bg-white/90 backdrop-blur-lg shadow-md flex items-center justify-between border-2 border-black border-solid fixed top-6 left-6 right-6 z-50">
    <div class="text-2xl font-bold">SK</div>
    <div class="flex items-center space-x-2 sm:space-x-4">
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

  <div v-if="isSocialMenuOpen" class="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300">
  </div>
  <div ref="socialMenuContainer" class="fixed bottom-6 right-6 z-50 flex flex-col items-center space-y-4">
    <div v-if="isSocialMenuOpen"
      class="flex flex-col items-center space-y-5 p-3 rounded-full bg-white/90 backdrop-blur-lg shadow-md border-2 border-black transition-all duration-300">
      <a href="#" class="text-black hover:opacity-70 transition-opacity"><i class="ri-github-line text-3xl"></i></a>
      <a href="#" class="text-black hover:opacity-70 transition-opacity"><i class="ri-linkedin-line text-3xl"></i></a>
      <a href="#" class="text-black hover:opacity-70 transition-opacity"><i class="ri-mail-line text-3xl"></i></a>
      <a href="#" class="text-black hover:opacity-70 transition-opacity"><i class="ri-chat-ai-line text-3xl"></i></a>
    </div>
    <button @click="toggleSocialMenu"
      class="bg-white border-2 border-black rounded-lg text-black font-bold text-sm px-5 py-2.5 text-center transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-offset-2 focus:ring-black flex items-center space-x-2">
      <i :class="isSocialMenuOpen ? 'ri-close-line' : 'ri-chat-3-line'" class="text-lg"></i>
      <span>{{ isSocialMenuOpen ? 'Close' : 'Talk to me' }}</span>
    </button>
  </div>

  <main>
    <div id="home" class="content-section min-h-screen p-4 md:p-8 flex flex-col md:flex-row items-center">
      <div class="w-full md:w-1/2 p-4">
        <h1 class="text-7xl font-bold mb-4 leading-tight">
          <p> Soham </p> Kulkarni
        </h1>
          <p>A final-year Data Science student at IIT Madras</p>
          <p>specializing in building intelligent systems,</p>
          <p>with a firm grounding in mathematics</p>
      </div>
      <div class="w-full md:w-1/2 p-4">
        <div class=" rounded-lg p-8 w-full h-64 md:h-80 flex items-center justify-center">
          <img src="/profile_pic.png" width="360px" />
        </div>
      </div>
    </div>

    <div id="projects"
      class="content-section min-h-screen bg-black text-white p-4 md:p-8 flex flex-col md:flex-row items-center">
      <div class="w-full md:w-1/2 p-4">
        <h1 class="text-7xl font-bold mb-4 leading-tight">Projects</h1>
          <p>This selection of projects demonstrates</p>
          <p>my process of deconstructing a problem</p>
          and building a robust, end-to-end solution.
      </div>
      <div class="w-full md:w-1/2 p-4">
        <div class=" flex items-center justify-center">
          <Carousel />
      </div>
      </div>
    </div>

    <div id="blog" class="content-section min-h-screen bg-white p-4 md:p-8 flex flex-col md:flex-row items-center">
      <div class="w-full md:w-1/2 p-4">
        <h1 class="text-7xl font-bold mb-4 leading-tight">Blog</h1>
        <p>A space for my thoughts and deep dives into</p>
        <p>the world of data science. Here, I explore the</p>
        concepts behind the code, A space for the curious
      </div>
      <div class="w-full md:w-1/2 p-4">
        <div class=" rounded-lg p-8 w-full h-64 md:h-80 flex items-center justify-center">
          <p class="text-gray-500">Coming Soon</p>
        </div>
      </div>
    </div>

    <div id="about"
      class="content-section min-h-screen bg-black text-white p-4 md:p-8 flex flex-col md:flex-row items-center">
      <div class="w-full md:w-1/2 p-4">
        <h1 class="text-7xl font-bold mb-4 leading-tight">About</h1>
        <p class="text-gray-400">This is the about section.</p>
      </div>
      <div class="w-full md:w-1/2 p-4">
        <div class=" rounded-lg p-8 w-full h-64 md:h-80 flex items-center justify-center">
          <p class="text-gray-500">Content for the right side goes here.</p>
        </div>
      </div>
    </div>
  </main>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Carrois+Gothic+SC&display=swap');

html {
  /* This CSS rule makes the browser scroll smoothly when a link is clicked */
  scroll-behavior: smooth;
  scroll-padding-top: 7rem;
}

body {
  background-color: #ffffff;
  font-family: 'Carrois-Gothic-SC', sans-serif;
}
</style>