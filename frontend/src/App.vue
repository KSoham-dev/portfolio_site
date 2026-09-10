<script setup>
import { ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue';
import projectDisplay from '/src/components/projectDisplay.vue';
import RAGChat from '/src/components/RAGChat.vue';
import { getIconName, getIconCdnUrl } from '/iconutils.js';

// State to control the visibility of the welcome screen
const isLoading = ref(true);
// State to show the explicit "click to enter" message
const showExplicitMessage = ref(false);

// State for RAG chat modal
const showRAGModal = ref(false);

const sectionIds = ['home', 'projects', 'skills', 'journey', 'blog'];

// Static scatter for the Home section's ambient floating particles -
// generated once, not reactive (they never need to change).
const homeParticles = Array.from({ length: 14 }, () => ({
  left: Math.random() * 100,
  bottom: Math.random() * 70,
  delay: Math.random() * 10,
  duration: 10 + Math.random() * 6
}));

let audioContext = null;
let messageTimeoutId = null; // To hold the ID of our 4-second timeout

// Next/Previous section navigation - a horizontal slider. currentSectionIndex
// drives the slide position directly (see .slider-track's transform binding
// in the template); there is no scroll position or IntersectionObserver to
// keep in sync with it.
const currentSectionIndex = ref(0);
const isTransitioning = ref(false);
// Must match .slider-track's CSS transition-duration.
const SLIDE_TRANSITION_MS = 600;
let slideTransitionTimeoutId = null;

// Audio: a continuously looping background track (the uploaded song), plus
// a short click sound synthesized with the Web Audio API (the same
// audioContext used for the welcome chime) rather than an audio file -
// gives a crisp, actual "click" instead of a music clip standing in for one.
let bgmAudio = null;
const BGM_VOLUME = 0.14;

const startBgm = () => {
  if (isMuted.value) return;
  try {
    if (!bgmAudio) {
      bgmAudio = new Audio('/assets/audio/click-sound.mp3');
      bgmAudio.loop = true;
      bgmAudio.volume = BGM_VOLUME;
    }
    bgmAudio.play().catch(() => {});
  } catch (e) {
    console.error('Could not play background music.', e);
  }
};

const playClickSound = () => {
  if (isMuted.value || !audioContext) return;
  try {
    if (audioContext.state === 'suspended') audioContext.resume();
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(950, now);
    oscillator.frequency.exponentialRampToValueAtTime(240, now + 0.05);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.3, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    oscillator.start(now);
    oscillator.stop(now + 0.08);
  } catch (e) {
    console.error('Could not play click sound.', e);
  }
};

// Mute toggle - silences both the background music and the click sound,
// remembered across visits.
const isMuted = ref(false);
try {
  isMuted.value = localStorage.getItem('portfolio-muted') === 'true';
} catch (e) {
  // localStorage unavailable (e.g. private browsing) - default to unmuted
}

const toggleMute = () => {
  isMuted.value = !isMuted.value;
  try {
    localStorage.setItem('portfolio-muted', String(isMuted.value));
  } catch (e) {
    // ignore persistence failures
  }
  if (isMuted.value) {
    if (bgmAudio) bgmAudio.pause();
  } else {
    startBgm();
    playClickSound(); // confirmation click
  }
};

const goToSection = (index) => {
  const total = sectionIds.length;
  const newIndex = ((index % total) + total) % total;
  if (newIndex === currentSectionIndex.value) return;

  playClickSound();
  currentSectionIndex.value = newIndex;

  // Briefly disable the nav controls while the slide animates, so a rapid
  // double-click doesn't queue up a disorienting jump.
  isTransitioning.value = true;
  clearTimeout(slideTransitionTimeoutId);
  slideTransitionTimeoutId = setTimeout(() => {
    isTransitioning.value = false;
  }, SLIDE_TRANSITION_MS);
};

const nextSection = () => goToSection(currentSectionIndex.value + 1);
const prevSection = () => goToSection(currentSectionIndex.value - 1);

const handleKeydownNav = (e) => {
  if (isLoading.value || showRAGModal.value) return;
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;

  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
    e.preventDefault();
    nextSection();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault();
    prevSection();
  }
};

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
  startBgm();

  // Switch from the welcome screen to the main content
  isLoading.value = false;

  // The navbar/bottom-nav are only actually rendered (not display:none)
  // once isLoading flips, so measure clearances after that DOM update.
  nextTick(() => updateSlideClearances());

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

  // Disable right click
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Keyboard navigation for next/previous section
  document.addEventListener('keydown', handleKeydownNav);

  window.addEventListener('resize', updateViewportWidth);
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

// Tracks viewport width so the skill-circle radius below can shrink on
// narrow screens - it's used in an inline transform, not CSS, so a plain
// media query can't reach it.
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280);
const updateViewportWidth = () => {
  viewportWidth.value = window.innerWidth;
  updateSlideClearances();
};

// Each .slide reserves top/bottom padding to clear the fixed navbar and
// the floating Next/Previous bar, so section content can be centered
// between them with no scroll. Rather than guessing those two heights as
// fixed rem values (which drift out of sync with the real elements and
// either clip content or waste space), measure the actual rendered boxes
// and expose them as CSS custom properties the .slide padding reads.
const navbarWrapperEl = ref(null);
const bottomNavWrapperEl = ref(null);

const updateSlideClearances = () => {
  if (!navbarWrapperEl.value || !bottomNavWrapperEl.value) return;
  const navBottom = navbarWrapperEl.value.getBoundingClientRect().bottom;
  const bottomNavHeight = window.innerHeight - bottomNavWrapperEl.value.getBoundingClientRect().top;
  // A little breathing room past each element's own edge.
  document.documentElement.style.setProperty('--nav-clearance', `${Math.ceil(navBottom) + 24}px`);
  document.documentElement.style.setProperty('--bottom-clearance', `${Math.ceil(bottomNavHeight) + 24}px`);
};

// Function to calculate circular position for skill icons
const getSkillPosition = (index, total) => {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  // Fixed radius overflowed narrow viewports - the mobile CSS already
  // shrinks the container and icons, but this radius is applied via
  // inline transform, so it needs its own breakpoint here.
  const radius = viewportWidth.value < 640 ? 130 : 220;
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

// Blog data
const blogPosts = ref([
  {
    id: 'feature-engineering',
    tag: 'Machine Learning',
    title: 'Why Feature Engineering Still Beats Fancy Models',
    date: 'Aug 2026',
    readTime: '6 min read',
    excerpt: 'A well-chosen feature will outrun a poorly-fed transformer every time. Here is what I keep relearning on real datasets.',
    body: [
      { type: 'p', text: "Every few months a new architecture shows up promising to make feature engineering obsolete. In practice, on the messy tabular datasets most of us actually work with, a thoughtfully engineered feature set still beats throwing raw columns at a bigger model. I learned this the hard way on a churn-prediction project where switching from raw timestamps to 'days since last purchase' improved recall more than three different model upgrades combined." },
      { type: 'h2', text: 'Start with domain logic, not correlation matrices' },
      { type: 'p', text: "It's tempting to let a correlation heatmap or SHAP plot tell you what matters. But those tools only rank what you already handed the model. If 'time since last login' isn't in your dataframe, no importance score will ever surface it. Spend the first hour with domain experts, not with pandas.corr()." },
      { type: 'code', lang: 'python', text: "# Turning a raw timestamp into signal the model can actually use\ndf['days_since_last_purchase'] = (\n    pd.Timestamp.now() - df['last_purchase_at']\n).dt.days\n\ndf['purchase_frequency'] = (\n    df.groupby('customer_id')['order_id'].transform('count')\n    / df['days_since_last_purchase'].clip(lower=1)\n)" },
      { type: 'h2', text: 'Ratios and rates beat raw counts' },
      { type: 'p', text: "Raw counts are rarely stationary - a customer active for two years will naturally have more orders than one active for two months. Normalizing counts into rates (orders per active month, spend per session) makes the feature comparable across the population, which is usually what the model needs to separate classes cleanly." },
      { type: 'p', text: "None of this replaces a good model. But I've found the ceiling on a well-engineered feature set with a plain gradient-boosted tree is often higher than the ceiling on raw features with a deep network, and it gets there in a fraction of the training time." }
    ]
  },
  {
    id: 'imbalanced-data',
    tag: 'Data Science',
    title: 'Handling Imbalanced Datasets Without Losing Your Mind',
    date: 'Jul 2026',
    readTime: '7 min read',
    excerpt: 'Accuracy lies when 98% of your data belongs to one class. A field guide to the techniques that actually move the needle.',
    body: [
      { type: 'p', text: "The first time I trained a fraud-detection model, it hit 99.1% accuracy and detected exactly zero fraud cases. That's the imbalanced-data trap: when one class dominates, a model can look brilliant on the wrong metric while learning nothing useful." },
      { type: 'h2', text: 'Fix the metric before you fix the data' },
      { type: 'p', text: 'Before touching the dataset, swap accuracy for precision, recall, and PR-AUC. Accuracy rewards a model for predicting the majority class every time. PR-AUC specifically cares about how well you rank the minority class, which is usually the one you actually care about.' },
      { type: 'h2', text: 'Resampling, but carefully' },
      { type: 'p', text: "SMOTE and its variants can help, but they synthesize points in feature space that may not correspond to anything real - especially with categorical or high-dimensional data. I've had more consistent luck with class-weighted loss functions, which nudge the model without inventing data." },
      { type: 'code', lang: 'python', text: "from sklearn.utils.class_weight import compute_class_weight\n\nweights = compute_class_weight(\n    class_weight='balanced',\n    classes=np.unique(y_train),\n    y=y_train\n)\nclass_weight_dict = dict(zip(np.unique(y_train), weights))\n\nmodel = XGBClassifier(scale_pos_weight=weights[1] / weights[0])\nmodel.fit(X_train, y_train)" },
      { type: 'p', text: "Whatever technique you choose, always evaluate on an untouched, naturally-imbalanced validation set. Resampling the training data is fine; resampling your judgment of how the model performs in the real world is not." }
    ]
  },
  {
    id: 'boosting-libraries',
    tag: 'ML Engineering',
    title: 'XGBoost vs LightGBM vs CatBoost: Picking Your Boosting Library',
    date: 'Jun 2026',
    readTime: '8 min read',
    excerpt: 'Three excellent gradient-boosting libraries, three very different defaults. Here is how I decide which one to reach for.',
    body: [
      { type: 'p', text: "Gradient-boosted trees still win a disproportionate share of tabular-data competitions and production pipelines, and for good reason - they're fast, interpretable-ish, and forgiving of messy features. The question I get asked most is which library to start with." },
      { type: 'h2', text: 'XGBoost: the reliable default' },
      { type: 'p', text: "XGBoost is the one I reach for when I need something battle-tested with a huge community and predictable behavior across environments. Its regularization options (L1/L2 on leaf weights) make it a good first line of defense against overfitting on smaller datasets." },
      { type: 'h2', text: 'LightGBM: when data gets large' },
      { type: 'p', text: "LightGBM's leaf-wise growth (instead of level-wise) trains noticeably faster on large datasets and handles high-cardinality categoricals more gracefully out of the box. The tradeoff is it can overfit small datasets more easily if you leave max_depth unconstrained." },
      { type: 'h2', text: 'CatBoost: when categoricals dominate' },
      { type: 'p', text: "If your dataset is mostly categorical columns with lots of unique values, CatBoost's ordered target encoding saves you from writing your own encoding pipeline and from the target leakage that naive encodings introduce." },
      { type: 'code', lang: 'python', text: "# A reasonable starting point for a quick benchmark across all three\nfor name, Model in [('xgb', XGBClassifier), ('lgb', LGBMClassifier), ('cat', CatBoostClassifier)]:\n    model = Model(n_estimators=500, learning_rate=0.05, random_state=42)\n    model.fit(X_train, y_train)\n    print(name, roc_auc_score(y_val, model.predict_proba(X_val)[:, 1]))" },
      { type: 'p', text: "In practice I benchmark all three on a held-out split before committing - the 'best' library changes with dataset size, categorical density, and how much time you have for hyperparameter tuning." }
    ]
  },
  {
    id: 'notebook-to-production',
    tag: 'MLOps',
    title: 'From Notebook to Production: Lessons Learned the Hard Way',
    date: 'May 2026',
    readTime: '9 min read',
    excerpt: 'A model that works in a Jupyter cell is a prototype, not a product. The gap between the two taught me more than any course did.',
    body: [
      { type: 'p', text: "My first deployed model broke in production within a week - not because the model was wrong, but because the notebook that trained it and the service that served it disagreed about how a column was encoded. Nobody warns you that the hardest part of ML engineering is rarely the ML." },
      { type: 'h2', text: 'Pin your preprocessing, not just your model' },
      { type: 'p', text: "A pickled model file is useless without the exact preprocessing pipeline that produced its training features. I now wrap preprocessing and model into a single sklearn Pipeline (or an equivalent) and version them together, so 'the model' and 'the transform' can never drift apart." },
      { type: 'code', lang: 'python', text: "pipeline = Pipeline([\n    ('preprocess', ColumnTransformer([\n        ('num', StandardScaler(), numeric_cols),\n        ('cat', OneHotEncoder(handle_unknown='ignore'), cat_cols),\n    ])),\n    ('model', XGBClassifier(n_estimators=300)),\n])\npipeline.fit(X_train, y_train)\njoblib.dump(pipeline, 'model_v3.joblib')" },
      { type: 'h2', text: 'Monitor inputs, not just outputs' },
      { type: 'p', text: "Model performance dashboards are useless if the ground truth arrives weeks later. What catches problems early is watching the input distribution - if a feature's mean or missing-rate suddenly shifts, something upstream broke, and you want to know before the accuracy metric quietly decays." },
      { type: 'p', text: "None of this is glamorous, and none of it shows up in a Kaggle leaderboard. But it's the difference between a model that works once and a model that keeps working." }
    ]
  },
  {
    id: 'attention-explained',
    tag: 'Deep Learning',
    title: 'Attention Mechanisms, Explained Without the Math Headache',
    date: 'Apr 2026',
    readTime: '7 min read',
    excerpt: 'Forget the equations for a second. Attention is just a very structured way of asking "what should I be looking at right now?"',
    body: [
      { type: 'p', text: "Attention gets introduced with a wall of matrix multiplications, and that's a shame, because the underlying idea is almost embarrassingly intuitive: for every word, decide how much to 'pay attention' to every other word before deciding what it means in context." },
      { type: 'h2', text: 'A translation analogy' },
      { type: 'p', text: "Imagine translating 'the bank was steep' versus 'the bank approved the loan'. The word 'bank' needs different context each time - 'steep' pulls it toward a riverbank, 'loan' pulls it toward a financial institution. Attention is the mechanism that lets the model look at the surrounding words and weight them by relevance before forming its final representation of 'bank'." },
      { type: 'h2', text: 'Queries, keys, and values - as a search engine' },
      { type: 'p', text: "The Query/Key/Value framing clicked for me once I thought of it as a search engine. The Query is your search term. Every word in the sentence offers a Key (how it advertises itself) and a Value (the actual content it contributes). Attention scores each Key against your Query, and the output is a weighted blend of Values - weighted more heavily toward whichever words' Keys matched best." },
      { type: 'code', lang: 'python', text: "# Simplified single-head attention, stripped of batching/masking\nscores = (Q @ K.T) / np.sqrt(d_k)      # how well each key matches the query\nweights = softmax(scores, axis=-1)     # normalize into a distribution\noutput = weights @ V                    # blend values by attention weight" },
      { type: 'p', text: "Multi-head attention is just running several of these searches in parallel, each free to learn a different notion of 'relevance' - one head might track syntax, another might track long-range topic coherence. Stack enough of these and you get a model that builds context almost the way we do: by constantly re-weighing what matters given everything around it." }
    ]
  }
]);

const showBlogReader = ref(false);
const activeBlogPost = ref(null);
const readerScrollEl = ref(null);
const activeBlogIndex = computed(() =>
  activeBlogPost.value ? blogPosts.value.findIndex((p) => p.id === activeBlogPost.value.id) : -1
);

const resetReaderScroll = () => {
  nextTick(() => {
    if (readerScrollEl.value) readerScrollEl.value.scrollTop = 0;
  });
};

const openBlogPost = (post) => {
  playClickSound();
  activeBlogPost.value = post;
  showBlogReader.value = true;
  resetReaderScroll();
};

const closeBlogReader = () => {
  playClickSound();
  showBlogReader.value = false;
};

const readNextPost = () => {
  if (activeBlogIndex.value === -1) return;
  playClickSound();
  const nextIndex = (activeBlogIndex.value + 1) % blogPosts.value.length;
  activeBlogPost.value = blogPosts.value[nextIndex];
  resetReaderScroll();
};

const readPrevPost = () => {
  if (activeBlogIndex.value === -1) return;
  playClickSound();
  const total = blogPosts.value.length;
  const prevIndex = (activeBlogIndex.value - 1 + total) % total;
  activeBlogPost.value = blogPosts.value[prevIndex];
  resetReaderScroll();
};

onUnmounted(() => {
  clearTimeout(messageTimeoutId); // Clean up the timer
  clearTimeout(slideTransitionTimeoutId);
  if (bgmAudio) bgmAudio.pause();
  document.removeEventListener('mousedown', enterSite);
  document.removeEventListener('keydown', enterSite);
  document.removeEventListener('mousedown', handleClickOutside);
  document.removeEventListener('keydown', handleKeydownNav);
  window.removeEventListener('resize', updateViewportWidth);
});
</script>

<template>
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

    <div ref="navbarWrapperEl" class="fixed top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 z-50">
      <div
        class="navbar p-4 rounded-2xl bg-white/90 backdrop-blur-lg shadow-md flex items-center justify-center lg:justify-between border-2 border-black border-solid">
        <div class="text-2xl font-bold">SK</div>

        <div class="hidden lg:flex items-center space-x-2 sm:space-x-4">
          <a href="#home" @click.prevent="goToSection(0)" :class="{ 'nav-link-active': currentSectionIndex === 0 }"
            class="nav-link w-24 bg-white border-2 border-black rounded text-black font-bold text-sm px-5 py-2.5 text-center transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-offset-2 focus:ring-black">
            Home
          </a>
          <a href="#projects" @click.prevent="goToSection(1)" :class="{ 'nav-link-active': currentSectionIndex === 1 }"
            class="nav-link w-24 bg-white border-2 border-black rounded text-black font-bold text-sm px-5 py-2.5 text-center transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-offset-2 focus:ring-black">
            Projects
          </a>
          <a href="#skills" @click.prevent="goToSection(2)" :class="{ 'nav-link-active': currentSectionIndex === 2 }"
            class="nav-link w-24 bg-white border-2 border-black rounded text-black font-bold text-sm px-5 py-2.5 text-center transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-offset-2 focus:ring-black">
            Skills
          </a>
          <a href="#journey" @click.prevent="goToSection(3)" :class="{ 'nav-link-active': currentSectionIndex === 3 }"
            class="nav-link w-28 bg-white border-2 border-black rounded text-black font-bold text-sm px-5 py-2.5 text-center transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-offset-2 focus:ring-black">
            Journey
          </a>
          <a href="#blog" @click.prevent="goToSection(4)" :class="{ 'nav-link-active': currentSectionIndex === 4 }"
            class="nav-link w-24 bg-white border-2 border-black rounded text-black font-bold text-sm px-5 py-2.5 text-center transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-offset-2 focus:ring-black">
            Blog
          </a>
        </div>
      </div>
    </div>

    <!-- Floating Next / Previous section navigation -->
    <div ref="bottomNavWrapperEl" class="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3">
      <button @click="toggleMute" :aria-label="isMuted ? 'Unmute click sound' : 'Mute click sound'"
        class="section-nav-arrow mute-toggle">
        <i :class="isMuted ? 'ri-volume-mute-line' : 'ri-volume-up-line'"></i>
      </button>

      <button @click="prevSection" :disabled="isTransitioning" aria-label="Previous section"
        class="section-nav-arrow">
        <i class="ri-arrow-left-line"></i>
      </button>

      <div class="section-dots">
        <button v-for="(id, idx) in sectionIds" :key="id" @click="goToSection(idx)"
          :class="['section-dot', { active: currentSectionIndex === idx }]" :aria-label="`Go to ${id}`"></button>
      </div>

      <button @click="nextSection" :disabled="isTransitioning" aria-label="Next section"
        class="section-nav-arrow section-nav-arrow-next">
        <span class="hidden sm:inline">Next</span>
        <i class="ri-arrow-right-line"></i>
      </button>
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
              <a href="https://github.com/KSoham-dev" @click="playClickSound" class="text-black hover:opacity-70 transition-opacity" target="_blank"><i
                  class="ri-github-line text-3xl"></i></a>
              <a href="https://www.linkedin.com/in/ksohamdev/" @click="playClickSound" class="text-black hover:opacity-70 transition-opacity"
                target="_blank"><i class="ri-linkedin-line text-3xl"></i></a>
              <a href="https://mail.google.com/mail/u/0/?fs=1&to=sohamkulkarni709@gmail.com&su=Hello&body=I+wanted+to+reach+out!&tf=cm"
                @click="playClickSound" class="text-black hover:opacity-70 transition-opacity" target="_blank"><i
                  class="ri-mail-line text-3xl"></i></a>
              <button @click="playClickSound(); showRAGModal = true; isSocialMenuOpen = false"
                class="text-black hover:opacity-70 transition-opacity" title="Ask me anything"><i
                  class="ri-chat-ai-line text-3xl"></i></button>
            </div>
          </div>
        </transition>

        <button @click="playClickSound(); toggleSocialMenu()"
          class="bg-white border-2 border-black rounded-lg text-black font-extra-bold text-sm px-5 py-2.5 text-center transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-offset-2 focus:ring-black flex items-center space-x-2">
          <i :class="isSocialMenuOpen ? 'ri-close-line' : 'ri-chat-3-line'" class="text-lg"></i>
          <span>{{ isSocialMenuOpen ? 'Close' : 'Connect' }}</span>
        </button>
      </div>
      <div class="hidden lg:flex items-center space-x-4">
        <a href="https://github.com/KSoham-dev" @click="playClickSound"
          class="w-14 h-14 bg-white/75 backdrop-blur-lg rounded-full shadow-md border-2 border-black flex items-center justify-center text-black hover:opacity-70 transition-opacity"
          target="_blank">
          <i class="ri-github-line text-3xl"></i>
        </a>
        <a href="https://www.linkedin.com/in/ksohamdev/" @click="playClickSound"
          class="w-14 h-14 bg-white/75 backdrop-blur-lg rounded-full shadow-md border-2 border-black flex items-center justify-center text-black hover:opacity-70 transition-opacity"
          target="_blank">
          <i class="ri-linkedin-line text-3xl"></i>
        </a>
        <a href="mailto:sohamkulkarni709@gmail.com" @click="playClickSound"
          class="w-14 h-14 bg-white/75 backdrop-blur-lg rounded-full shadow-md border-2 border-black flex items-center justify-center text-black hover:opacity-70 transition-opacity"
          target="_blank">
          <i class="ri-mail-line text-3xl"></i>
        </a>
        <button @click="playClickSound(); showRAGModal = true"
          class="w-14 h-14 bg-white/75 backdrop-blur-lg rounded-full shadow-md border-2 border-black flex items-center justify-center text-black hover:opacity-70 transition-opacity"
          title="Ask me anything">
          <i class="ri-chat-ai-line text-3xl"></i>
        </button>
      </div>

    </div>

    <main class="slider-viewport">
      <div class="slider-track" :style="{ transform: `translateX(-${currentSectionIndex * 100}%)` }">
      <div id="home" class="slide">
      <div class="content-section w-full px-4 lg:px-8 flex flex-col lg:flex-row lg:items-center">
        <!-- Animated Background Grid -->
        <div class="grid-background"></div>

        <!-- Floating Particles -->
        <div class="particles-container particles-light">
          <span v-for="(p, i) in homeParticles" :key="i" class="particle" :style="{
            left: p.left + '%',
            bottom: p.bottom + '%',
            animationDelay: p.delay + 's',
            animationDuration: p.duration + 's'
          }"></span>
        </div>

        <div class="w-full text-center lg:text-left lg:w-1/2 lg:p-4 relative z-10">
          <h1 class="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight whitespace-nowrap">
            Soham Kulkarni
          </h1>
          <div class="subhead text-xl">
            <p>A final-year Data Science student at IIT Madras, currently working as an ML Engineer Intern at Helloramp.ai.</p>
            <p>I build intelligent systems end-to-end — from feature engineering and model design to shipping and monitoring them in production.</p>
            <p>With a firm grounding in mathematics and a habit of turning ambiguous problems into clean, reliable solutions, I care as much about the details as I do about the bigger picture.</p>
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
      </div>

      <div id="projects" class="slide bg-black text-white">
      <div class="content-section w-full px-4 lg:px-8 flex flex-col lg:flex-row lg:items-center">
        <div class="w-full text-center lg:text-left lg:w-1/2 p-4 relative z-10">
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">Projects</h1>
          <div class="subhead text-xl">
            <p>This selection demonstrates my process of deconstructing a real-world problem and building a robust, end-to-end solution around it — not just a model in a notebook.</p>
            <p>Each one pairs a practical need with the tools suited to it: gradient boosting for churn prediction, an LLM-backed guide for personalized learning, and a task queue for a library system under real concurrency.</p>
            <p>Browse the cards to see the problem, the stack, and the reasoning behind each choice.</p>
          </div>
        </div>
        <div class="w-full lg:w-1/2 p-4 relative z-10">
          <div class="flex items-center justify-center">
            <projectDisplay />
          </div>
        </div>
      </div>
      </div>

      <div id="skills" class="slide bg-white">
      <div class="content-section w-full px-4 lg:px-8 flex flex-col lg:flex-row lg:items-center">
        <!-- Animated Background Grid -->
        <div class="grid-background"></div>

        <div class="w-full text-center lg:text-left lg:w-1/2 p-4 relative z-10">
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">Skills</h1>
          <div class="subhead text-xl">
            <p>Python is home base — TensorFlow, PyTorch, and scikit-learn for modeling, Pandas and NumPy for everything that happens before a model ever sees the data.</p>
            <p>Apache Spark and PostgreSQL handle the scale that a laptop can't, while Docker and Kubernetes carry a project from a notebook to something that actually runs in production.</p>
            <p>Git, Linux, and Google Cloud round out the workflow underneath all of it.</p>
          </div>
          <p class="text-lg mt-6 opacity-70">Hover a bubble to see what it is.</p>
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
      </div>

      <div id="journey" class="slide bg-black text-white">
      <div class="content-section w-full px-4 lg:px-8 flex flex-col items-center">
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

        <div class="w-full max-w-6xl relative z-10">
          <div class="text-center mb-8 lg:mb-4">
            <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 leading-tight">Journey</h1>
            <p class="text-lg">My professional path and academic milestones that define my career.</p>
          </div>

          <!-- Horizontal branching tree (desktop) -->
          <div class="tree hidden lg:block">
            <div class="tree-trunk"></div>
            <div class="tree-nodes">
              <div v-for="(edu, index) in educationData" :key="edu.id"
                class="tree-node" :class="index % 2 === 0 ? 'branch-up' : 'branch-down'">
                <div class="tree-card">
                  <h3 class="text-base font-bold mb-1">{{ edu.degree }}</h3>
                  <p class="text-sm font-semibold mb-1">{{ edu.institution }}</p>
                  <p class="text-xs tree-card-year mb-2">{{ edu.year }}</p>
                  <p class="text-xs tree-card-desc">{{ edu.description }}</p>
                </div>
                <div class="tree-stem"></div>
                <div class="tree-dot"></div>
              </div>
            </div>
          </div>

          <!-- Vertical timeline (mobile/tablet) -->
          <div class="timeline-container lg:hidden">
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
      </div>

      <div id="blog" class="slide bg-white">
      <div class="content-section w-full px-4 lg:px-8 flex flex-col items-center">
        <!-- Animated Background Grid -->
        <div class="grid-background"></div>

        <div class="w-full max-w-6xl relative z-10">
          <div class="text-center mb-8 lg:mb-10">
            <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 leading-tight">Blog</h1>
            <p class="text-xl">Notes on data science, machine learning,</p>
            <p class="text-xl">and the occasional production war story.</p>
          </div>

          <div class="blog-row-wrapper">
            <div class="blog-row">
              <button v-for="post in blogPosts" :key="post.id" @click="openBlogPost(post)" class="blog-card">
                <span class="blog-card-tag">{{ post.tag }}</span>
                <h3 class="blog-card-title">{{ post.title }}</h3>
                <p class="blog-card-excerpt">{{ post.excerpt }}</p>
                <div class="blog-card-footer">
                  <span class="blog-card-meta">{{ post.date }} · {{ post.readTime }}</span>
                  <span class="blog-card-cta">Read <i class="ri-arrow-right-line"></i></span>
                </div>
              </button>
            </div>
            <p class="blog-row-hint"><i class="ri-arrow-left-right-line"></i> scroll for more</p>
          </div>
        </div>
      </div>
      </div>
      </div>
      <!-- /.slider-track -->

      <!-- Blog Reader Modal -->
      <div v-if="showBlogReader && activeBlogPost" class="fixed inset-0 z-50 flex items-center justify-center">
        <div @click="closeBlogReader" class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <div class="reader-modal relative z-10">
          <button @click="closeBlogReader" class="reader-close" aria-label="Close article">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <div class="reader-scroll" ref="readerScrollEl">
            <span class="reader-tag">{{ activeBlogPost.tag }}</span>
            <h1 class="reader-title">{{ activeBlogPost.title }}</h1>
            <p class="reader-meta">{{ activeBlogPost.date }} · {{ activeBlogPost.readTime }}</p>

            <div class="reader-body">
              <template v-for="(block, idx) in activeBlogPost.body" :key="idx">
                <h2 v-if="block.type === 'h2'" class="reader-h2">{{ block.text }}</h2>
                <pre v-else-if="block.type === 'code'" class="reader-code"><code>{{ block.text }}</code></pre>
                <p v-else class="reader-p">{{ block.text }}</p>
              </template>
            </div>
          </div>

          <div class="reader-footer">
            <button @click="readPrevPost" class="section-nav-arrow" aria-label="Previous article">
              <i class="ri-arrow-left-line"></i>
              <span class="hidden sm:inline">Prev</span>
            </button>
            <span class="reader-footer-count">{{ activeBlogIndex + 1 }} / {{ blogPosts.length }}</span>
            <button @click="readNextPost" class="section-nav-arrow section-nav-arrow-next" aria-label="Next article">
              <span class="hidden sm:inline">Next</span>
              <i class="ri-arrow-right-line"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- RAG Modal Overlay and Container -->
      <div v-if="showRAGModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Backdrop with blur -->
        <div
          @click="showRAGModal = false"
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
        ></div>
        <!-- Modal Content -->
        <div class="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[90vh] mx-4 flex flex-col z-50">
          <!-- Close Button -->
          <button
            @click="playClickSound(); showRAGModal = false"
            class="absolute top-4 right-4 z-10 text-gray-500 hover:text-black transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          <!-- RAG Chat Component -->
          <RAGChat :is-modal="true" />
        </div>
      </div>
    </main>

  </div>
</template>

<style>
/* FONT AND GLOBAL STYLES */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

html,
body {
  overflow: hidden;
  height: 100%;
}

body {
  background-color: #ffffff;
  font-family: "Cormorant Garamond", serif;
  font-weight: 400;
  font-style: normal;
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

.subhead p {
  margin-bottom: 14px;
  max-width: 40rem;
}

.subhead p:last-child {
  margin-bottom: 0;
}

/* Interactive Reveal Effect */
.reveal-container {
  position: relative;
  width: 460px;
  height: 460px;
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
  width: 580px;
  height: 580px;
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

/* Journey Section - horizontal branching tree (desktop). A trunk line
   runs across the middle; each milestone hangs off it as a stem that
   branches alternately up and down to a card, like a roadmap/commit
   graph rather than a plain vertical list. */
.tree {
  position: relative;
  height: 460px;
  margin-top: 20px;
}

.tree-trunk {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 3px;
  transform: translateY(-50%);
  background: linear-gradient(90deg, transparent, #667eea 10%, #764ba2 50%, #667eea 90%, transparent);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.8), 0 0 40px rgba(118, 75, 162, 0.5);
}

.tree-nodes {
  position: absolute;
  inset: 0;
  display: flex;
}

.tree-node {
  position: relative;
  flex: 1;
}

.tree-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: 3px solid #000;
  box-shadow: 0 0 15px rgba(102, 126, 234, 0.9);
  z-index: 3;
}

.tree-stem {
  position: absolute;
  left: 50%;
  width: 3px;
  transform: translateX(-50%);
  background: linear-gradient(180deg, #667eea, #764ba2);
  z-index: 1;
}

.tree-node.branch-up .tree-stem {
  bottom: 50%;
  height: 72px;
}

.tree-node.branch-down .tree-stem {
  top: 50%;
  height: 72px;
}

.tree-card {
  position: absolute;
  left: 50%;
  width: 230px;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  padding: 18px;
  border-radius: 14px;
  border: 2px solid rgba(102, 126, 234, 0.5);
  color: white;
  z-index: 2;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.tree-card:hover {
  transform: translateX(-50%) scale(1.08);
  border-color: rgba(102, 126, 234, 0.9);
  box-shadow: 0 12px 48px rgba(102, 126, 234, 0.4), 0 0 40px rgba(118, 75, 162, 0.3);
}

.tree-node.branch-up .tree-card {
  bottom: calc(50% + 72px);
}

.tree-node.branch-down .tree-card {
  top: calc(50% + 72px);
}

.tree-card-year {
  color: rgba(167, 139, 250, 0.9);
}

.tree-card-desc {
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.45;
}

@media (min-width: 1280px) {
  .tree-card {
    width: 260px;
    padding: 22px;
  }
}

/* Blog Section - a horizontal scroll row rather than a bounded-height
   grid, so a 5th card never gets hard-clipped mid-content the way a
   fixed max-height vertical grid would when it doesn't fit the viewport. */
.blog-row-wrapper {
  position: relative;
  margin: 0 -4px;
  padding: 4px 4px 0;
  /* Fade the row's edges so it reads as "more to scroll" rather than an
     abrupt cut - much clearer than a hidden scrollbar alone. */
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%);
  mask-image: linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%);
}

.blog-row {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  padding: 8px 24px 16px;
  scrollbar-width: thin;
}

.blog-row-hint {
  text-align: center;
  font-size: 0.85rem;
  color: #9ca3af;
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.blog-card {
  text-align: left;
  background: #ffffff;
  border: 2px solid #000;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
  box-shadow: 6px 6px 0px 0px rgba(0, 0, 0, 1);
  transition: all 0.25s ease;
  flex: 0 0 300px;
  width: 300px;
  scroll-snap-align: start;
}

.blog-card:hover {
  transform: translate(3px, 3px);
  box-shadow: 3px 3px 0px 0px rgba(0, 0, 0, 1);
  background: #fafafa;
}

.blog-card-tag {
  display: inline-block;
  width: fit-content;
  background: #000;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 9999px;
}

.blog-card-title {
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.3;
  color: #000;
}

.blog-card-excerpt {
  font-size: 1rem;
  color: #4b5563;
  line-height: 1.5;
  flex-grow: 1;
}

.blog-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.blog-card-meta {
  font-size: 0.85rem;
  color: #6b7280;
}

.blog-card-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
  font-size: 0.9rem;
  color: #000;
}

/* Blog Reader Modal */
.reader-modal {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 720px;
  max-height: 88vh;
  margin: 0 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reader-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 2px solid #000;
  border-radius: 50%;
  color: #000;
  transition: all 0.2s ease;
}

.reader-close:hover {
  transform: rotate(90deg);
}

.reader-scroll {
  padding: 48px 40px 24px;
  overflow-y: auto;
}

.reader-tag {
  display: inline-block;
  background: #000;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 5px 12px;
  border-radius: 9999px;
  margin-bottom: 16px;
}

.reader-title {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.2;
  color: #000;
  margin-bottom: 10px;
}

.reader-meta {
  font-size: 0.95rem;
  color: #6b7280;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 2px solid #000;
}

.reader-body {
  font-size: 1.15rem;
  line-height: 1.8;
  color: #1f2937;
}

.reader-p {
  margin-bottom: 20px;
}

.reader-h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #000;
  margin: 32px 0 16px;
}

.reader-code {
  background: #1e1e1e;
  color: #d4d4d4;
  border: 2px solid #000;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
}

.reader-code code {
  color: #9cdcfe;
}

.reader-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 2px solid #000;
  background: #fafafa;
}

.reader-footer-count {
  font-size: 0.9rem;
  font-weight: 600;
  color: #6b7280;
}

@media (max-width: 768px) {
  .blog-card {
    flex-basis: 82vw;
    width: 82vw;
  }

  .reader-scroll {
    padding: 40px 24px 20px;
  }

  .reader-title {
    font-size: 1.75rem;
  }

  .reader-body {
    font-size: 1.05rem;
  }
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

/* Horizontal slider: Next/Previous/dots/nav-links all just change
   currentSectionIndex, which drives this transform - the slide itself
   *is* the transition, no overlay trick needed. */
.slider-viewport {
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.slider-track {
  display: flex;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.65, 0, 0.35, 1);
  will-change: transform;
}

.slide {
  position: relative;
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Reserve exactly enough space to clear the fixed navbar (top) and the
     floating Next/Prev bar (bottom), so content centers between them
     with no scroll. --nav-clearance/--bottom-clearance are measured from
     the real elements at runtime (see updateSlideClearances) rather than
     guessed, so this never over-reserves (wasted empty space) or
     under-reserves (clipped headings) - the fallback values only apply
     for the first frame before that JS runs. Below lg, two-column
     sections stack their columns instead of sitting side by side, so
     content can still run taller than the viewport; allow that one axis
     to scroll there rather than shrink everything to force a fit.
     Desktop has no such case (every section fits its clearance) so
     stays fully non-scrolling. */
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: var(--nav-clearance, 7.5rem);
  padding-bottom: var(--bottom-clearance, 9rem);
}

@media (max-width: 1023px) {
  .slide {
    /* Plain block flow instead of flex-centering below lg: centering an
       overflowing flex child can leave its top edge unreachable by
       scroll in some browsers, whereas block flow with padding-top for
       navbar clearance scrolls normally either way. */
    display: block;
  }
}

@media (min-width: 1024px) {
  .slide {
    overflow: hidden;
  }
}

/* Nav link active state */
.nav-link {
  position: relative;
}

.nav-link-active {
  background: #000 !important;
  color: #fff !important;
}

/* Floating Next / Previous section controls */
.section-nav-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  min-width: 48px;
  padding: 0 14px;
  background: #ffffff;
  border: 2px solid #000;
  border-radius: 9999px;
  color: #000;
  font-weight: 700;
  font-size: 0.9rem;
  box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 1);
  transition: all 0.2s ease;
  cursor: pointer;
}

.section-nav-arrow i {
  font-size: 1.25rem;
}

.section-nav-arrow:hover:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1);
}

.section-nav-arrow-next {
  background: #000;
  color: #fff;
  box-shadow: 4px 4px 0px 0px rgba(102, 126, 234, 0.6);
}

.section-nav-arrow-next:hover:not(:disabled) {
  box-shadow: 2px 2px 0px 0px rgba(102, 126, 234, 0.6);
}

.mute-toggle {
  width: 48px;
  padding: 0;
}

.section-nav-arrow:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.section-dots {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border: 2px solid #000;
  border-radius: 9999px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.section-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 2px solid #000;
  background: #fff;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.section-dot:hover {
  transform: scale(1.3);
}

.section-dot.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  width: 22px;
  border-radius: 9999px;
}

@media (max-width: 640px) {
  .section-nav-arrow {
    height: 42px;
    min-width: 42px;
    padding: 0 10px;
  }

  .mute-toggle {
    width: 42px;
    padding: 0;
  }

  .section-dots {
    padding: 8px 10px;
    gap: 6px;
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
