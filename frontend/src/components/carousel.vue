<template>
  <swiper
    :effect="'coverflow'"
    :grabCursor="true"
    :centeredSlides="true"
    :slidesPerView="'auto'"
    :coverflowEffect="{
      rotate: 50,
      stretch: 0,
      depth: 100,
      modifier: 1,
      slideShadows: true,
    }"
    :pagination="{
      clickable: true,
    }"
    :modules="modules"
    :autoplay="{
      delay: 5000,
      disableOnInteraction: false,
    }"
    class="mySwiper"
  >
    <swiper-slide><img src="/MAD2.png" /></swiper-slide>
    <swiper-slide><img src="/SE.png" /></swiper-slide>
    <swiper-slide><img src="/MAD2_2.png" /></swiper-slide>
    <swiper-slide><img src="/MAD2.png" /></swiper-slide>
    <swiper-slide><img src="/MAD2.png" /></swiper-slide>
    <swiper-slide><img src="/MAD2.png" /></swiper-slide>
    <swiper-slide><img src="/MAD2.png" /></swiper-slide>
    <swiper-slide><img src="/MAD2.png" /></swiper-slide>
    <swiper-slide><img src="/MAD2.png" /></swiper-slide>
  </swiper>
</template>

<script>
// Import Swiper Vue.js components
import { Swiper, SwiperSlide } from 'swiper/vue';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

// import required modules
import { EffectCoverflow, Pagination, Autoplay } from 'swiper/modules';

export default {
  components: {
    Swiper,
    SwiperSlide,
  },
  setup() {
    return {
      modules: [EffectCoverflow, Pagination, Autoplay],
    };
  },
};
</script>


<style scoped>
/* No changes to existing styles */
#app {
  height: 100%;
}
html,
body {
  position: relative;
  height: 100%;
}
body {
  background: #000;
  font-family: Helvetica Neue, Helvetica, Arial, sans-serif;
  font-size: 14px;
  color: #fff;
  margin: 0;
  padding: 0;
}
.swiper {
  width: 100%;
  padding-top: 50px;
  padding-bottom: 50px;
}
.swiper-slide {
  background-position: center;
  background-size: cover;
  width: 480px;
  height: 270px;
}
.swiper-slide img {
  display: block;
  width: 100%;
}

/* --- MODIFIED CSS FOR TABLET-SHAPED DOTS --- */
:deep(.swiper-pagination-bullet) {
  /* Changed from a circle to a smaller pill shape */
  width: 18px;
  height: 5px;
  border-radius: 3px;

  background-color: #cccccc;
  opacity: 1;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

:deep(.swiper-pagination-bullet-active) {
  background-color: #cccccc;
}

/* The blue filling progress bar */
:deep(.swiper-pagination-bullet-active::after) {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #007aff;
  /* Ensure the filling bar also has the pill shape */
  border-radius: 3px;

  animation-name: pagination-progress;
  animation-duration: 5s;
  animation-timing-function: linear;
  transform-origin: left;
}

@keyframes pagination-progress {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}
</style>